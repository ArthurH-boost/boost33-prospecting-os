'use client';

import { useMemo } from 'react';
import { PipelineStat, LeadQualification, Desk, DESKS, Qualification } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const QUALIFICATIONS: Qualification[] = ['CHAUD', 'TIEDE', 'FROID'];

const QUAL_COLORS: Record<Qualification, string> = {
  CHAUD: '#ef4444',
  TIEDE: '#f59e0b',
  FROID: '#3b82f6',
};

const DESK_COLORS: Record<Desk, string> = {
  Arthur: '#6366f1',
  Boost33: '#22c55e',
  Advisor: '#f59e0b',
};

const rate = (num: number, denom: number) =>
  denom > 0 ? ((num / denom) * 100).toFixed(1) + '%' : '—';

function pctChange(current: number, previous: number): { value: string; up: boolean | null } {
  if (previous === 0 && current === 0) return { value: '—', up: null };
  if (previous === 0) return { value: '+100%', up: true };
  const pct = ((current - previous) / previous) * 100;
  return {
    value: (pct >= 0 ? '+' : '') + pct.toFixed(0) + '%',
    up: pct > 0 ? true : pct < 0 ? false : null,
  };
}

function ChangeIndicator({ current, previous }: { current: number; previous: number }) {
  const { value, up } = pctChange(current, previous);
  if (up === null) return null;
  return (
    <span className={`text-xs ml-1 ${up ? 'text-green-400' : 'text-red-400'}`}>
      {up ? '↑' : '↓'} {value}
    </span>
  );
}

export default function ByDeskTab({
  stats,
  leads,
  prevLeads,
  prevStats,
  compare,
}: {
  stats: PipelineStat[];
  leads: LeadQualification[];
  prevLeads: LeadQualification[];
  prevStats: PipelineStat[];
  compare: boolean;
}) {
  const deskData = useMemo(() => {
    return DESKS.map((desk) => {
      const deskLeads = leads.filter((l) => l.desk === desk);
      const deskStats = stats.filter((s) => s.desk === desk);
      const totalSent = deskStats.reduce((sum, s) => sum + s.sent, 0);
      const totalRdv = deskStats.reduce((sum, s) => sum + s.rdv, 0);

      const prevDeskLeads = prevLeads.filter((l) => l.desk === desk);
      const prevDeskStats = prevStats.filter((s) => s.desk === desk);
      const prevTotalSent = prevDeskStats.reduce((sum, s) => sum + s.sent, 0);
      const prevTotalRdv = prevDeskStats.reduce((sum, s) => sum + s.rdv, 0);

      return {
        desk,
        total: deskLeads.length,
        chaud: deskLeads.filter((l) => l.qualification === 'CHAUD').length,
        tiede: deskLeads.filter((l) => l.qualification === 'TIEDE').length,
        froid: deskLeads.filter((l) => l.qualification === 'FROID').length,
        sent: totalSent,
        rdv: totalRdv,
        conversionRate: rate(totalRdv, totalSent),
        prev: {
          total: prevDeskLeads.length,
          chaud: prevDeskLeads.filter((l) => l.qualification === 'CHAUD').length,
          tiede: prevDeskLeads.filter((l) => l.qualification === 'TIEDE').length,
          froid: prevDeskLeads.filter((l) => l.qualification === 'FROID').length,
          sent: prevTotalSent,
          rdv: prevTotalRdv,
        },
      };
    });
  }, [leads, stats, prevLeads, prevStats]);

  const chartData = useMemo(() => {
    return DESKS.map((desk) => {
      const d = deskData.find((dd) => dd.desk === desk)!;
      return {
        desk,
        CHAUD: d.chaud,
        TIEDE: d.tiede,
        FROID: d.froid,
        Total: d.total,
      };
    });
  }, [deskData]);

  return (
    <div>
      {/* Desk cards with lead qualification data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {deskData.map((d) => (
          <div key={d.desk} className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DESK_COLORS[d.desk] }} />
              <h4 className="text-sm font-bold text-white">{d.desk}</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Total Leads</span>
                <span className="text-white font-medium">
                  {d.total}
                  {compare && <ChangeIndicator current={d.total} previous={d.prev.total} />}
                </span>
              </div>
              {QUALIFICATIONS.map((q) => {
                const count = q === 'CHAUD' ? d.chaud : q === 'TIEDE' ? d.tiede : d.froid;
                const prevCount = q === 'CHAUD' ? d.prev.chaud : q === 'TIEDE' ? d.prev.tiede : d.prev.froid;
                return (
                  <div key={q} className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: QUAL_COLORS[q] }} />
                      <span className="text-[var(--text-secondary)]">{q}</span>
                    </div>
                    <span className="text-white font-medium">
                      {count}
                      {compare && <ChangeIndicator current={count} previous={prevCount} />}
                    </span>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-[var(--border)]">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Sent</span>
                  <span className="text-white font-medium">
                    {d.sent}
                    {compare && <ChangeIndicator current={d.sent} previous={d.prev.sent} />}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[var(--text-secondary)]">RDV</span>
                  <span className="text-white font-medium">
                    {d.rdv}
                    {compare && <ChangeIndicator current={d.rdv} previous={d.prev.rdv} />}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[var(--text-secondary)]">Conversion Rate</span>
                  <span className="text-[var(--success)] font-medium">{d.conversionRate}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border)]">
        <h3 className="text-sm font-semibold text-white mb-4">Leads par Desk — Qualification</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <XAxis dataKey="desk" stroke="#9499b3" fontSize={12} />
            <YAxis stroke="#9499b3" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2e3144', borderRadius: 8, color: '#e4e5eb' }}
            />
            <Legend />
            <Bar dataKey="CHAUD" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="TIEDE" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="FROID" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {leads.length === 0 && stats.length === 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-8 border border-[var(--border)] text-center text-[var(--text-secondary)] mt-6">
          No data available for this period.
        </div>
      )}
    </div>
  );
}
