// Audio playback with pause / resume on every platform.
// expo-speech has no pause() on Android, so the player keeps its own queue of short utterances:
// pause stops the voice and remembers the current utterance, resume says that utterance again.
// Audio is cut into short pieces in the content (one word, pair or sentence each), so resuming
// from the start of a piece loses almost nothing.

import * as Speech from 'expo-speech';
import { useSyncExternalStore } from 'react';

export interface Utterance {
  text: string;
  rate: number;
}

export interface PlayerState {
  /** Which button owns the playback (a per-button key). */
  owner?: string;
  status: 'idle' | 'playing' | 'paused';
}

export const NORMAL_RATE = 0.9;
export const SLOW_RATE = 0.5;

let state: PlayerState = { status: 'idle' };
let queue: Utterance[] = [];
let position = 0;
// bumped on every stop / pause / new play, so callbacks from an older utterance are ignored
let generation = 0;
const listeners = new Set<() => void>();

function set(next: PlayerState) {
  state = next;
  listeners.forEach((l) => l());
}

function speakCurrent() {
  const gen = ++generation;
  const u = queue[position];
  const done = () => {
    if (gen !== generation) return;
    position += 1;
    if (position < queue.length) speakCurrent();
    else set({ status: 'idle' });
  };
  Speech.speak(u.text, {
    language: 'tr-TR',
    rate: u.rate,
    onDone: done,
    onError: () => {
      if (gen === generation) set({ status: 'idle' });
    },
  });
}

export const player = {
  play(owner: string, utterances: Utterance[]) {
    generation += 1;
    Speech.stop();
    queue = utterances.filter((u) => u.text.trim());
    position = 0;
    if (!queue.length) return set({ status: 'idle' });
    set({ owner, status: 'playing' });
    speakCurrent();
  },
  pause() {
    if (state.status !== 'playing') return;
    generation += 1;
    Speech.stop();
    set({ owner: state.owner, status: 'paused' });
  },
  resume() {
    if (state.status !== 'paused') return;
    set({ owner: state.owner, status: 'playing' });
    speakCurrent();
  },
  stop() {
    generation += 1;
    Speech.stop();
    if (state.status !== 'idle') set({ status: 'idle' });
  },
  getState: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const usePlayer = () => useSyncExternalStore(player.subscribe, player.getState, player.getState);
