export interface ListIconOption {
  icon: string;
  label: string;
}

/** Compact set for the New List icon carousel — keep it to one scrollable row. */
export const LIST_ICON_OPTIONS: ListIconOption[] = [
  { icon: 'ph:calendar-blank', label: 'Cutoff' },
  { icon: 'ph:fork-knife', label: 'Food' },
  { icon: 'ph:shopping-bag', label: 'Shopping' },
  { icon: 'ph:bank', label: 'Bank' },
  { icon: 'ph:receipt', label: 'Bills' },
  { icon: 'ph:sparkle', label: 'Beauty' },
  { icon: 'ph:house', label: 'Home' },
  { icon: 'ph:car', label: 'Transport' },
  { icon: 'ph:heart', label: 'Health' },
  { icon: 'ph:gift', label: 'Gifts' },
  { icon: 'ph:airplane-tilt', label: 'Travel' },
  { icon: 'ph:wallet', label: 'Other' },
];

export function defaultListIcon(type: 'cutoff' | 'other'): string {
  return type === 'cutoff' ? 'ph:calendar-blank' : 'ph:shopping-bag';
}

export function resolveListIcon(icon: string | null | undefined, type: 'cutoff' | 'other'): string {
  return icon || defaultListIcon(type);
}
