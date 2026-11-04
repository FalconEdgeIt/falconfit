"use client";

import { ArrowRight, Flame, Target } from "lucide-react";
import type { ActivityDay, Directive } from "../lib/hud";
import { getLevel } from "../lib/hud";

const DAY_LABELS = ["M", "", "W", "", "F", "", "S"];

function dayTone(d: ActivityDay) {
  if (d.future) return "bg-transparent";
  if (d.lifted && d.cardio) return "bg-red-400";
  if (d.lifted) return "bg-red-600";
  if (d.cardio) return "bg-amber-500";
  return "bg-gray-700/60";
}

function dayTitle(d: ActivityDay) {
  const label = new Date(`${d.day}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const what = [d.lifted && "Lifted", d.cardio && "Cardio"].filter(Boolean).join(" + ");
  return `${label}: ${what || "Rest"}`;
}

function LevelDial({ xp }: { xp: number }) {
  const { level, xpIntoLevel, xpForLevel, rank, nextRank } = getLevel(xp);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (xpIntoLevel / xpForLevel);

  return (
    <div className="flex items-center gap-5 lg:flex-col lg:gap-3 lg:text-center">
      <div className="relative w-28 h-28 lg:w-40 lg:h-40 shrink-0">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90" aria-hidden="true">
          <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="9" className="stroke-gray-700" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            className="stroke-red-600 transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] lg:text-xs tracking-[0.2em] text-gray-400">LEVEL</span>
          <span className="font-display font-extrabold text-5xl lg:text-7xl leading-none">{level}</span>
        </div>
      </div>
      <div>
        <p className="font-display font-bold text-2xl uppercase tracking-wide leading-tight">{rank}</p>
        <p className="text-gray-400 text-xs mt-1 tabular-nums">
          {xpIntoLevel} / {xpForLevel} XP
        </p>
        {nextRank && (
          <p className="text-gray-500 text-xs mt-0.5">
            {nextRank.title} at level {nextRank.level}
          </p>
        )}
      </div>
    </div>
  );
}

export function DirectivePanel({
  name,
  today,
  directive,
  xp,
  onLogFood,
}: {
  name: string;
  today: Date;
  directive: Directive;
  xp: number;
  onLogFood: () => void;
}) {
  const stamp = today.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const cta = "inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3.5 rounded-lg font-semibold";

  return (
    <section className="hud-rise relative overflow-hidden bg-gray-800 rounded-2xl border border-gray-700/70 p-6 lg:p-9">
      <img
        src="/falconfit-icon.png"
        alt=""
        className="pointer-events-none absolute -right-10 -bottom-16 w-80 opacity-[0.05] hidden sm:block"
      />
      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-7">
        <div className="min-w-0">
          <p className="font-mono text-xs tracking-wider text-red-400 uppercase">
            System directive · {stamp}
            {name && ` · ${name}`}
          </p>
          <h1 className="!text-5xl sm:!text-6xl lg:!text-7xl !leading-[0.95] mt-3 font-extrabold">
            {directive.headline}
          </h1>
          <p className="font-mono text-sm text-gray-300 mt-4 max-w-xl">{directive.quip}</p>
          <div className="mt-6">
            {directive.action === "start" && (
              <a href={`/workouts?day=${directive.dayId}`} className={cta}>
                Start {directive.dayName} <ArrowRight size={18} />
              </a>
            )}
            {directive.action === "build" && (
              <a href="/workouts" className={cta}>
                Build a workout <ArrowRight size={18} />
              </a>
            )}
            {directive.action === "food" && (
              <button onClick={onLogFood} className={cta}>
                Log your food <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
        <LevelDial xp={xp} />
      </div>
    </section>
  );
}

export function TrainingRecord({
  grid,
  weeks,
  streak,
  activeDaysInGrid,
}: {
  grid: ActivityDay[];
  weeks: number;
  streak: number;
  activeDaysInGrid: number;
}) {
  return (
    <section className="hud-rise bg-gray-800 rounded-2xl border border-gray-700/70 p-5 lg:p-6">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2>The Record</h2>
          <p className="text-gray-400 text-xs mt-1">
            {activeDaysInGrid} active days in the last {weeks} weeks
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-right">
          <Flame size={22} className={streak > 0 ? "text-red-400" : "text-gray-600"} />
          <span className="font-display font-extrabold text-4xl leading-none tabular-nums">{streak}</span>
          <span className="text-gray-400 text-xs leading-tight text-left">
            week
            <br />
            streak
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="grid grid-rows-[repeat(7,1.05rem)] gap-[3px] text-[10px] text-gray-500 w-3">
          {DAY_LABELS.map((label, i) => (
            <span key={i} className="flex items-center leading-none">
              {label}
            </span>
          ))}
        </div>
        <div
          role="img"
          aria-label={`Training calendar: ${activeDaysInGrid} active days in the last ${weeks} weeks`}
          className="flex-1 grid grid-rows-[repeat(7,1.05rem)] grid-flow-col gap-[3px]"
        >
          {grid.map((d) => (
            <div
              key={d.day}
              title={d.future ? undefined : dayTitle(d)}
              className={`rounded-[3px] ${dayTone(d)} ${
                d.isToday ? "ring-2 ring-white ring-offset-1 ring-offset-gray-800" : ""
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400">
        <span className="flex items-center gap-1.5">
          <i className="w-2.5 h-2.5 rounded-sm bg-red-600" /> Lifted
        </span>
        <span className="flex items-center gap-1.5">
          <i className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Cardio
        </span>
        <span className="flex items-center gap-1.5">
          <i className="w-2.5 h-2.5 rounded-sm bg-red-400" /> Both
        </span>
      </div>
    </section>
  );
}

export function GoalTrack({
  startWeight,
  currentWeight,
  goalWeight,
}: {
  startWeight: number | null;
  currentWeight: number | null;
  goalWeight: number | null;
}) {
  const hasTrack = startWeight !== null && currentWeight !== null && goalWeight !== null && startWeight !== goalWeight;
  const percent = hasTrack
    ? Math.max(0, Math.min(100, ((startWeight - currentWeight) / (startWeight - goalWeight)) * 100))
    : 0;
  const remaining = hasTrack ? Math.abs(currentWeight - goalWeight) : 0;

  return (
    <section className="hud-rise bg-gray-800 rounded-2xl border border-gray-700/70 p-5 lg:p-6 flex flex-col">
      <div className="flex items-center justify-between">
        <h2>Main Quest</h2>
        <Target size={20} className="text-gray-500" />
      </div>

      {currentWeight === null ? (
        <p className="text-gray-400 text-sm mt-3">
          No weigh-ins yet.{" "}
          <a href="/progress" className="text-red-400">
            Log your first one
          </a>
          .
        </p>
      ) : (
        <>
          <p className="mt-3 font-display font-extrabold text-6xl leading-none tabular-nums">
            {Math.round(currentWeight * 10) / 10}
            <span className="text-2xl text-gray-400 font-bold ml-1.5">lbs</span>
          </p>
          {!hasTrack ? (
            <p className="text-gray-400 text-sm mt-3">
              <a href="/settings" className="text-red-400">
                Set a goal weight
              </a>{" "}
              to start your quest.
            </p>
          ) : (
            <div className="mt-auto pt-5">
              <p className="text-gray-300 text-sm mb-2">
                {remaining < 0.05 ? "Quest complete." : `${Math.round(remaining * 10) / 10} lbs to go`}
              </p>
              <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-800 to-red-400 transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1.5 tabular-nums">
                <span>Start {startWeight}</span>
                <span>Goal {goalWeight}</span>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
