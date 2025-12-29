import { NextResponse } from "next/server";

import {
  getRecap,
  getRetryAfterSeconds,
  normalizeUsername,
  validateYear,
} from "@/lib/recap/server/recap";
import { GitHubRateLimitError } from "@/lib/recap/server/github";

function jsonError(message: string, status = 400, headers?: Record<string, string>) {
  return NextResponse.json({ error: message }, { status, headers });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { username?: string; year?: number; token?: string; includeComparison?: boolean }
    | null;

  const username = normalizeUsername(body?.username ?? "");
  const year = body?.year ?? new Date().getFullYear();
  const tokenFromClient = (body?.token ?? "").trim();
  const includeComparison = body?.includeComparison ?? true;

  if (!username) return jsonError("请提供 GitHub 用户名（username）");
  if (!validateYear(year)) return jsonError("year 参数不合法");

  try {
    const resp = await getRecap({ username, year, tokenFromClient, includeComparison });
    return NextResponse.json(resp);
  } catch (e) {
    console.error(e);

    const retryAfter = getRetryAfterSeconds(e);
    if (e instanceof GitHubRateLimitError) {
      return jsonError(e.message, 429, retryAfter ? { "Retry-After": String(retryAfter) } : undefined);
    }

    const msg = e instanceof Error ? e.message : "获取 GitHub 数据失败";
    return jsonError(msg, 500);
  }
}
