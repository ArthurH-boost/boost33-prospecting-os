'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PipelineStat, Campaign, Desk, DESKS } from '@/lib/types';
import PageHeader from '@/components/PageHeader';
import Papa from 'papaparse';

function getWeekOptions(): string[] {
  const weeks: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const year = d.getFullYear();
    const weekNum = getWeekNumber(d);
    weeks.push(`${year}-W${String(weekNum).padStart(2, '0')}`);
  }
  return weeks;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function PipelineStatsPage() {
  const [stats, setStats] = useState<PipelineStat[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [desk, setDesk] = useState<Desk>('Arthur');
  const [week, setWeek] = useState(getWeekOptions()[0]);
  const [campaignId, setCampaignId] = useState('');
  const [sent, setSent] = useState(0);
  const [accepted, setAccepted] = useState(0);
  const [replies, setReplies] = useState(0);
  const [rdv, setRdv] = useState(0);
  const [saving, setSaving] = useState(false);

  const weeks = getWeekOptions();

  const fetchData = async () => {
    const [statsRes, campaignsRes] = await Promise.all([
      supabase.from('pipeline_stats').select('*').order('week', { ascending: false }).order('desk'),
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
    ]);
    if (statsRes.data) setStats(statsRes.data);
    if (campaignsRes.data) setCampaigns(campaignsRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveStat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: existing } = await supabase
      .from('pipeline_stats')
      .select('id')
      .eq('desk', desk)
      .eq('week', week)
      .single();

    const payload = {
      sent,
      accepted,
      replies,
      rdv,
      campaign_id: campaignId || null,
    };

    if (existing) {
      await supabase.from('pipeline_stats').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('pipeline_stats').insert({ desk, week, ...payload });
    }

    setSent(0);
    setAccepted(0);
    setReplies(0);
    setRdv(0);
    setCampaignId('');
    await fetchData();
    setSaving(false);
  };

  const rate = (num: number, denom: number) =>
    denom > 0 ? ((num / denom) * 100).toFixed(1) + '%' : '—';

  const exportCsv = () => {
    const rows = stats.map((s) => ({
      desk: s.desk,
      week: s.week,
      sent: s.sent,
      accepted: s.accepted,
      replies: s.replies,
      rdv: s.rdv,
      acceptance_rate: rate(s.accepted, s.sent),
      reply_rate: rate(s.replies, s.sent),
      rdv_conversion: rate(s.rdv, s.replies),
    }));
    const csv = Papa.unparse(rows);
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline_stats_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const byWeek = stats.reduce<Record<string, PipelineStat[]>>((acc, s) => {
    if (!acc[s.week]) acc[s.week] = [];
    acc[s.week].push(s);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Pipeline Stats" description="Enter outreach metrics per desk per week">
        <button
          onClick={exportCsv}
          disabled={stats.length === 0}
          className="px-4 py-2 bg-[var(--success)] hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          Export CSV
        </button>
      </PageHeader>

      <form onSubmit={saveStat} className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border)] mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Desk</label>
            <select
              value={desk}
              onChange={(e) => setDesk(e.target.value as Desk)}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {DESKS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Week</label>
            <select
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {weeks.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Campaign (optional)</label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="">No campaign</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.desk})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Sent</label>
            <input
              type="number"
              value={sent}
              onChange={(e) => setSent(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Accepted</label>
            <input
              type="number"
              value={accepted}
              onChange={(e) => setAccepted(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Replies</label>
            <input
              type="number"
              value={replies}
              onChange={(e) => setReplies(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">RDV</label>
            <input
              type="number"
              value={rdv}
              onChange={(e) => setRdv(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>

      {Object.entries(byWeek).map(([weekKey, weekStats]) => (
        <div key={weekKey} className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">{weekKey}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {weekStats.map((s) => (
              <div key={s.id} className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white">{s.desk}</h4>
                  <span className="text-xs text-[var(--text-secondary)]">{s.week}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">Sent</span>
                    <span className="text-white font-medium">{s.sent}</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-secondary)]">Acceptance</span>
                      <span className="text-white font-medium">{s.accepted}/{s.sent} ({rate(s.accepted, s.sent)})</span>
                    </div>
                    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                      <div className="bg-[var(--accent)] rounded-full h-2 transition-all" style={{ width: s.sent > 0 ? `${(s.accepted / s.sent) * 100}%` : '0%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-secondary)]">Replies</span>
                      <span className="text-white font-medium">{s.replies}/{s.sent} ({rate(s.replies, s.sent)})</span>
                    </div>
                    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                      <div className="bg-[var(--warning)] rounded-full h-2 transition-all" style={{ width: s.sent > 0 ? `${(s.replies / s.sent) * 100}%` : '0%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-secondary)]">RDV</span>
                      <span className="text-white font-medium">{s.rdv}/{s.replies} ({rate(s.rdv, s.replies)})</span>
                    </div>
                    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                      <div className="bg-[var(--success)] rounded-full h-2 transition-all" style={{ width: s.replies > 0 ? `${(s.rdv / s.replies) * 100}%` : '0%' }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {stats.length === 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-8 border border-[var(--border)] text-center text-[var(--text-secondary)]">
          No stats yet. Add data above to start tracking.
        </div>
      )}
    </div>
  );
}
