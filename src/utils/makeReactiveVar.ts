type Subscriber<T> = (value: T) => void;

function makeReactiveVar<T>(initialValue: T) {
  let value = initialValue;
  const subscribers: Subscriber<T>[] = [];

  const get = () => value;

  const set = (newValue: T) => {
    if (value !== newValue) {
      value = newValue;
      subscribers.forEach((callback) => callback(value));
    }
  };

  const subscribe = (callback: Subscriber<T>) => {
    subscribers.push(callback);
    return () => {
      const index = subscribers.indexOf(callback);
      if (index > -1) subscribers.splice(index, 1);
    };
  };

  return { get, set, subscribe };
}

export default makeReactiveVar;
