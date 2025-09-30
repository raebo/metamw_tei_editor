import { Dispatch, SetStateAction } from 'react';

function createHandleChange<T>(setState: Dispatch<SetStateAction<T>>): (updates: Partial<T>) => void {
  return (updates: Partial<T>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };
}

export const stateHandling = {
  createHandleChange,
  // createHandleChange<T>: (setState: Dispatch<SetStateAction<T>>): (updates: Partial<T>) => void {
  //   return (updates: Partial<T>) => {
  //     setState((prev) => ({ ...prev, ...updates }));
  //   }
  // }
};

const actionInProgress = new Map<string, boolean>();

export const runOncePerAction = async (actionKey: string, fn: () => Promise<void>) => {
  if (actionInProgress.get(actionKey)) return;
  actionInProgress.set(actionKey, true);
  try {
    await fn();
  } finally {
    actionInProgress.set(actionKey, false);
  }
};
