import type { DeveloperYearStats, YearComparison } from "../types";
import {
  fetchGraphQLYearRecap,
  fetchRestOverview,
  GitHubRateLimitError,
} from "./github";

export type RecapMeta = {
  source: "graphql" | "rest";
  warnings: string[];
};

export type RecapResponse = {
  stats: DeveloperYearStats;
  comparison: YearComparison | null;
  meta: RecapMeta;
};

const CACHE_TTL_MS = 60_000;
const restCache = new Map<string, { expiresAt: number; value: Omit<RecapResponse, "comparison"> }>();

export function normalizeUsername(username: string) {
  return username.trim();
}

export function validateYear(year: number) {
  // year=0 表示所有时间
  return Number.isFinite(year) && (year === 0 || (year >= 2008 && year <= 2100));
}

export function getRetryAfterSeconds(err: unknown) {
  return err instanceof GitHubRateLimitError ? err.retryAfterSeconds : undefined;
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 1 : 0;
  return (current - previous) / previous;
}

function buildComparison(current: DeveloperYearStats, previous: DeveloperYearStats | null): YearComparison {
  if (!previous) {
    return { current, previous: null, changes: null };
  }
  return {
    current,
    previous,
    changes: {
      commits: calcChange(current.commits, previous.commits),
      pullRequests: calcChange(current.pullRequests, previous.pullRequests),
      issues: calcChange(current.issues, previous.issues),
      reviews: calcChange(current.reviews, previous.reviews),
      activeDays: calcChange(current.activeDays, previous.activeDays),
    },
  };
}

async function fetchYearStats(params: {
  username: string;
  year: number;
  token: string;
  useGraphQL: boolean;
}): Promise<{ stats: DeveloperYearStats; warnings: string[] }> {
  if (params.useGraphQL && params.token) {
    return fetchGraphQLYearRecap({
      username: params.username,
      year: params.year,
      token: params.token,
    });
  }
  return fetchRestOverview({
    username: params.username,
    year: params.year,
  });
}

export async function getRecap(params: {
  username: string;
  year: number;
  tokenFromClient?: string;
  includeComparison?: boolean;
}): Promise<RecapResponse> {
  const tokenFromEnv = (process.env.GITHUB_TOKEN ?? "").trim();
  const token = (params.tokenFromClient ?? "").trim() || tokenFromEnv;
  const includeComparison = params.includeComparison ?? true;

  if (token) {
    const { stats, warnings } = await fetchGraphQLYearRecap({
      username: params.username,
      year: params.year,
      token,
    });

    if (!params.tokenFromClient && tokenFromEnv) {
      warnings.unshift("服务端已配置 GITHUB_TOKEN：无需填写 Token 也能获取年度贡献。");
    }

    let comparison: YearComparison | null = null;
    // year=0 表示所有时间，不进行年度对比
    if (includeComparison && params.year > 2008) {
      try {
        const prevResult = await fetchYearStats({
          username: params.username,
          year: params.year - 1,
          token,
          useGraphQL: true,
        });
        comparison = buildComparison(stats, prevResult.stats);
      } catch {
        comparison = buildComparison(stats, null);
      }
    }

    return {
      stats,
      comparison,
      meta: {
        source: "graphql",
        warnings,
      },
    };
  }

  const key = `rest:${params.username}:${params.year}`;
  const hit = restCache.get(key);
  const baseValue = hit && hit.expiresAt > Date.now() ? hit.value : null;

  let stats: DeveloperYearStats;
  let warnings: string[];

  if (baseValue) {
    stats = baseValue.stats;
    warnings = [...baseValue.meta.warnings];
  } else {
    const result = await fetchRestOverview({
      username: params.username,
      year: params.year,
    });
    stats = result.stats;
    warnings = [
      ...result.warnings,
      "建议配置 GITHUB_TOKEN（.env.local）或在页面里填写 Token，以避免公共 API 限流。",
    ];

    restCache.set(key, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      value: { stats, meta: { source: "rest", warnings } },
    });
  }

  let comparison: YearComparison | null = null;
  // year=0 表示所有时间，不进行年度对比
  if (includeComparison && params.year > 2008) {
    try {
      const prevResult = await fetchRestOverview({
        username: params.username,
        year: params.year - 1,
      });
      comparison = buildComparison(stats, prevResult.stats);
    } catch {
      comparison = buildComparison(stats, null);
    }
  }

  return {
    stats,
    comparison,
    meta: {
      source: "rest",
      warnings,
    },
  };
}
