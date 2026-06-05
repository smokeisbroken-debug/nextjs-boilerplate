import { NextResponse } from "next/server";

import { BROKE_APP_BUILD_VERSION } from "./brokeAdminRewards";

export const BROKE_ADMIN_API_NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export const BROKE_REWARD_DISTRIBUTION_SCHEMA_HINT =
  "Run the v59.43.1 schema repair pack or the reward distribution ledger migration first if the table is missing.";

export function adminApiJson(data: unknown, status = 200) {
  const payload = data && typeof data === "object" && !Array.isArray(data)
    ? { ...(data as Record<string, unknown>), buildVersion: BROKE_APP_BUILD_VERSION }
    : data;

  return NextResponse.json(payload, {
    status,
    headers: BROKE_ADMIN_API_NO_STORE_HEADERS,
  });
}

export function getRequiredAdminEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getOptionalAdminEnv(name: string) {
  return process.env[name] || "";
}

export function safeAdminNumber(value: unknown, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(/,/g, "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function cleanAdminString(value: unknown, maxLength = 260) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export function normalizeAdminDistributionId(value: unknown) {
  const id = cleanAdminString(value, 80);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : "";
}

export function normalizeAdminTxSignature(value: unknown) {
  const tx = cleanAdminString(value, 140).replace(/^https?:\/\/[^\s/]+\/tx\//i, "");
  return /^[1-9A-HJ-NP-Za-km-z]{40,120}$/.test(tx) ? tx : "";
}

export function formatAdminError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function formatAdminRewardDistributionError(error: unknown, fallback: string) {
  const message = formatAdminError(error, fallback);

  if (message.includes("broke_reward_distributions") || message.includes("broke_reward_payouts")) {
    return `${message}. ${BROKE_REWARD_DISTRIBUTION_SCHEMA_HINT}`;
  }

  return message;
}
