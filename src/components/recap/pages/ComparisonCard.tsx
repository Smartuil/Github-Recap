"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { YearComparison } from "@/lib/recap/types";

function formatChange(change: number): { text: string; color: string; icon: string } {
  if (change === 0) return { text: "持平", color: "text-zinc-400", icon: "→" };
  const pct = Math.abs(Math.round(change * 100));
  if (change > 0) {
    return { text: `+${pct}%`, color: "text-green-400", icon: "↑" };
  }
  return { text: `-${pct}%`, color: "text-red-400", icon: "↓" };
}

type ChangeItemProps = {
  label: string;
  current: number;
  previous: number;
  change: number;
};

function ChangeItem({ label, current, previous, change }: ChangeItemProps) {
  const { text, color, icon } = formatChange(change);
  return (
    <div className="flex items-center justify-between py-2">
      <div className="text-sm text-zinc-400">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">{previous.toLocaleString()}</span>
        <span className="text-zinc-500">→</span>
        <span className="font-mono text-sm text-zinc-200">{current.toLocaleString()}</span>
        <Badge className={`${color} bg-transparent text-xs`}>
          {icon} {text}
        </Badge>
      </div>
    </div>
  );
}

export function ComparisonCard({ comparison }: { comparison: YearComparison | null }) {
  if (!comparison || !comparison.previous || !comparison.changes) {
    return null;
  }

  const { current, previous, changes } = comparison;

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm text-zinc-300">
          <span>同比 {previous.year}</span>
          <Badge variant="secondary" className="border border-white/10 bg-white/5 text-zinc-200">
            YoY
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 divide-y divide-white/5">
        <ChangeItem
          label="Commits"
          current={current.commits}
          previous={previous.commits}
          change={changes.commits}
        />
        <ChangeItem
          label="Pull Requests"
          current={current.pullRequests}
          previous={previous.pullRequests}
          change={changes.pullRequests}
        />
        <ChangeItem
          label="Issues"
          current={current.issues}
          previous={previous.issues}
          change={changes.issues}
        />
        <ChangeItem
          label="Reviews"
          current={current.reviews}
          previous={previous.reviews}
          change={changes.reviews}
        />
        <ChangeItem
          label="活跃天数"
          current={current.activeDays}
          previous={previous.activeDays}
          change={changes.activeDays}
        />
      </CardContent>
    </Card>
  );
}
