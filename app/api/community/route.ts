import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type CommunitySource = "telegram" | "web" | "system";

type CommunityMessage = {
  id: string;
  senderName: string;
  username: string | null;
  text: string;
  source: CommunitySource;
  createdAt: string;
};

function getOptionalEnv(name: string) {
  return process.env[name] || "";
}


function isWebCommunityPostingEnabled() {
  return getOptionalEnv("COMMUNITY_WEB_POSTING_ENABLED") === "true";
}

function getCommunityWriteSecret() {
  return getOptionalEnv("COMMUNITY_WRITE_SECRET");
}

function isCommunityWriteAuthorized(request: NextRequest) {
  const secret = getCommunityWriteSecret();

  if (!secret) return false;

  const key = request.nextUrl.searchParams.get("key");
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  return key === secret || bearer === secret;
}

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getSupabaseHeaders() {
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
}

function getSupabaseBaseUrl() {
  return getEnv("SUPABASE_URL")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
}

function supabaseUrl(path: string) {
  return `${getSupabaseBaseUrl()}/rest/v1/${path}`;
}

async function supabaseFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(supabaseUrl(path), {
    ...options,
    headers: {
      ...getSupabaseHeaders(),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error ${response.status}: ${text}`);
  }

  if (response.status === 204) return null;

  const text = await response.text();

  return text ? JSON.parse(text) : null;
}

function cleanText(value: unknown, max = 500) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanName(value: unknown) {
  const name = cleanText(value, 32);
  return name || "Web visitor";
}

function dbToMessage(row: Record<string, unknown>): CommunityMessage {
  return {
    id: String(row.id),
    senderName: String(row.sender_name || "Community"),
    username: row.username ? String(row.username) : null,
    text: String(row.text || ""),
    source: String(row.source || "telegram") as CommunitySource,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

async function getMessages() {
  const rows = (await supabaseFetch(
    "broke_community_messages?select=id,sender_name,username,text,source,created_at&order=created_at.desc&limit=40"
  )) as Record<string, unknown>[];

  return rows.map(dbToMessage).reverse();
}

async function saveMessage(input: {
  senderName: string;
  username: string | null;
  text: string;
  source: CommunitySource;
  telegramMessageId?: number | null;
}) {
  try {
    await supabaseFetch("broke_community_messages", {
      method: "POST",
      body: JSON.stringify({
        sender_name: input.senderName,
        username: input.username,
        text: input.text,
        source: input.source,
        telegram_message_id: input.telegramMessageId ?? null,
        created_at: new Date().toISOString(),
      }),
    });
  } catch {
    // Feed logging must not block Telegram sending.
  }
}

async function sendToTelegram(text: string, senderName: string) {
  const botToken = getEnv("TELEGRAM_BOT_TOKEN");
  const chatId = getEnv("TELEGRAM_GROUP_ID");

  const message = `💬 Website message\n\n${senderName}: ${text}`;

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      disable_web_page_preview: true,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.description || "Telegram sendMessage failed");
  }

  return Number(data.result?.message_id || 0);
}

export async function GET() {
  try {
    const messages = await getMessages();

    return NextResponse.json({
      ok: true,
      configured: {
        supabase: true,
        telegramBot: Boolean(getOptionalEnv("TELEGRAM_BOT_TOKEN")),
        telegramGroup: Boolean(getOptionalEnv("TELEGRAM_GROUP_ID")),
      },
      messages,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Community API failed",
        messages: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isWebCommunityPostingEnabled()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Community web posting is disabled. The public feed remains read-only.",
        },
        { status: 403 }
      );
    }

    if (!isCommunityWriteAuthorized(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const action = String(body.action || "");

    if (action !== "send") {
      return NextResponse.json(
        { ok: false, error: "Unknown action" },
        { status: 400 }
      );
    }

    const text = cleanText(body.text, 500);
    const senderName = cleanName(body.senderName);
    const username = body.username ? cleanText(body.username, 32) : null;

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "Message is empty" },
        { status: 400 }
      );
    }

    const telegramMessageId = await sendToTelegram(text, senderName);

    await saveMessage({
      senderName,
      username,
      text,
      source: "web",
      telegramMessageId,
    });

    const messages = await getMessages();

    return NextResponse.json({
      ok: true,
      messages,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Message was not sent",
      },
      { status: 500 }
    );
  }
}
