import { useEffect, useMemo, useState } from 'react';
import { defaultState } from '../lib/defaultState';
import { loadState, saveState } from '../lib/storage';
import type { AppState } from '../types/domain';

export const useLocalStore = () => {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const actions = useMemo(
    () => ({
      patch: (patcher: (prev: AppState) => AppState) => setState((prev) => patcher(prev)),
      reset: () => setState(defaultState)
    }),
    []
  );

  return { state, ...actions };
};
