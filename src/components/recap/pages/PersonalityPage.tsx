"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { DeveloperYearStats, PersonalityResult } from "@/lib/recap/types";
import { HeaderBar, safeCopy } from "./shared";

export function PersonalityPage(props: {
  stats: DeveloperYearStats;
  personality: PersonalityResult;
}) {
  return (
    <Card className="cyber-surface border-white/10">
      <CardHeader>
        <CardTitle className="font-mono text-sm text-zinc-300">MATCHED ARCHETYPE</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <HeaderBar handle={props.stats.handle} year={props.stats.year} tag={props.personality.tag} />

        <div className="space-y-2 sm:space-y-3">
          <div className="text-sm text-zinc-400">专属人格标签</div>
          <div className="text-3xl font-semibold tracking-tight cyber-accent cyber-glow sm:text-5xl">
            {props.personality.tag}
          </div>
          <div className="font-mono text-xs text-zinc-400 sm:text-sm">{props.personality.codename}</div>
        </div>

        <Card className="border-white/10 bg-white/5">
          <CardContent className="space-y-3 pt-4 sm:space-y-4 sm:pt-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="text-base text-zinc-200 sm:text-lg"
            >
              {props.personality.oneLiner}
            </motion.div>

            <Separator className="bg-white/10" />

            <div className="space-y-2">
              {props.personality.why.map((line) => (
                <div key={line} className="text-sm text-zinc-300">
                  <span className="cyber-accent">▸</span> {line}
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-xs text-zinc-200 sm:p-4 sm:text-sm">
              <span className="text-zinc-400">signature</span>
              <span className="text-zinc-500">::</span> {props.personality.signature}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="bg-[color:var(--cyber-accent)]/20 text-[color:var(--cyber-accent)] hover:bg-[color:var(--cyber-accent)]/30"
            onClick={() =>
              safeCopy(
                [
                  `GitHub Recap ${props.stats.year}`,
                  `${props.stats.displayName} (@${props.stats.handle})`,
                  `人格标签：${props.personality.tag} · ${props.personality.codename}`,
                  ...props.personality.why,
                ].join("\n"),
              )
            }
          >
            复制完整总结
          </Button>

          <div className="hidden text-sm text-zinc-400 sm:block">复制后直接贴到你的个人主页 / 朋友圈。</div>
        </div>
      </CardContent>
    </Card>
  );
}
