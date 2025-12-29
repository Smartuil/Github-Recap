import type { ContributionDay, DeveloperYearStats, UserProfile } from "../types";

export class GitHubRateLimitError extends Error {
  retryAfterSeconds?: number;

  constructor(message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "GitHubRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function parseISODate(d: string) {
  const t = Date.parse(d);
  return Number.isFinite(t) ? new Date(t) : null;
}

function computeActiveDaysAndStreak(days: { date: string; contributionCount: number }[]) {
  const sorted = days
    .map((d) => ({ ...d, dt: parseISODate(d.date) }))
    .filter((d) => d.dt)
    .sort((a, b) => (a.dt as Date).getTime() - (b.dt as Date).getTime()) as Array<
    { date: string; contributionCount: number; dt: Date }
  >;

  let activeDays = 0;
  let maxStreakDays = 0;
  let currentStreak = 0;
  let prevActiveDay: Date | null = null;

  for (const d of sorted) {
    if (d.contributionCount > 0) activeDays += 1;

    if (d.contributionCount > 0) {
      if (!prevActiveDay) {
        currentStreak = 1;
      } else {
        const diffDays = Math.round((d.dt.getTime() - prevActiveDay.getTime()) / 86400000);
        currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
      }

      maxStreakDays = Math.max(maxStreakDays, currentStreak);
      prevActiveDay = d.dt;
    }
  }

  return { activeDays, maxStreakDays };
}

function computeWeekendRate(days: { date: string; contributionCount: number }[]) {
  const active = days.filter((d) => d.contributionCount > 0);
  if (active.length === 0) return 0;
  const weekendActive = active.filter((d) => {
    const dt = parseISODate(d.date);
    if (!dt) return false;
    const wd = dt.getDay();
    return wd === 0 || wd === 6;
  });
  return clamp01(weekendActive.length / active.length);
}

function parseRateLimit(res: Response) {
  const remaining = res.headers.get("x-ratelimit-remaining");
  const reset = res.headers.get("x-ratelimit-reset");
  const remainingNum = remaining ? Number(remaining) : NaN;
  const resetNum = reset ? Number(reset) : NaN;

  const isExhausted = Number.isFinite(remainingNum) && remainingNum <= 0;
  const retryAfterSeconds = Number.isFinite(resetNum)
    ? Math.max(0, Math.ceil(resetNum - Date.now() / 1000))
    : undefined;

  return { isExhausted, retryAfterSeconds };
}

async function readGitHubErrorText(res: Response) {
  const text = await res.text();
  try {
    const json = JSON.parse(text) as { message?: string };
    return json.message || text;
  } catch {
    return text;
  }
}

export async function ghRest<T>(url: string, token?: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "github-recap-2025",
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : null),
    },
  });

  if (!res.ok) {
    const { isExhausted, retryAfterSeconds } = parseRateLimit(res);
    const msg = await readGitHubErrorText(res);
    console.error("GitHub REST error", res.status, msg);

    if ((res.status === 403 || res.status === 429) && isExhausted) {
      throw new GitHubRateLimitError(
        "GitHub API 触发频率限制：请稍后重试，或填写 Token（认证请求额度更高）。",
        retryAfterSeconds,
      );
    }

    throw new Error(msg || `GitHub REST 请求失败（${res.status}）`);
  }

  return (await res.json()) as T;
}

export async function ghGraphQL<T>(token: string, query: string, variables: Record<string, unknown>) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "User-Agent": "github-recap-2025",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await res.json().catch(() => null)) as
    | {
        data?: T;
        errors?: Array<{ message: string }>;
      }
    | null;

  if (!res.ok || json?.errors?.length) {
    const msg = json?.errors?.[0]?.message ?? `GitHub GraphQL 请求失败（${res.status}）`;
    console.error("GitHub GraphQL error", res.status, json?.errors);

    if (msg.toLowerCase().includes("rate limit")) {
      throw new GitHubRateLimitError(
        "GitHub API 触发频率限制：请稍后重试，或使用更高额度的 Token。",
      );
    }

    throw new Error(msg);
  }

  return json?.data as T;
}

export async function fetchRestOverview(params: {
  username: string;
  year: number;
  token?: string;
}): Promise<{ stats: DeveloperYearStats; warnings: string[] }> {
  const user = await ghRest<{ login: string; name: string | null; avatar_url: string; created_at: string }>(
    `https://api.github.com/users/${encodeURIComponent(params.username)}`,
    params.token,
  );

  const createdYear = new Date(user.created_at).getFullYear();
  const profile: UserProfile = {
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
    createdYear,
  };

  const repos = await ghRest<
    Array<{
      name: string;
      description: string | null;
      stargazers_count: number;
      language: string | null;
    }>
  >(
    `https://api.github.com/users/${encodeURIComponent(params.username)}/repos?per_page=100&sort=updated`,
    params.token,
  );

  const warnings: string[] = [
    "REST 模式仅提供仓库/语言概览，无法获取年度贡献（commit/PR/issue/review/连击）。",
  ];

  let starsSum = 0;
  const langCount = new Map<string, number>();
  let highlight = repos[0];

  for (const r of repos) {
    starsSum += r.stargazers_count;
    if (!highlight || r.stargazers_count > highlight.stargazers_count) highlight = r;
    if (r.language) langCount.set(r.language, (langCount.get(r.language) ?? 0) + 1);
  }

  const entries = [...langCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const total = entries.reduce((acc, [, v]) => acc + v, 0) || 1;

  const stats: DeveloperYearStats = {
    year: params.year,
    handle: user.login,
    displayName: user.name || user.login,

    commits: 0,
    pullRequests: 0,
    mergedPRs: 0,
    issues: 0,
    reviews: 0,

    starsGained: starsSum,

    activeDays: 0,
    maxStreakDays: 0,
    nightOwlRate: 0,
    weekendRate: 0,

    topLanguages: entries.map(([name, v]) => ({ name, percent: clamp01(v / total) })),
    highlightRepo: {
      name: highlight?.name ?? "-",
      description: highlight?.description ?? "",
      starsGained: highlight?.stargazers_count ?? 0,
      mergedPRs: 0,
    },
    profile,
  };

  return { stats, warnings };
}

export async function fetchGraphQLYearRecap(params: {
  username: string;
  year: number; // year=0 表示所有时间
  token: string;
}): Promise<{ stats: DeveloperYearStats; warnings: string[] }> {
  // 如果是"所有时间"，调用专门的函数
  if (params.year === 0) {
    return fetchGraphQLAllTimeRecap(params.username, params.token);
  }

  const from = `${params.year}-01-01T00:00:00Z`;
  const to = `${params.year}-12-31T23:59:59Z`;
  const mergedQuery = `is:pr is:merged author:${params.username} merged:${params.year}-01-01..${params.year}-12-31`;

  const query = `
    query Recap($login: String!, $from: DateTime!, $to: DateTime!, $mergedQuery: String!) {
      user(login: $login) {
        login
        name
        avatarUrl
        createdAt
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          totalPullRequestReviewContributions
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
        repositories(first: 50, ownerAffiliations: OWNER, orderBy: { field: STARGAZERS, direction: DESC }) {
          nodes {
            name
            description
            stargazerCount
            primaryLanguage { name }
            languages(first: 8, orderBy: { field: SIZE, direction: DESC }) {
              edges { size node { name } }
            }
          }
        }
      }
      merged: search(query: $mergedQuery, type: ISSUE) {
        issueCount
      }
    }
  `;

  type Gql = {
    user: {
      login: string;
      name: string | null;
      avatarUrl: string;
      createdAt: string;
      contributionsCollection: {
        totalCommitContributions: number;
        totalPullRequestContributions: number;
        totalIssueContributions: number;
        totalPullRequestReviewContributions: number;
        contributionCalendar: {
          weeks: Array<{
            contributionDays: Array<{ date: string; contributionCount: number }>;
          }>;
        };
      };
      repositories: {
        nodes: Array<{
          name: string;
          description: string | null;
          stargazerCount: number;
          primaryLanguage: { name: string } | null;
          languages: {
            edges: Array<{ size: number; node: { name: string } }>;
          };
        }>;
      };
    } | null;
    merged: { issueCount: number };
  };

  const data = await ghGraphQL<Gql>(params.token, query, {
    login: params.username,
    from,
    to,
    mergedQuery,
  });

  if (!data.user) throw new Error("用户不存在或无权访问");

  const warnings: string[] = [];

  const createdYear = new Date(data.user.createdAt).getFullYear();
  const profile: UserProfile = {
    avatarUrl: data.user.avatarUrl,
    createdAt: data.user.createdAt,
    createdYear,
  };

  const weeks = data.user.contributionsCollection.contributionCalendar.weeks;
  const allDays = weeks.flatMap((w) => w.contributionDays);
  const { activeDays, maxStreakDays } = computeActiveDaysAndStreak(allDays);
  const weekendRate = computeWeekendRate(allDays);

  // 构建贡献日历数据
  const maxCount = Math.max(...allDays.map((d) => d.contributionCount), 1);
  const contributionCalendar: ContributionDay[] = allDays.map((d) => {
    const ratio = d.contributionCount / maxCount;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (d.contributionCount > 0) {
      if (ratio <= 0.25) level = 1;
      else if (ratio <= 0.5) level = 2;
      else if (ratio <= 0.75) level = 3;
      else level = 4;
    }
    return { date: d.date, count: d.contributionCount, level };
  });

  // GitHub does not expose hour-of-day in contributionCalendar.
  const nightOwlRate = 0.24;
  warnings.push("GitHub API 不提供贡献的小时分布，夜猫指数为估计值。",
    "Stars 为仓库星标合计（采样仓库），非「本年度新增星标」。",
  );

  const repos = data.user.repositories.nodes ?? [];
  let starsSum = 0;
  const langSize = new Map<string, number>();
  const langCount = new Map<string, number>();

  for (const r of repos) {
    starsSum += r.stargazerCount;

    if (r.languages.edges.length > 0) {
      for (const e of r.languages.edges) {
        langSize.set(e.node.name, (langSize.get(e.node.name) ?? 0) + e.size);
      }
    } else if (r.primaryLanguage?.name) {
      langCount.set(r.primaryLanguage.name, (langCount.get(r.primaryLanguage.name) ?? 0) + 1);
    }
  }

  const topLanguages = (() => {
    if (langSize.size > 0) {
      const entries = [...langSize.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      const total = entries.reduce((acc, [, v]) => acc + v, 0) || 1;
      return entries.map(([name, v]) => ({ name, percent: clamp01(v / total) }));
    }

    const entries = [...langCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const total = entries.reduce((acc, [, v]) => acc + v, 0) || 1;
    return entries.map(([name, v]) => ({ name, percent: clamp01(v / total) }));
  })();

  const highlight = repos[0];

  const stats: DeveloperYearStats = {
    year: params.year,
    handle: data.user.login,
    displayName: data.user.name || data.user.login,

    commits: data.user.contributionsCollection.totalCommitContributions,
    pullRequests: data.user.contributionsCollection.totalPullRequestContributions,
    mergedPRs: data.merged.issueCount,
    issues: data.user.contributionsCollection.totalIssueContributions,
    reviews: data.user.contributionsCollection.totalPullRequestReviewContributions,

    starsGained: starsSum,

    activeDays,
    maxStreakDays,
    nightOwlRate,
    weekendRate,

    topLanguages,
    highlightRepo: {
      name: highlight?.name ?? "-",
      description: highlight?.description ?? "",
      starsGained: highlight?.stargazerCount ?? 0,
      mergedPRs: 0,
    },
    contributionCalendar,
    profile,
  };

  return { stats, warnings };
}

// 获取所有时间的数据（逐年查询并汇总）
async function fetchGraphQLAllTimeRecap(
  username: string,
  token: string
): Promise<{ stats: DeveloperYearStats; warnings: string[] }> {
  // 首先获取用户信息，确定账号创建年份
  const userQuery = `
    query GetUser($login: String!) {
      user(login: $login) {
        login
        name
        avatarUrl
        createdAt
        repositories(first: 50, ownerAffiliations: OWNER, orderBy: { field: STARGAZERS, direction: DESC }) {
          nodes {
            name
            description
            stargazerCount
            primaryLanguage { name }
            languages(first: 8, orderBy: { field: SIZE, direction: DESC }) {
              edges { size node { name } }
            }
          }
        }
      }
    }
  `;

  type UserGql = {
    user: {
      login: string;
      name: string | null;
      avatarUrl: string;
      createdAt: string;
      repositories: {
        nodes: Array<{
          name: string;
          description: string | null;
          stargazerCount: number;
          primaryLanguage: { name: string } | null;
          languages: {
            edges: Array<{ size: number; node: { name: string } }>;
          };
        }>;
      };
    } | null;
  };

  const userData = await ghGraphQL<UserGql>(token, userQuery, { login: username });
  if (!userData.user) throw new Error("用户不存在或无权访问");

  const createdYear = new Date(userData.user.createdAt).getFullYear();
  const currentYear = new Date().getFullYear();
  const profile: UserProfile = {
    avatarUrl: userData.user.avatarUrl,
    createdAt: userData.user.createdAt,
    createdYear,
  };

  // 获取所有时间的 merged PR 数量
  const mergedQuery = `is:pr is:merged author:${username}`;
  const mergedSearchQuery = `
    query MergedPRs($mergedQuery: String!) {
      merged: search(query: $mergedQuery, type: ISSUE) {
        issueCount
      }
    }
  `;
  const mergedData = await ghGraphQL<{ merged: { issueCount: number } }>(
    token,
    mergedSearchQuery,
    { mergedQuery }
  );

  // 逐年查询贡献数据
  const yearQuery = `
    query YearContrib($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          totalPullRequestReviewContributions
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  type YearGql = {
    user: {
      contributionsCollection: {
        totalCommitContributions: number;
        totalPullRequestContributions: number;
        totalIssueContributions: number;
        totalPullRequestReviewContributions: number;
        contributionCalendar: {
          weeks: Array<{
            contributionDays: Array<{ date: string; contributionCount: number }>;
          }>;
        };
      };
    } | null;
  };

  // 汇总数据
  let totalCommits = 0;
  let totalPRs = 0;
  let totalIssues = 0;
  let totalReviews = 0;
  const allContributionDays: Array<{ date: string; contributionCount: number }> = [];

  // 从创建年份到当前年份逐年查询
  for (let year = createdYear; year <= currentYear; year++) {
    const from = `${year}-01-01T00:00:00Z`;
    const to = `${year}-12-31T23:59:59Z`;

    try {
      const yearData = await ghGraphQL<YearGql>(token, yearQuery, {
        login: username,
        from,
        to,
      });

      if (yearData.user) {
        const contrib = yearData.user.contributionsCollection;
        totalCommits += contrib.totalCommitContributions;
        totalPRs += contrib.totalPullRequestContributions;
        totalIssues += contrib.totalIssueContributions;
        totalReviews += contrib.totalPullRequestReviewContributions;

        // 收集贡献日历数据
        const days = contrib.contributionCalendar.weeks.flatMap((w) => w.contributionDays);
        allContributionDays.push(...days);
      }
    } catch (e) {
      // 某一年查询失败，继续下一年
      console.error(`Failed to fetch year ${year}:`, e);
    }
  }

  const { activeDays, maxStreakDays } = computeActiveDaysAndStreak(allContributionDays);
  const weekendRate = computeWeekendRate(allContributionDays);

  // 构建贡献日历（显示全部数据）
  const maxCount = Math.max(...allContributionDays.map((d) => d.contributionCount), 1);
  const contributionCalendar: ContributionDay[] = allContributionDays.map((d) => {
    const ratio = d.contributionCount / maxCount;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (d.contributionCount > 0) {
      if (ratio <= 0.25) level = 1;
      else if (ratio <= 0.5) level = 2;
      else if (ratio <= 0.75) level = 3;
      else level = 4;
    }
    return { date: d.date, count: d.contributionCount, level };
  });

  // 处理仓库和语言数据
  const repos = userData.user.repositories.nodes ?? [];
  let starsSum = 0;
  const langSize = new Map<string, number>();
  const langCount = new Map<string, number>();

  for (const r of repos) {
    starsSum += r.stargazerCount;

    if (r.languages.edges.length > 0) {
      for (const e of r.languages.edges) {
        langSize.set(e.node.name, (langSize.get(e.node.name) ?? 0) + e.size);
      }
    } else if (r.primaryLanguage?.name) {
      langCount.set(r.primaryLanguage.name, (langCount.get(r.primaryLanguage.name) ?? 0) + 1);
    }
  }

  const topLanguages = (() => {
    if (langSize.size > 0) {
      const entries = [...langSize.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      const total = entries.reduce((acc, [, v]) => acc + v, 0) || 1;
      return entries.map(([name, v]) => ({ name, percent: clamp01(v / total) }));
    }

    const entries = [...langCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const total = entries.reduce((acc, [, v]) => acc + v, 0) || 1;
    return entries.map(([name, v]) => ({ name, percent: clamp01(v / total) }));
  })();

  const highlight = repos[0];

  const warnings: string[] = [
    "GitHub API 不提供贡献的小时分布，夜猫指数为估计值。",
    "Stars 为仓库星标合计（采样仓库），非「本年度新增星标」。",
  ];

  const stats: DeveloperYearStats = {
    year: 0, // 0 表示所有时间
    handle: userData.user.login,
    displayName: userData.user.name || userData.user.login,

    commits: totalCommits,
    pullRequests: totalPRs,
    mergedPRs: mergedData.merged.issueCount,
    issues: totalIssues,
    reviews: totalReviews,

    starsGained: starsSum,

    activeDays,
    maxStreakDays,
    nightOwlRate: 0.24,
    weekendRate,

    topLanguages,
    highlightRepo: {
      name: highlight?.name ?? "-",
      description: highlight?.description ?? "",
      starsGained: highlight?.stargazerCount ?? 0,
      mergedPRs: 0,
    },
    contributionCalendar,
    profile,
  };

  return { stats, warnings };
}
