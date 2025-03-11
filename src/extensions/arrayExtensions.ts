Array.prototype.any = function (): boolean {
  if (!this) { return false; }

  return this.length > 0;
}
