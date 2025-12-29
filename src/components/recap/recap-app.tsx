"use client";

import * as React from "react";

import { Progress } from "@/components/ui/progress";

import { Fullpage } from "@/components/recap/fullpage";
import { IntroPage } from "@/components/recap/pages/IntroPage";
import { LanguagePage } from "@/components/recap/pages/LanguagePage";
import { OutroPage } from "@/components/recap/pages/OutroPage";
import { PersonalityPage } from "@/components/recap/pages/PersonalityPage";
import { StatsPage } from "@/components/recap/pages/StatsPage";

import { fetchRecap, fetchUserProfile } from "@/lib/recap/api";
import { matchPersonality } from "@/lib/recap/personality";
import type { DeveloperYearStats, YearComparison } from "@/lib/recap/types";

const DEFAULT_YEAR = new Date().getFullYear();

function emptyStats(year: number): DeveloperYearStats {
  return {
    year,
    handle: "",
    displayName: "",

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
    highlightRepo: { name: "-", description: "", starsGained: 0, mergedPRs: 0 },
  };
}

function generateYearOptions(createdYear?: number): number[] {
  const currentYear = new Date().getFullYear();
  
  // 如果没有创建年份，只返回当前年份和所有时间
  if (!createdYear) {
    return [currentYear, 0]; // 0 表示所有时间
  }
  
  const years: number[] = [];
  // 从当前年份倒序到创建年份
  for (let y = currentYear; y >= createdYear; y--) {
    years.push(y);
  }
  // 添加"所有时间"选项
  years.push(0);
  
  return years;
}

export function RecapApp() {
  const [pageIndex, setPageIndex] = React.useState(0);

  const [year, setYear] = React.useState(DEFAULT_YEAR);
  const [username, setUsername] = React.useState("Smartuil");
  // Token 仅保存在内存里（不读写 localStorage）。
  const [token, setToken] = React.useState("");
  const [createdYear, setCreatedYear] = React.useState<number | undefined>(undefined);
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    // 客户端挂载后从 localStorage 读取 username
    const saved = window.localStorage.getItem("recap.username");
    if (saved) setUsername(saved);
    // 清理历史版本写入过的 token，避免误用。
    window.localStorage.removeItem("recap.token");
  }, []);

  // 用户名变化时，自动获取用户基本信息（头像、创建年份）
  React.useEffect(() => {
    const u = username.trim();
    if (!u) {
      setAvatarUrl(undefined);
      setCreatedYear(undefined);
      return;
    }

    const timer = setTimeout(async () => {
      const profile = await fetchUserProfile(u);
      if (profile) {
        setAvatarUrl(profile.avatarUrl);
        setCreatedYear(profile.createdYear);
      }
    }, 500); // 防抖 500ms

    return () => clearTimeout(timer);
  }, [username]);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [recap, setRecap] = React.useState<Awaited<ReturnType<typeof fetchRecap>> | null>(null);
  const [stats, setStats] = React.useState<DeveloperYearStats>(() => emptyStats(year));
  const [comparison, setComparison] = React.useState<YearComparison | null>(null);

  const personality = React.useMemo(() => matchPersonality(stats), [stats]);

  const availableYears = React.useMemo(() => generateYearOptions(createdYear), [createdYear]);

  const load = React.useCallback(async () => {
    const u = username.trim();
    if (!u) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchRecap({ username: u, year, token: token.trim() || undefined, includeComparison: true });
      setRecap(data);
      setStats(data.stats);
      setComparison(data.comparison);
      
      // 保存用户信息
      if (data.stats.profile) {
        setCreatedYear(data.stats.profile.createdYear);
        setAvatarUrl(data.stats.profile.avatarUrl);
      }
      
      window.localStorage.setItem("recap.username", u);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [token, username, year]);

  const handleStart = React.useCallback(() => {
    setPageIndex(1);
  }, []);

  const pages = React.useMemo<React.ReactNode[]>(() => {
    return [
      <IntroPage
        key="intro"
        year={year}
        availableYears={availableYears}
        username={username}
        token={token}
        avatarUrl={avatarUrl}
        onYearChange={setYear}
        onUsernameChange={setUsername}
        onTokenChange={setToken}
        onLoad={load}
        onStart={handleStart}
        loading={loading}
        error={error}
        recap={recap}
      />,
      <StatsPage key="stats" stats={stats} tag={personality.tag} comparison={comparison} />,
      <LanguagePage key="lang" stats={stats} tag={personality.tag} codename={personality.codename} />,
      <PersonalityPage key="p" stats={stats} personality={personality} />,
      <OutroPage key="outro" stats={stats} tag={personality.tag} />,
    ];
  }, [error, load, handleStart, loading, personality, recap, stats, comparison, token, username, year, availableYears, avatarUrl]);

  // 未加载完成时锁定滚动
  const isLocked = !recap;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-0 top-0 h-16 w-full bg-gradient-to-b from-black/70 to-transparent" />

      <Fullpage pages={pages} onIndexChange={setPageIndex} initialIndex={pageIndex} locked={isLocked} />

      <div className="pointer-events-none absolute bottom-3 left-1/2 w-[min(520px,92vw)] -translate-x-1/2 sm:bottom-5">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-2 backdrop-blur sm:gap-3 sm:px-4 sm:py-3">
          <div className="font-mono text-xs text-zinc-400">
            {String(pageIndex + 1).padStart(2, "0")}/{String(pages.length).padStart(2, "0")}
          </div>
          <Progress value={Math.round(((pageIndex + 1) / pages.length) * 100)} className="h-2 bg-white/10" />
          <div className="hidden font-mono text-xs text-zinc-500 sm:block">{isLocked ? "请先加载数据" : "scroll / ↑↓"}</div>
        </div>
      </div>
    </div>
  );
}
