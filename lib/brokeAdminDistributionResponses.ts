import { NextRequest } from "next/server";

import { cleanAdminString as cleanString, normalizeAdminDistributionId } from "./brokeAdminApi";
import {
  formatAdminDistribution,
  type AdminDistributionRow,
  type AdminPayoutRow,
} from "./brokeAdminDistributionStore";

export type AdminDistributionRouteErrorPayload = {
  ok: false;
  error: string;
  code: string;
  distributionId?: string;
  action?: string;
};

export type AdminDistributionRouteError = {
  status: 400 | 404 | 409 | 500;
  payload: AdminDistributionRouteErrorPayload;
};

export type AdminDistributionJsonBodyResult<T> =
  | {
      ok: true;
      body: T;
    }
  | {
      ok: false;
      status: 400;
      payload: AdminDistributionRouteErrorPayload;
    };

export async function readAdminDistributionJsonBody<T>(
  request: NextRequest,
  fallbackError = "Invalid JSON body."
): Promise<AdminDistributionJsonBodyResult<T>> {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return {
        ok: false,
        status: 400,
        payload: {
          ok: false,
          error: fallbackError,
          code: "invalid_json_body",
        },
      };
    }

    return {
      ok: true,
      body: body as T,
    };
  } catch {
    return {
      ok: false,
      status: 400,
      payload: {
        ok: false,
        error: fallbackError,
        code: "invalid_json_body",
      },
    };
  }
}

export function getAdminDistributionIdQuery(request: NextRequest):
  | {
      ok: true;
      distributionId: string;
    }
  | {
      ok: false;
      status: 400;
      payload: AdminDistributionRouteErrorPayload;
    } {
  const rawDistributionId = request.nextUrl.searchParams.get("distributionId");

  if (rawDistributionId === null || cleanString(rawDistributionId, 100) === "") {
    return { ok: true, distributionId: "" };
  }

  const distributionId = normalizeAdminDistributionId(rawDistributionId);

  if (!distributionId) {
    return {
      ok: false,
      status: 400,
      payload: {
        ok: false,
        error: "Valid distributionId is required when the distributionId query parameter is provided.",
        code: "invalid_distribution_id",
      },
    };
  }

  return { ok: true, distributionId };
}

export function getAdminDistributionNotFoundError(distributionId: string): AdminDistributionRouteError {
  return {
    status: 404,
    payload: {
      ok: false,
      error: "Distribution was not found.",
      code: "distribution_not_found",
      distributionId,
    },
  };
}

export function getAdminDistributionPatchActionError(action: unknown): AdminDistributionRouteError {
  return {
    status: 400,
    payload: {
      ok: false,
      error: "Unsupported distribution action.",
      code: "unsupported_distribution_action",
      action: cleanString(action, 80),
    },
  };
}

export function getAdminDistributionEmptyPayoutsError(distributionId: string): AdminDistributionRouteError {
  return {
    status: 409,
    payload: {
      ok: false,
      error: "Distribution has no payout rows to update.",
      code: "distribution_has_no_payout_rows",
      distributionId,
    },
  };
}

export function buildAdminDistributionGetPayload({
  distributionId,
  distribution,
  payouts,
}: {
  distributionId: string;
  distribution: AdminDistributionRow | null;
  payouts: AdminPayoutRow[];
}) {
  if (!distribution) {
    return {
      ok: true,
      found: false,
      distributionId,
      distribution: null,
      payouts: [],
    };
  }

  return {
    ok: true,
    found: true,
    distributionId,
    distribution: formatAdminDistribution(distribution),
    payouts,
  };
}

export function buildAdminDistributionListPayload({
  distributions,
  limit,
}: {
  distributions: AdminDistributionRow[];
  limit: number;
}) {
  return {
    ok: true,
    count: distributions.length,
    limit,
    distributions: distributions.map(formatAdminDistribution),
  };
}
