'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '\u{1F4CA}' },
  { href: '/scraping', label: 'Scraping Tracker', icon: '\u{1F517}' },
  { href: '/ceo-filter', label: 'CEO Filter', icon: '\u{1F3AF}' },
  { href: '/campaign-log', label: 'Campaign Log', icon: '\u{1F4CB}' },
  { href: '/review-kickoff', label: 'Review & Kickoff', icon: '\u{1F680}' },
  { href: '/pipeline-stats', label: 'Pipeline Stats', icon: '\u{270F}\uFE0F' },
  { href: '/analytics', label: 'Analytics', icon: '\u{1F4C8}' },
  { href: '/settings', label: 'Settings', icon: '\u2699\uFE0F' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-64 min-h-screen flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border)]">
      <div className="p-6 border-b border-[var(--border)]">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Boost33
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Prospecting OS</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--border)]">
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors text-left"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
