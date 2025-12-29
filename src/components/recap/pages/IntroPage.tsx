"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { RecapResponse } from "@/lib/recap/api";
import { HeaderBar } from "./shared";

export function IntroPage(props: {
  year: number;
  availableYears: number[];
  username: string;
  token: string;
  avatarUrl?: string;
  onYearChange: (v: number) => void;
  onUsernameChange: (v: string) => void;
  onTokenChange: (v: string) => void;
  onLoad: () => void;
  onStart: () => void;
  loading: boolean;
  error: string | null;
  recap: RecapResponse | null;
}) {
  const sourceBadge = props.recap?.meta.source ? (
    <Badge variant="secondary" className="border border-white/10 bg-white/5 text-zinc-200">
      {props.recap.meta.source === "graphql" ? "GraphQL(年度贡献)" : "REST(概览)"}
    </Badge>
  ) : null;

  const isLoaded = !!props.recap;

  return (
    <Card className="cyber-surface border-white/10 w-full max-w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-4">
          <span className="font-mono text-sm text-zinc-300">BOOT SEQUENCE</span>
          <span className="font-mono text-xs cyber-accent cyber-glow">{isLoaded ? "LOADED" : "READY"}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6">
        <HeaderBar handle={props.username || "input"} year={props.year} right={sourceBadge} />

        <div className="space-y-2">
          <div className="text-2xl font-semibold tracking-tight sm:text-4xl">
            输入 GitHub 用户名，生成你的 {props.year === 0 ? "全部" : props.year}
            <span className="cyber-accent cyber-glow"> 终端报告</span>
          </div>
          <p className="max-w-3xl text-sm text-zinc-300 sm:text-base">
            直接输入用户名即可加载数据。若你希望拿到更完整的年度贡献（commit / PR / issue / review / 连击），
            可选填一个 GitHub Token（仅用于请求，不会写入仓库）。
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
          <div className="min-w-0 space-y-2">
            <div className="text-sm text-zinc-400">GitHub 用户名</div>
            <div className="flex items-center gap-2">
              {props.avatarUrl && (
                <img
                  src={props.avatarUrl}
                  alt="avatar"
                  className="h-10 w-10 rounded-full border border-white/10"
                />
              )}
              <Input
                value={props.username}
                onChange={(e) => props.onUsernameChange(e.target.value)}
                placeholder="例如：torvalds"
                className="w-full border-white/10 bg-black/30 font-mono"
              />
            </div>
          </div>

          <div className="min-w-0 space-y-2">
            <div className="text-sm text-zinc-400">GitHub Token（可选）</div>
            <Input
              value={props.token}
              onChange={(e) => props.onTokenChange(e.target.value)}
              placeholder="ghp_...（可选）"
              className="w-full border-white/10 bg-black/30 font-mono"
            />
          </div>

          <div className="min-w-0 space-y-2">
            <div className="text-sm text-zinc-400">选择年份</div>
            <Select value={String(props.year)} onValueChange={(v) => props.onYearChange(Number(v))}>
              <SelectTrigger className="w-full border-white/10 bg-black/30 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {props.availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y === 0 ? "所有时间" : `${y} 年`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isLoaded ? (
            <Button
              className="bg-[color:var(--cyber-accent)] text-black hover:bg-[color:var(--cyber-accent)]/80 font-semibold"
              onClick={props.onStart}
            >
              开始浏览 →
            </Button>
          ) : (
            <Button
              className="bg-[color:var(--cyber-accent)]/20 text-[color:var(--cyber-accent)] hover:bg-[color:var(--cyber-accent)]/30"
              onClick={props.onLoad}
              disabled={props.loading || !props.username.trim()}
            >
              {props.loading ? "加载中…" : "加载报告"}
            </Button>
          )}

          {props.error ? <div className="text-sm text-red-300">{props.error}</div> : null}

          {!isLoaded && (
            <div className="hidden text-sm text-zinc-400 sm:block">加载完成后可滑动浏览</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
