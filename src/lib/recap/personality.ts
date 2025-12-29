import type { DeveloperYearStats, PersonalityResult } from "./types";

type Archetype = {
  key: string;
  tag: string;
  codename: string;
  score: (s: DeveloperYearStats) => number;
  oneLiner: (s: DeveloperYearStats) => string;
  why: (s: DeveloperYearStats) => string[];
  signature: (s: DeveloperYearStats) => string;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function norm(n: number, min: number, max: number) {
  if (max <= min) return 0;
  return clamp01((n - min) / (max - min));
}

const archetypes: Archetype[] = [
  {
    key: "night_builder",
    tag: "夜行构建者",
    codename: "NEON: AFTERHOURS",
    score: (s) => {
      const night = s.nightOwlRate > 0 ? s.nightOwlRate : 0.22;
      const volume = norm(s.commits, 50, 3000);
      const streak = norm(s.maxStreakDays, 3, 60);
      return 0.55 * night + 0.25 * volume + 0.2 * streak;
    },
    oneLiner: () => `当世界安静下来，你把系统拼得更响。`,
    why: (s) => [
      `夜猫指数 ${(s.nightOwlRate * 100).toFixed(0)}%：你把深夜当作编译器缓存。`,
      `最长连击 ${s.maxStreakDays} 天：节奏稳定，输出持续。`,
      `提交 ${s.commits.toLocaleString()} 次：有想法就立刻落地。`,
    ],
    signature: () => "今晚不睡，明天更稳。",
  },
  {
    key: "merge_conductor",
    tag: "合并指挥官",
    codename: "MERGE: CONDUCTOR",
    score: (s) => {
      const mergeRate = s.pullRequests === 0 ? 0 : s.mergedPRs / s.pullRequests;
      const merge = clamp01(mergeRate);
      const reviews = norm(s.reviews, 10, 500);
      const prs = norm(s.pullRequests, 5, 220);
      return 0.45 * merge + 0.35 * reviews + 0.2 * prs;
    },
    oneLiner: () => "你不只是写代码，你在调度协作的节拍。",
    why: (s) => {
      const mergeRate = s.pullRequests === 0 ? 0 : s.mergedPRs / s.pullRequests;
      return [
        `PR 合并率 ${(mergeRate * 100).toFixed(0)}%：推进力强，落地为王。`,
        `代码审查 ${s.reviews} 次：让团队在同一条轨道上加速。`,
        `PR ${s.pullRequests} 次：你更像"把想法交付"的人。`,
      ];
    },
    signature: () => "把不确定性压进主分支。",
  },
  {
    key: "bug_hunter",
    tag: "故障猎手",
    codename: "DEBUG: HUNTER",
    score: (s) => {
      const issues = norm(s.issues, 5, 160);
      const reviews = norm(s.reviews, 10, 500);
      const consistency = norm(s.activeDays, 30, 300);
      return 0.45 * issues + 0.25 * reviews + 0.3 * consistency;
    },
    oneLiner: () => "你擅长在噪声里找到真正的异常。",
    why: (s) => [
      `Issues ${s.issues} 个：你愿意直面问题本身。`,
      `活跃 ${s.activeDays} 天：问题处理靠的是持续而非爆发。`,
      `审查 ${s.reviews} 次：你习惯在"边界条件"里发现风险。`,
    ],
    signature: () => "让系统在极端情况下也保持礼貌。",
  },
  {
    key: "craft_tinkerer",
    tag: "霓虹修补匠",
    codename: "PATCH: ARTISAN",
    score: (s) => {
      const variety = clamp01(Math.min(1, s.topLanguages.length / 6));
      const volume = norm(s.commits, 50, 2800);
      const weekend = s.weekendRate > 0 ? s.weekendRate : 0.15;
      return 0.35 * variety + 0.45 * volume + 0.2 * weekend;
    },
    oneLiner: () => "你把复杂拆成小块，再把小块打磨到顺手。",
    why: (s) => [
      `语言栈覆盖 ${s.topLanguages.length} 种：哪里需要就去哪里。`,
      `提交 ${s.commits.toLocaleString()} 次：细节主义的日常。`,
      `周末活跃 ${(s.weekendRate * 100).toFixed(0)}%：灵感来了就开工。`,
    ],
    signature: () => "小改动叠起来，就是大跃迁。",
  },
  {
    key: "open_source_evangelist",
    tag: "开源布道者",
    codename: "OPEN: EVANGELIST",
    score: (s) => {
      const stars = norm(s.starsGained, 10, 1000);
      const repos = norm(s.topLanguages.length, 2, 8);
      const prs = norm(s.pullRequests, 10, 200);
      return 0.5 * stars + 0.25 * repos + 0.25 * prs;
    },
    oneLiner: () => "你相信代码应该被看见、被使用、被改进。",
    why: (s) => [
      `收获 ${s.starsGained.toLocaleString()} 颗星：你的代码正在帮助别人。`,
      `涉猎 ${s.topLanguages.length} 种语言：技术栈宽度决定影响力半径。`,
      `PR ${s.pullRequests} 次：开源不是独奏，是合奏。`,
    ],
    signature: () => "让好代码自由流动。",
  },
  {
    key: "weekend_warrior",
    tag: "周末战士",
    codename: "WEEKEND: WARRIOR",
    score: (s) => {
      const weekend = s.weekendRate > 0 ? s.weekendRate : 0.15;
      const commits = norm(s.commits, 30, 1500);
      const streak = norm(s.maxStreakDays, 2, 30);
      return 0.55 * weekend + 0.3 * commits + 0.15 * streak;
    },
    oneLiner: () => "别人在休息，你在构建未来。",
    why: (s) => [
      `周末活跃 ${(s.weekendRate * 100).toFixed(0)}%：周末是你的主战场。`,
      `提交 ${s.commits.toLocaleString()} 次：用业余时间打造专业作品。`,
      `连击 ${s.maxStreakDays} 天：热爱不需要工作日。`,
    ],
    signature: () => "周末不是终点，是起点。",
  },
  {
    key: "fullstack_explorer",
    tag: "全栈探索者",
    codename: "STACK: EXPLORER",
    score: (s) => {
      const langCount = s.topLanguages.length;
      const variety = norm(langCount, 3, 10);
      const commits = norm(s.commits, 50, 2000);
      const active = norm(s.activeDays, 30, 250);
      return 0.45 * variety + 0.3 * commits + 0.25 * active;
    },
    oneLiner: () => "从前端到后端，从数据库到部署，你都想试试。",
    why: (s) => [
      `掌握 ${s.topLanguages.length} 种语言：全栈不是口号，是日常。`,
      `活跃 ${s.activeDays} 天：持续探索，持续成长。`,
      `提交 ${s.commits.toLocaleString()} 次：每一层都有你的足迹。`,
    ],
    signature: () => "技术的边界，就是下一个目标。",
  },
  {
    key: "consistency_machine",
    tag: "稳定输出机",
    codename: "STEADY: ENGINE",
    score: (s) => {
      const streak = norm(s.maxStreakDays, 14, 120);
      const active = norm(s.activeDays, 100, 350);
      const commits = norm(s.commits, 100, 2500);
      return 0.4 * streak + 0.35 * active + 0.25 * commits;
    },
    oneLiner: () => "你不追求爆发，你追求每一天都在场。",
    why: (s) => [
      `最长连击 ${s.maxStreakDays} 天：稳定是最被低估的超能力。`,
      `活跃 ${s.activeDays} 天：一年有 ${Math.round((s.activeDays / 365) * 100)}% 的时间在写代码。`,
      `提交 ${s.commits.toLocaleString()} 次：复利效应，时间会证明一切。`,
    ],
    signature: () => "日拱一卒，功不唐捐。",
  },
  {
    key: "code_reviewer",
    tag: "代码守门员",
    codename: "REVIEW: GUARDIAN",
    score: (s) => {
      const reviews = norm(s.reviews, 20, 600);
      const mergeRate = s.pullRequests === 0 ? 0 : s.mergedPRs / s.pullRequests;
      const prs = norm(s.pullRequests, 5, 150);
      return 0.55 * reviews + 0.25 * clamp01(mergeRate) + 0.2 * prs;
    },
    oneLiner: () => "你是团队代码质量的最后一道防线。",
    why: (s) => [
      `审查 ${s.reviews} 次：每一行代码都值得被认真对待。`,
      `PR ${s.pullRequests} 次：你知道好代码长什么样。`,
      `合并 ${s.mergedPRs} 个 PR：质量和效率可以兼得。`,
    ],
    signature: () => "好代码是审出来的。",
  },
  {
    key: "issue_closer",
    tag: "问题终结者",
    codename: "ISSUE: TERMINATOR",
    score: (s) => {
      const issues = norm(s.issues, 10, 200);
      const commits = norm(s.commits, 50, 1500);
      const active = norm(s.activeDays, 30, 200);
      return 0.5 * issues + 0.3 * commits + 0.2 * active;
    },
    oneLiner: () => "问题不会消失，除非你让它消失。",
    why: (s) => [
      `处理 ${s.issues} 个 Issue：你是问题的克星。`,
      `提交 ${s.commits.toLocaleString()} 次：发现问题，解决问题，一气呵成。`,
      `活跃 ${s.activeDays} 天：问题不过夜。`,
    ],
    signature: () => "没有解决不了的 bug，只有还没找到的原因。",
  },
];

export function matchPersonality(stats: DeveloperYearStats): PersonalityResult {
  const ranked = archetypes
    .map((a) => ({ a, score: a.score(stats) }))
    .sort((x, y) => y.score - x.score);

  const best = ranked[0]?.a ?? archetypes[0];
  return {
    tag: best.tag,
    codename: best.codename,
    oneLiner: best.oneLiner(stats),
    why: best.why(stats),
    signature: best.signature(stats),
  };
}
