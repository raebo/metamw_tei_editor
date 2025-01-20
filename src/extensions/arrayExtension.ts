declare global {
  interface Array<T> {
    any?(): boolean;
  }
}

// Add the custom method to the Array prototype
Array.prototype.any = function (): boolean {
  if (!this) { return false; }

  return this.length > 0;
};

export {};
