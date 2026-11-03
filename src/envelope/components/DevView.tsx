'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DIM_IDS, RULES, dimById } from '../data/dimensions';
import { SHORTLIST } from '../data/shortlist';
import { audit, type AuditSummary } from '../lib/audit';
import { isFinished } from '../lib/engine';
import { contributions, profileOf, recommend } from '../lib/scoring';
import type { Dim } from '../lib/types';
import { useEnvelope } from './EnvelopeProvider';

const f = (n: number, dp = 2) => (Math.abs(n) < 0.005 ? '0' : n.toFixed(dp));
const signed = (n: number, dp = 2) => (n > 0 ? `+${f(n, dp)}` : f(n, dp));
const pct = (n: number, of: number) => `${((100 * n) / of).toFixed(1)}%`;
const cell = 'border border-white/10 px-2 py-1 align-top';
const head = `${cell} bg-white/5 text-left font-semibold`;

function AuditPanel() {
  const [result, setResult] = useState<{ a: AuditSummary; ms: number } | null>(null);
  const [running, setRunning] = useState(false);
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">Path audit</h2>
      <p className="text-sm opacity-80">Plays every possible path through the story, including each tiebreak option. Takes a few seconds.</p>
      <button
        type="button"
        className="min-h-11 rounded border border-en-sea px-4 text-sm font-semibold text-en-sea hover:bg-en-sea/10"
        disabled={running}
        onClick={() => {
          setRunning(true);
          setTimeout(() => {
            const t = performance.now();
            const a = audit();
            setResult({ a, ms: performance.now() - t });
            setRunning(false);
          }, 20);
        }}
      >
        {running ? 'Running…' : 'Run the audit'}
      </button>
      {result && (
        <div className="space-y-3 text-sm">
          <p>
            {result.a.storyPaths.toLocaleString()} story paths ({result.a.paths.toLocaleString()} counting each tiebreak option), {result.a.minDecisions}–
            {result.a.maxDecisions} decisions each, every one finishing. {pct(result.a.close, result.a.storyPaths)} of story paths are close. Took{' '}
            {(result.ms / 1000).toFixed(1)} s.
          </p>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className={head}>Trip</th>
                <th className={head}>Nearest, story paths</th>
                <th className={head}>Final suggestion, all paths</th>
              </tr>
            </thead>
            <tbody>
              {SHORTLIST.map((o) => (
                <tr key={o.id}>
                  <td className={cell}>{o.name}</td>
                  <td className={cell}>{pct(result.a.nearest[o.id], result.a.storyPaths)}</td>
                  <td className={cell}>{pct(result.a.wins[o.id], result.a.paths)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>Endings: {Object.entries(result.a.endings).map(([k, v]) => `${k} ${pct(v, result.a.paths)}`).join(' · ')}</p>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className={head}>Dimension</th>
                <th className={head}>Mean</th>
                <th className={head}>Measured spread</th>
                <th className={head}>RULES.scale</th>
              </tr>
            </thead>
            <tbody>
              {DIM_IDS.map((d) => {
                const drift = Math.abs(result.a.spread[d].sd / RULES.scale[d] - 1);
                return (
                  <tr key={d}>
                    <td className={cell}>{d}</td>
                    <td className={cell}>{f(result.a.spread[d].mean)}</td>
                    <td className={cell}>{f(result.a.spread[d].sd)}</td>
                    <td className={`${cell} ${drift > 0.25 ? 'text-red-300' : ''}`}>
                      {f(RULES.scale[d])}
                      {drift > 0.25 ? ' (update it)' : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function DevView() {
  const { story } = useEnvelope();
  const trail = story.trail;
  const finished = isFinished(story);
  const rec = useMemo(() => (trail.length ? recommend(trail) : null), [trail]);
  const profile = useMemo(() => profileOf(trail), [trail]);
  const top = rec?.ranked[0].option ?? SHORTLIST[0];
  const runner = rec?.ranked[1].option ?? SHORTLIST[1];
  const vsRunner = useMemo(() => contributions(trail, top, runner), [trail, top, runner]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 font-sans text-en-paper">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-en-sea">Development only</p>
        <h1 className="text-2xl font-bold">The Envelope: how each decision counted</h1>
        <p className="max-w-3xl text-sm opacity-85">
          This reads the playthrough saved in this browser. Each decision adds its effects to the dimensions its scene covers. A dimension’s value is the
          average over the decisions that covered it, divided by RULES.scale. Distance to a trip is the weighted sum of squared differences from its target.
          Lowest distance wins. Hidden from players and off in production builds.
        </p>
        <p className="flex flex-wrap gap-x-5 text-sm">
          <Link href="/the-envelope" className="underline">
            Back to the story
          </Link>
          <span>
            {trail.length} steps · {finished ? 'finished' : 'in progress'}
          </span>
        </p>
      </header>

      {trail.length === 0 ? (
        <p>No decisions saved yet. Play part of the story, then come back.</p>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-bold">Decisions</h2>
            <p className="text-sm opacity-80">
              The last column is each decision’s share of the margin between {top.name} and {runner.name} (positive favours {top.name}). The shares plus the
              baseline add up to the margin exactly.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className={head}>#</th>
                    <th className={head}>Scene</th>
                    <th className={head}>Choice</th>
                    <th className={head}>Covers</th>
                    {DIM_IDS.map((d) => (
                      <th key={d} className={head}>
                        {d}
                      </th>
                    ))}
                    <th className={head}>
                      {top.name} vs {runner.name}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vsRunner.perEntry.map(({ entry, total }, i) => (
                    <tr key={i} className={entry.scene.kind !== 'decision' ? 'opacity-60' : ''}>
                      <td className={cell}>{i + 1}</td>
                      <td className={cell}>
                        {entry.scene.id}
                        {entry.scene.kind !== 'decision' && <span className="block opacity-70">({entry.scene.kind}, not scored)</span>}
                      </td>
                      <td className={cell}>
                        <span className="font-semibold">{entry.choice.id}</span>
                        <span className="block max-w-xs opacity-80">{entry.choice.label}</span>
                      </td>
                      <td className={cell}>{entry.covered.join(', ') || '–'}</td>
                      {DIM_IDS.map((d) => {
                        const v = entry.choice.effects[d as Dim];
                        const covered = entry.covered.includes(d);
                        return (
                          <td key={d} className={`${cell} tabular-nums ${!covered ? 'opacity-30' : v ? (v > 0 ? 'text-en-sea' : 'text-en-lamp') : ''}`}>
                            {covered && entry.scene.kind === 'decision' ? signed(v ?? 0, 1) : '·'}
                          </td>
                        );
                      })}
                      <td className={`${cell} tabular-nums`}>{entry.scene.kind === 'decision' ? signed(total) : '–'}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className={cell} colSpan={4 + DIM_IDS.length}>
                      Baseline (from the two targets)
                    </td>
                    <td className={`${cell} tabular-nums`}>{signed(vsRunner.baseline)}</td>
                  </tr>
                  <tr className="font-semibold">
                    <td className={cell} colSpan={4 + DIM_IDS.length}>
                      Margin: distance({runner.name}) − distance({top.name})
                    </td>
                    <td className={`${cell} tabular-nums`}>{signed(vsRunner.perEntry.reduce((a, b) => a + b.total, vsRunner.baseline))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">Profile and distances</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className={head}>Row</th>
                    {DIM_IDS.map((d) => (
                      <th key={d} className={head} title={`${dimById[d].low} ↔ ${dimById[d].high}`}>
                        {d}
                      </th>
                    ))}
                    <th className={head}>Distance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={cell}>Decisions covering it</td>
                    {DIM_IDS.map((d) => (
                      <td key={d} className={`${cell} tabular-nums`}>
                        {profile.count[d]}
                      </td>
                    ))}
                    <td className={cell} />
                  </tr>
                  <tr>
                    <td className={cell}>Plain average</td>
                    {DIM_IDS.map((d) => (
                      <td key={d} className={`${cell} tabular-nums`}>
                        {signed(profile.value[d])}
                      </td>
                    ))}
                    <td className={cell} />
                  </tr>
                  <tr className="font-semibold">
                    <td className={cell}>Scaled (÷ RULES.scale)</td>
                    {DIM_IDS.map((d) => (
                      <td key={d} className={`${cell} tabular-nums`}>
                        {signed(profile.scaled[d])}
                      </td>
                    ))}
                    <td className={cell} />
                  </tr>
                  {rec?.ranked.map((r, i) => (
                    <tr key={r.option.id} className={i === 0 ? 'text-en-lamp' : ''}>
                      <td className={cell}>
                        {i + 1}. {r.option.name} target
                      </td>
                      {DIM_IDS.map((d) => (
                        <td key={d} className={`${cell} tabular-nums`}>
                          {signed(r.option.target[d], 1)}
                          <span className="block opacity-60">{f(r.byDim[d])}</span>
                        </td>
                      ))}
                      <td className={`${cell} tabular-nums font-semibold`}>{f(r.distance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rec && (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                <li>
                  Gap between first and second: {f(rec.ranked[1].distance - rec.ranked[0].distance)}. Close below {RULES.closeMargin}:{' '}
                  {rec.close ? 'yes' : 'no'}.
                </li>
                {rec.tiebreak && (
                  <li>
                    Tiebreak on {rec.tiebreak.dim}: chose “{rec.tiebreak.entry.choice.id}” (pole {rec.tiebreak.entry.choice.pole}). Outcome: {rec.tiebreak.outcome}.
                  </li>
                )}
                <li>
                  Suggestion: {rec.shared ? `${rec.top.name} and ${rec.runnerUp.name}, shared` : `${rec.top.name}, runner-up ${rec.runnerUp.name}`}
                  {finished ? '' : ' (so far)'}.
                </li>
              </ul>
            )}
          </section>
        </>
      )}

      <section className="space-y-2 text-sm">
        <h2 className="text-lg font-bold">Rules</h2>
        <p>
          Weights: {DIM_IDS.map((d) => `${d} ${RULES.weights[d]}`).join(', ')}. Close margin {RULES.closeMargin}. Lean threshold {RULES.leanThreshold}.
          Preference threshold {RULES.preferenceThreshold}. Edit these in src/envelope/data/dimensions.ts; targets are in src/envelope/data/shortlist.ts.
        </p>
      </section>

      <AuditPanel />
    </div>
  );
}
