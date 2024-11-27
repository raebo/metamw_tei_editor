import { useEffect, useState } from 'react';
import makeReactiveVar from '../utils/makeReactiveVar';

function useReactiveVar<T>(reactiveVar: ReturnType<typeof makeReactiveVar<T>>) {
  const [state, setState] = useState(reactiveVar.get());

  useEffect(() => {
    const unsubscribe = reactiveVar.subscribe(setState);
    return () => unsubscribe();
  }, [reactiveVar]);

  return state;
}
