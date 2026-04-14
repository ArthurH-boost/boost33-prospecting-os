'use client';

import { DatePreset, DateRange } from '@/lib/types';

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'this_week', label: 'Cette semaine' },
  { key: 'this_month', label: 'Ce mois' },
  { key: 'last_month', label: 'Mois dernier' },
];

function getDateRange(preset: DatePreset): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today': {
      const from = today.toISOString();
      const to = new Date(today.getTime() + 86400000).toISOString();
      return { from, to };
    }
    case 'this_week': {
      const day = today.getDay();
      const monday = new Date(today.getTime() - ((day === 0 ? 6 : day - 1) * 86400000));
      const nextMonday = new Date(monday.getTime() + 7 * 86400000);
      return { from: monday.toISOString(), to: nextMonday.toISOString() };
    }
    case 'this_month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { from: from.toISOString(), to: to.toISOString() };
    }
    case 'last_month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: from.toISOString(), to: to.toISOString() };
    }
  }
}

function getPreviousPeriodRange(preset: DatePreset): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today': {
      const yesterday = new Date(today.getTime() - 86400000);
      return { from: yesterday.toISOString(), to: today.toISOString() };
    }
    case 'this_week': {
      const day = today.getDay();
      const monday = new Date(today.getTime() - ((day === 0 ? 6 : day - 1) * 86400000));
      const prevMonday = new Date(monday.getTime() - 7 * 86400000);
      return { from: prevMonday.toISOString(), to: monday.toISOString() };
    }
    case 'this_month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: from.toISOString(), to: to.toISOString() };
    }
    case 'last_month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const to = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { from: from.toISOString(), to: to.toISOString() };
    }
  }
}

export { getDateRange, getPreviousPeriodRange };

export default function DateFilter({
  selected,
  onSelect,
  compare,
  onCompareToggle,
}: {
  selected: DatePreset;
  onSelect: (preset: DatePreset) => void;
  compare: boolean;
  onCompareToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 mb-6 flex-wrap">
      <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-lg p-1 border border-[var(--border)]">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => onSelect(p.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selected === p.key
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <button
        onClick={onCompareToggle}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          compare
            ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
            : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
        }`}
      >
        Comparer periodes
      </button>
    </div>
  );
}
