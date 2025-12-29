export type TopLanguage = {
  name: string;
  percent: number; // 0..1
};

export type RepoHighlight = {
  name: string;
  description: string;
  starsGained: number;
  mergedPRs: number;
};

export type ContributionDay = {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0=none, 1-4=intensity
};

export type UserProfile = {
  avatarUrl: string;
  createdAt: string; // ISO date string
  createdYear: number;
};

export type DeveloperYearStats = {
  year: number;
  handle: string;
  displayName: string;

  commits: number;
  pullRequests: number;
  mergedPRs: number;
  issues: number;
  reviews: number;
  starsGained: number;

  activeDays: number;
  maxStreakDays: number;
  nightOwlRate: number; // 0..1
  weekendRate: number; // 0..1

  topLanguages: TopLanguage[];
  highlightRepo: RepoHighlight;
  
  contributionCalendar?: ContributionDay[];
  profile?: UserProfile;
};

export type YearComparison = {
  current: DeveloperYearStats;
  previous: DeveloperYearStats | null;
  changes: {
    commits: number; // 百分比变化，如 0.3 表示增长 30%
    pullRequests: number;
    issues: number;
    reviews: number;
    activeDays: number;
  } | null;
};

export type PersonalityResult = {
  tag: string;
  codename: string;
  oneLiner: string;
  why: string[];
  signature: string;
};
