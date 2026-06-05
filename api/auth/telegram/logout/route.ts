import { NextResponse } from "next/server";

export const runtime = "nodejs";

const WEB_AUTH_COOKIE = "broke_tg_session";

export async function GET() {
  const response = NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_WEBAPP_URL || "https://nextjs-boilerplate-sigma-jet-34.vercel.app"));

  response.cookies.set(WEB_AUTH_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 0,
  });

  return response;
}
