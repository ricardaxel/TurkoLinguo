import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  completeCheckpoint, completeLessonSession, completeReview, emptyProgress, type Progress, type SessionResult,
} from './model';

const KEY = 'turkolinguo.progress.v1';
const CLOCK_KEY = 'turkolinguo.clockOffsetDays';

interface ProgressApi {
  progress: Progress;
  loaded: boolean;
  /** "Now", shifted by the developer clock offset (for testing reviews without waiting). */
  now: () => Date;
  clockOffsetDays: number;
  finishLesson: (lessonId: string, session: 'learn' | 'practise', results: SessionResult[]) => void;
  finishReview: (results: SessionResult[], cardFor: Record<string, string>) => void;
  finishCheckpoint: (checkpointId: string, results: SessionResult[]) => void;
  shiftClock: (days: number) => void;
  reset: () => void;
}

const Ctx = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [offset, setOffset] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [raw, clock] = await Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(CLOCK_KEY)]);
        if (raw) {
          const parsed = JSON.parse(raw) as Progress;
          if (parsed.version === 1) setProgress(parsed);
        }
        if (clock) setOffset(Number(clock) || 0);
      } catch {
        // unreadable storage: start fresh rather than crash
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const update = useCallback((fn: (p: Progress) => Progress) => {
    setProgress((prev) => {
      const next = fn(prev);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const now = useCallback(() => new Date(Date.now() + offset * 86_400_000), [offset]);

  const api = useMemo<ProgressApi>(
    () => ({
      progress,
      loaded,
      now,
      clockOffsetDays: offset,
      finishLesson: (lessonId, session, results) => update((p) => completeLessonSession(p, lessonId, session, results, now())),
      finishReview: (results, cardFor) => update((p) => completeReview(p, results, cardFor, now())),
      finishCheckpoint: (checkpointId, results) => update((p) => completeCheckpoint(p, checkpointId, results, now())),
      shiftClock: (days) => {
        setOffset((prev) => {
          const next = prev + days;
          AsyncStorage.setItem(CLOCK_KEY, String(next)).catch(() => {});
          return next;
        });
      },
      reset: () => {
        update(() => emptyProgress());
        setOffset(0);
        AsyncStorage.removeItem(CLOCK_KEY).catch(() => {});
      },
    }),
    [progress, loaded, offset, now, update],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
