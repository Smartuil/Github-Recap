"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { ContributionDay } from "@/lib/recap/types";

const LEVEL_COLORS = [
  "bg-zinc-800", // 0 - no contributions
  "bg-emerald-900", // 1
  "bg-emerald-700", // 2
  "bg-emerald-500", // 3
  "bg-emerald-400", // 4
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

type Week = ContributionDay[];

function groupByWeeks(days: ContributionDay[]): Week[] {
  if (days.length === 0) return [];

  const weeks: Week[] = [];
  let currentWeek: Week = [];

  // 按日期排序
  const sortedDays = [...days].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const day of sortedDays) {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay(); // 0 = Sunday

    // 如果是周日且当前周有数据，开始新的一周
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentWeek.push(day);
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

function getMonthLabels(weeks: Week[]): { month: string; weekIndex: number }[] {
  const labels: { month: string; weekIndex: number }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, weekIndex) => {
    const firstDay = week[0];
    if (!firstDay) return;

    const date = new Date(firstDay.date);
    const month = date.getMonth();

    if (month !== lastMonth) {
      labels.push({ month: MONTHS[month], weekIndex });
      lastMonth = month;
    }
  });

  return labels;
}

export function HeatmapCard({ calendar, year }: { calendar?: ContributionDay[]; year: number }) {
  if (!calendar || calendar.length === 0) {
    return null;
  }

  const weeks = groupByWeeks(calendar);
  const monthLabels = getMonthLabels(weeks);
  const totalContributions = calendar.reduce((sum, d) => sum + d.count, 0);
  const isAllTime = year === 0;
  const titleLabel = isAllTime ? "全部贡献热力图" : `${year} 贡献热力图`;

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-4 text-sm text-zinc-300">
          <span>{titleLabel}</span>
          <span className="font-mono text-xs text-zinc-400">
            {totalContributions.toLocaleString()} contributions
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className={isAllTime ? "overflow-x-auto" : ""}>
        {/* Grid */}
        <div className="flex" style={isAllTime ? { minWidth: `${Math.max(weeks.length * 14, 600)}px` } : undefined}>
          {/* Day labels */}
          <div className="flex flex-shrink-0 flex-col gap-[2px] pr-1">
            <div className="h-4" /> {/* 月份标签占位 */}
            {DAYS.map((day, i) => (
              <div key={i} className="h-[10px] w-5 text-right text-[10px] leading-[10px] text-zinc-500">
                {day}
              </div>
            ))}
          </div>

          {/* Weeks container */}
          <div className="flex flex-1 flex-col">
            {/* Month labels */}
            <div className="flex h-4">
              {monthLabels.map(({ month, weekIndex }, idx) => {
                const nextWeekIndex = monthLabels[idx + 1]?.weekIndex ?? weeks.length;
                const spanWeeks = nextWeekIndex - weekIndex;
                return (
                  <div
                    key={`${month}-${weekIndex}`}
                    className="text-xs text-zinc-500"
                    style={{ flex: spanWeeks }}
                  >
                    {month}
                  </div>
                );
              })}
            </div>

            {/* Weeks grid */}
            <div className="flex flex-1 gap-[2px]">
              {weeks.map((week, weekIndex) => {
                const firstDayOfWeek =
                  weekIndex === 0 && week[0]
                    ? new Date(week[0].date).getDay()
                    : 0;
                const padBefore = weekIndex === 0 ? firstDayOfWeek : 0;

                return (
                  <div key={weekIndex} className="flex flex-1 flex-col gap-[2px]">
                    {Array.from({ length: padBefore }).map((_, i) => (
                      <div key={`pad-${i}`} className="aspect-square w-full" />
                    ))}
                    {week.map((day) => (
                      <div
                        key={day.date}
                        className={`aspect-square w-full rounded-sm ${LEVEL_COLORS[day.level]} transition-colors hover:ring-1 hover:ring-white/30`}
                        title={`${day.date}: ${day.count} contributions`}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-2 flex items-center justify-end gap-1">
          <span className="text-[10px] text-zinc-500">Less</span>
          {LEVEL_COLORS.map((color, i) => (
            <div key={i} className={`h-[10px] w-[10px] rounded-sm ${color}`} />
          ))}
          <span className="text-[10px] text-zinc-500">More</span>
        </div>
      </CardContent>
    </Card>
  );
}
