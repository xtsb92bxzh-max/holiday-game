'use client';

import { createContext, useContext } from 'react';
import type { Action, GameState } from '@/lib/gameState';
import type { Sfx } from '@/lib/sound';

export type GameContextValue = {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  reduceMotion: boolean;
  sfx: (s: Sfx) => void;
};

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameContext');
  return ctx;
}
