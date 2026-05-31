export const BROKE_APP_BUILD_VERSION = "v59.43.2";

export const BROKE_APP_BUILD_NOTE =
  "Admin/Rewards extraction prep, shared constants, no payout or eligibility behavior changes.";

export const DEFAULT_TREASURY_WALLET_ADDRESS = "5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9";
export const DEFAULT_BROKE_TOKEN_MINT_ADDRESS = "9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray";
export const DEFAULT_USDC_TOKEN_MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export const REAL_DISTRIBUTION_CONFIRM_PHRASE = "PREPARE REAL DISTRIBUTION";
export const SERVER_AUTO_SEND_CONFIRM_PHRASE = "SERVER AUTO SEND";

export function parseAdminCsv(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function walletAddressEquals(a: string, b: string) {
  return a.trim() !== "" && b.trim() !== "" && a.trim() === b.trim();
}
