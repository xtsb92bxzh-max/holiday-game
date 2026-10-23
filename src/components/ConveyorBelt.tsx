'use client';

import { animate, motion, useAnimationFrame, useMotionValue, useTransform } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Destination } from '@/lib/types';
import Photo from './Photo';

const GAP = 18;

function useCardWidth() {
  const [w, setW] = useState(220);
  useLayoutEffect(() => {
    const update = () => setW(window.innerWidth >= 1024 ? 290 : window.innerWidth >= 640 ? 250 : 200);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return w;
}

export type ConveyorHandle = { next: () => void; prev: () => void; goTo: (i: number) => void };

/**
 * A looping conveyor belt of prize cards. The belt runs right-to-left; the card
 * nearest the central spotlight is the active prize. With reduced motion the belt
 * never runs on its own and moves one card at a time without animation.
 */
export default function ConveyorBelt({
  items,
  running,
  onRunningChange,
  activeIndex,
  onActiveChange,
  onOpen,
  reduceMotion,
  handleRef,
  decisionFor,
}: {
  items: Destination[];
  running: boolean;
  onRunningChange: (r: boolean) => void;
  activeIndex: number;
  onActiveChange: (i: number) => void;
  onOpen: (i: number) => void;
  reduceMotion: boolean;
  handleRef: React.MutableRefObject<ConveyorHandle | null>;
  decisionFor: (id: string) => string | undefined;
}) {
  const n = items.length;
  const cardW = useCardWidth();
  const pitch = cardW + GAP;
  const loop = n * pitch;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewW, setViewW] = useState(360);
  const x = useMotionValue(0);
  const activeRef = useRef(activeIndex);
  const settling = useRef(false);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewW(el.clientWidth));
    ro.observe(el);
    setViewW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Offset that places card k (in the middle copy) under the spotlight.
  const centre = viewW / 2 - cardW / 2;
  const xFor = useCallback((k: number) => centre - (k + n) * pitch, [centre, n, pitch]);

  // Keep x within the middle copy so the loop is seamless.
  const wrap = useCallback(
    (v: number) => {
      const base = xFor(0);
      let rel = v - base;
      rel = ((((rel + loop / 2) % loop) + loop) % loop) - loop / 2;
      return base + rel;
    },
    [xFor, loop],
  );

  const indexAt = useCallback(
    (v: number) => {
      const k = Math.round((centre - v) / pitch) - n;
      return ((k % n) + n) % n;
    },
    [centre, pitch, n],
  );

  // Initial placement and re-placement when the layout changes.
  useEffect(() => {
    x.set(xFor(activeRef.current));
  }, [xFor, x]);

  const report = useCallback(
    (v: number) => {
      const i = indexAt(v);
      if (i !== activeRef.current) {
        activeRef.current = i;
        onActiveChange(i);
      }
    },
    [indexAt, onActiveChange],
  );

  useAnimationFrame((_, delta) => {
    if (!running || reduceMotion || settling.current) return;
    const speed = cardW / 2.2; // px per second
    const v = wrap(x.get() - (speed * Math.min(delta, 64)) / 1000);
    x.set(v);
    report(v);
  });

  const goTo = useCallback(
    (target: number) => {
      onRunningChange(false);
      const current = x.get();
      const kRaw = Math.round((centre - current) / pitch) - n;
      const curIdx = ((kRaw % n) + n) % n;
      let step = (((target - curIdx) % n) + n) % n;
      if (step > n / 2) step -= n;
      const snapped = xFor(kRaw + step);
      const finalIdx = ((target % n) + n) % n;
      activeRef.current = finalIdx;
      onActiveChange(finalIdx);
      if (reduceMotion) {
        x.set(wrap(snapped));
        return;
      }
      settling.current = true;
      animate(x, snapped, {
        type: 'spring',
        stiffness: 120,
        damping: 18,
        onComplete: () => {
          x.set(wrap(x.get()));
          settling.current = false;
        },
      });
    },
    [centre, n, onActiveChange, onRunningChange, pitch, reduceMotion, wrap, x, xFor],
  );

  // When the belt stops, glide the nearest card into the spotlight.
  const wasRunning = useRef(running);
  useEffect(() => {
    if (wasRunning.current && !running && !settling.current) goTo(indexAt(x.get()));
    wasRunning.current = running;
  }, [running, goTo, indexAt, x]);

  useEffect(() => {
    handleRef.current = {
      next: () => goTo(activeRef.current + 1),
      prev: () => goTo(activeRef.current - 1),
      goTo,
    };
  }, [goTo, handleRef]);

  const treadPos = useTransform(x, (v) => `${v}px 0`);
  const rollerRotate = useTransform(x, (v) => (v / 14) * (180 / Math.PI));
  const copies = [0, 1, 2];

  return (
    <div className="relative select-none">
      {/* Spotlight cone over the active slot */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-48px] z-0 h-[calc(100%+48px)] w-[340px] -translate-x-1/2"
        style={{
          background: 'radial-gradient(ellipse 50% 100% at 50% 0%, rgb(255 230 160 / 0.32), transparent 75%)',
        }}
      />

      <div
        ref={viewportRef}
        className="relative z-10 overflow-hidden pb-2 pt-4"
        tabIndex={0}
        role="group"
        aria-roledescription="conveyor belt"
        aria-label="Prize conveyor belt. Use the left and right arrow keys to move between prizes, Enter to open."
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            goTo(activeRef.current + 1);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goTo(activeRef.current - 1);
          } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen(activeRef.current);
          }
        }}
      >
        <motion.ul className="flex" style={{ x, gap: GAP }} aria-hidden={false}>
          {copies.flatMap((c) =>
            items.map((d, i) => {
              const isActive = i === activeIndex;
              const decision = decisionFor(d.id);
              return (
                <li key={`${c}-${d.id}`} style={{ width: cardW }} className="shrink-0" aria-hidden={c !== 1}>
                  <button
                    tabIndex={-1}
                    onClick={() => (isActive && !running ? onOpen(i) : goTo(i))}
                    className={`group block w-full rounded-xl text-left transition-transform duration-300 ${
                      isActive ? '-translate-y-2 scale-[1.03]' : 'opacity-85'
                    }`}
                    aria-label={`Prize ${i + 1}: ${d.name}`}
                  >
                    <div
                      className={`overflow-hidden rounded-xl border-4 bg-cream shadow-[0_10px_0_#00000055] ${
                        isActive ? 'border-gold shadow-[0_0_30px_#ffd56088,0_10px_0_#00000055]' : 'border-cream/80'
                      }`}
                    >
                      <Photo
                        src={d.imagePath}
                        name={d.name}
                        country={d.country}
                        className="aspect-[4/3] w-full"
                        sizes="300px"
                        eager={c === 1}
                      />
                      <div className="relative bg-cream px-3 py-2 text-ink">
                        <p className="font-display text-[10px] tracking-widest text-red">PRIZE {String(i + 1).padStart(2, '0')}</p>
                        <p className="truncate font-display text-base leading-tight sm:text-lg">{d.name}</p>
                        <p className="truncate font-serif text-xs italic text-ink/70">{d.country}</p>
                        {decision && (
                          <span
                            className={`absolute right-2 top-2 rounded px-1.5 py-0.5 font-display text-[9px] tracking-wider ${
                              decision === 'keep' ? 'bg-sage text-white' : decision === 'maybe' ? 'bg-mustard text-ink' : 'bg-red text-white'
                            }`}
                          >
                            {decision === 'keep' ? 'KEPT' : decision === 'maybe' ? 'MAYBE' : 'BINNED'}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            }),
          )}
        </motion.ul>
      </div>

      {/* The belt itself */}
      <div aria-hidden className="relative z-0 -mt-1">
        <motion.div className="belt-treads h-5 border-y-2 border-black/60 shadow-[inset_0_2px_0_#ffffff22]" style={{ backgroundPosition: treadPos }} />
        <div className="flex h-7 items-start justify-around overflow-hidden bg-gradient-to-b from-[#1a1e2e] to-[#0c0f1a] px-2">
          {Array.from({ length: 14 }).map((_, k) => (
            <motion.span
              key={k}
              className="mt-0.5 block size-6 rounded-full border-2 border-[#59607a] bg-[conic-gradient(#8a91ad_0_25%,#3a4060_0_50%,#8a91ad_0_75%,#3a4060_0)]"
              style={{ rotate: rollerRotate }}
            />
          ))}
        </div>
        <div className="footlights h-6" />
      </div>
    </div>
  );
}
