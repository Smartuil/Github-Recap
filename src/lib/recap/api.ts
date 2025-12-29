import type { DeveloperYearStats, UserProfile, YearComparison } from "./types";

type RecapMeta = {
  source: "graphql" | "rest";
  warnings: string[];
};

export type RecapResponse = {
  stats: DeveloperYearStats;
  comparison: YearComparison | null;
  meta: RecapMeta;
};

export async function fetchRecap(params: {
  username: string;
  year: number;
  token?: string;
  includeComparison?: boolean;
}): Promise<RecapResponse> {
  const res = await fetch("/api/recap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: params.username,
      year: params.year,
      token: params.token ? params.token : undefined,
      includeComparison: params.includeComparison ?? true,
    }),
  });

  const json = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const message =
      typeof json === "object" && json && "error" in json ? String((json as any).error) : "请求失败";
    throw new Error(message);
  }

  return json as RecapResponse;
}

export async function fetchUserProfile(username: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: {
        "User-Agent": "github-recap",
        Accept: "application/vnd.github+json",
      },
    });
    
    if (!res.ok) return null;
    
    const data = await res.json() as { avatar_url: string; created_at: string };
    const createdYear = new Date(data.created_at).getFullYear();
    
    return {
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
      createdYear,
    };
  } catch {
    return null;
  }
}
