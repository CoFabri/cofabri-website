export function filterPillClasses(active: boolean): string {
  return `rounded-full px-[15px] py-2 text-sm font-medium transition-colors duration-200 ${
    active ? 'bg-foreground text-background' : 'border border-border-strong text-ink-body hover:border-ink-faint'
  }`;
}
