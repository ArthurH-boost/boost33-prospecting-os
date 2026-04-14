'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { PipelineStat, Campaign, LeadQualification, CampaignStat, DESKS } from '@/lib/types';
import PageHeader from '@/components/PageHeader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function getCurrentWeek(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<PipelineStat[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<LeadQualification[]>([]);
  const [campaignStats, setCampaignStats] = useState<CampaignStat[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [statsRes, campaignsRes, leadsRes, csRes] = await Promise.all([
        supabase.from('pipeline_stats').select('*').order('week', { ascending: false }),
        supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('lead_qualifications').select('*').order('created_at', { ascending: false }),
        supabase.from('campaign_stats').select('*').order('synced_at', { ascending: false }),
      ]);
      if (statsRes.data) setStats(statsRes.data);
      if (campaignsRes.data) setCampaigns(campaignsRes.data);
      if (leadsRes.data) setLeads(leadsRes.data);
      if (csRes.data) setCampaignStats(csRes.data);
    };
    fetch();
  }, []);

  const currentWeek = getCurrentWeek();

  const weekStats = useMemo(
    () => stats.filter((s) => s.week === currentWeek),
    [stats, currentWeek]
  );

  const totals = useMemo(() => {
    return weekStats.reduce(
      (acc, s) => ({
        sent: acc.sent + s.sent,
        accepted: acc.accepted + s.accepted,
        replies: acc.replies + s.replies,
        rdv: acc.rdv + s.rdv,
      }),
      { sent: 0, accepted: 0, replies: 0, rdv: 0 }
    );
  }, [weekStats]);

  const funnelData = useMemo(() => [
    { name: 'Sent', value: totals.sent, fill: '#6366f1' },
    { name: 'Accepted', value: totals.accepted, fill: '#818cf8' },
    { name: 'Replied', value: totals.replies, fill: '#f59e0b' },
    { name: 'RDV', value: totals.rdv, fill: '#22c55e' },
  ], [totals]);

  const topDesk = useMemo(() => {
    let best = { desk: '—', rate: 0 };
    for (const desk of DESKS) {
      const s = weekStats.find((st) => st.desk === desk);
      if (s && s.sent > 0) {
        const r = s.accepted / s.sent;
        if (r > best.rate) best = { desk, rate: r };
      }
    }
    return best;
  }, [weekStats]);

  const csTotals = useMemo(() => {
    const totalInvitations = campaignStats.reduce((s, r) => s + r.invitations_sent, 0);
    const totalConnections = campaignStats.reduce((s, r) => s + r.connections_accepted, 0);
    const totalReplies = campaignStats.reduce((s, r) => s + r.replies_received, 0);
    const avgAcceptance = campaignStats.length > 0
      ? campaignStats.reduce((s, r) => s + r.acceptance_rate, 0) / campaignStats.length
      : 0;
    const avgReplyRate = campaignStats.length > 0
      ? campaignStats.reduce((s, r) => s + r.reply_rate, 0) / campaignStats.length
      : 0;
    const lastSynced = campaignStats.length > 0 ? campaignStats[0].synced_at : null;
    return { totalInvitations, totalConnections, totalReplies, avgAcceptance, avgReplyRate, lastSynced };
  }, [campaignStats]);

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  const chaudLeads = leads.filter((l) => l.qualification === 'CHAUD').slice(0, 5);

  const rate = (num: number, denom: number) =>
    denom > 0 ? ((num / denom) * 100).toFixed(1) + '%' : '—';

  return (
    <div>
      <PageHeader title="Dashboard" description={`Overview — ${currentWeek}`} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
          <p className="text-xs text-[var(--text-secondary)] mb-1">Sent this week</p>
          <p className="text-2xl font-bold text-white">{totals.sent}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
          <p className="text-xs text-[var(--text-secondary)] mb-1">Accepted</p>
          <p className="text-2xl font-bold text-white">{totals.accepted}</p>
          <p className="text-xs text-[var(--accent)]">{rate(totals.accepted, totals.sent)}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
          <p className="text-xs text-[var(--text-secondary)] mb-1">Replies</p>
          <p className="text-2xl font-bold text-white">{totals.replies}</p>
          <p className="text-xs text-[var(--warning)]">{rate(totals.replies, totals.sent)}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
          <p className="text-xs text-[var(--text-secondary)] mb-1">RDV</p>
          <p className="text-2xl font-bold text-white">{totals.rdv}</p>
          <p className="text-xs text-[var(--success)]">{rate(totals.rdv, totals.replies)}</p>
        </div>
      </div>

      {/* Performance Campagnes */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Performance Campagnes</h3>
          {csTotals.lastSynced && (
            <p className="text-xs text-[var(--text-secondary)]">
              Last sync: {new Date(csTotals.lastSynced).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
            <p className="text-xs text-[var(--text-secondary)] mb-1">Invitations Sent</p>
            <p className="text-2xl font-bold text-white">{csTotals.totalInvitations.toLocaleString()}</p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
            <p className="text-xs text-[var(--text-secondary)] mb-1">Connections Accepted</p>
            <p className="text-2xl font-bold text-white">{csTotals.totalConnections.toLocaleString()}</p>
            <p className="text-xs text-[var(--accent)]">{csTotals.avgAcceptance > 0 ? csTotals.avgAcceptance.toFixed(1) + '%' : '—'} acceptance</p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
            <p className="text-xs text-[var(--text-secondary)] mb-1">Replies Received</p>
            <p className="text-2xl font-bold text-white">{csTotals.totalReplies.toLocaleString()}</p>
            <p className="text-xs text-[var(--warning)]">{csTotals.avgReplyRate > 0 ? csTotals.avgReplyRate.toFixed(1) + '%' : '—'} reply rate</p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
            <p className="text-xs text-[var(--text-secondary)] mb-1">Campagnes Actives</p>
            <p className="text-2xl font-bold text-white">{campaignStats.filter(r => r.status === 'active').length}</p>
            <p className="text-xs text-[var(--text-secondary)]">/ {campaignStats.length} total</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Conversion Funnel */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border)]">
          <h3 className="text-sm font-semibold text-white mb-4">Conversion Funnel</h3>
          {totals.sent > 0 ? (
            <div className="space-y-3">
              {funnelData.map((step, i) => {
                const width = totals.sent > 0 ? Math.max((step.value / totals.sent) * 100, 8) : 0;
                return (
                  <div key={step.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-secondary)]">{step.name}</span>
                      <span className="text-white font-medium">{step.value}</span>
                    </div>
                    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-6">
                      <div
                        className="rounded-full h-6 flex items-center justify-end pr-2 text-xs text-white font-medium transition-all"
                        style={{ width: `${width}%`, backgroundColor: step.fill }}
                      >
                        {i > 0 && totals.sent > 0 ? ((step.value / totals.sent) * 100).toFixed(0) + '%' : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)] text-center py-8">No data this week</p>
          )}
        </div>

        {/* Side panels */}
        <div className="space-y-6">
          {/* Top desk + active campaigns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
              <p className="text-xs text-[var(--text-secondary)] mb-1">Top Desk</p>
              <p className="text-xl font-bold text-white">{topDesk.desk}</p>
              <p className="text-xs text-[var(--accent)]">{rate(topDesk.rate, 1)} acceptance</p>
            </div>
            <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
              <p className="text-xs text-[var(--text-secondary)] mb-1">Active Campaigns</p>
              <p className="text-xl font-bold text-white">{activeCampaigns.length}</p>
            </div>
          </div>

          {/* Recent CHAUD leads */}
          <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
            <h4 className="text-sm font-semibold text-[var(--danger)] mb-3">Recent CHAUD Leads</h4>
            {chaudLeads.length > 0 ? (
              <div className="space-y-2">
                {chaudLeads.map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0">
                    <div>
                      <p className="text-sm font-medium text-white">{l.contact_name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{l.company} — {l.desk}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      l.next_action === 'RDV booké' ? 'bg-green-500/20 text-green-400' :
                      l.next_action === 'Relance' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {l.next_action}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">No CHAUD leads yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Desk comparison this week */}
      {weekStats.length > 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border)]">
          <h3 className="text-sm font-semibold text-white mb-4">This Week by Desk</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weekStats.map((s) => ({
              desk: s.desk,
              Sent: s.sent,
              Accepted: s.accepted,
              Replies: s.replies,
              RDV: s.rdv,
            }))}>
              <XAxis dataKey="desk" stroke="#9499b3" fontSize={12} />
              <YAxis stroke="#9499b3" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2e3144', borderRadius: 8, color: '#e4e5eb' }}
              />
              <Bar dataKey="Sent" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Accepted" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Replies" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="RDV" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
