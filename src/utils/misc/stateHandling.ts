import { Dispatch, SetStateAction } from 'react';

function createHandleChange<T>(setState: Dispatch<SetStateAction<T>>): (updates: Partial<T>) => void {
  return (updates: Partial<T>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };
}

export const stateHandling = {
  createHandleChange
  // createHandleChange<T>: (setState: Dispatch<SetStateAction<T>>): (updates: Partial<T>) => void {
  //   return (updates: Partial<T>) => {
  //     setState((prev) => ({ ...prev, ...updates }));
  //   }
  // }
}
