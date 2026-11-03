'use client';

import { Shell } from './Chrome';
import { useEnvelope } from './EnvelopeProvider';
import PracticalScreen from './PracticalScreen';
import ResultScreen from './ResultScreen';
import StoryScreen from './StoryScreen';
import TitleScreen from './TitleScreen';

export default function EnvelopeApp() {
  const { state } = useEnvelope();
  return (
    <Shell>
      {state.phase === 'title' && <TitleScreen />}
      {state.phase === 'story' && <StoryScreen />}
      {state.phase === 'practical' && <PracticalScreen />}
      {state.phase === 'result' && <ResultScreen />}
    </Shell>
  );
}
