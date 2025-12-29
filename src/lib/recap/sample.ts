import type { DeveloperYearStats } from "./types";

// NOTE: 仅用于开发时的兜底展示。真实数据请走 /api/recap。
export const sample2025: DeveloperYearStats = {
  year: 2025,
  handle: "octocat",
  displayName: "The Octocat",

  commits: 0,
  pullRequests: 0,
  mergedPRs: 0,
  issues: 0,
  reviews: 0,
  starsGained: 0,

  activeDays: 0,
  maxStreakDays: 0,
  nightOwlRate: 0,
  weekendRate: 0,

  topLanguages: [],
  highlightRepo: {
    name: "-",
    description: "",
    starsGained: 0,
    mergedPRs: 0,
  },
};
