'use client';

import { useState, useMemo } from 'react';
import { PipelineStat, Campaign } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';

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

export default function ByCampaignTab({
  stats,
  campaigns,
  prevStats,
  compare,
}: {
  stats: PipelineStat[];
  campaigns: Campaign[];
  prevStats: PipelineStat[];
  compare: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const campaignStats = useMemo(() => {
    return campaigns.map((c) => {
      const cStats = stats.filter((s) => s.campaign_id === c.id);
      const totals = cStats.reduce(
        (acc, s) => ({
          sent: acc.sent + s.sent,
          accepted: acc.accepted + s.accepted,
          replies: acc.replies + s.replies,
          rdv: acc.rdv + s.rdv,
        }),
        { sent: 0, accepted: 0, replies: 0, rdv: 0 }
      );

      const prevCStats = prevStats.filter((s) => s.campaign_id === c.id);
      const prevTotals = prevCStats.reduce(
        (acc, s) => ({
          sent: acc.sent + s.sent,
          accepted: acc.accepted + s.accepted,
          replies: acc.replies + s.replies,
          rdv: acc.rdv + s.rdv,
        }),
        { sent: 0, accepted: 0, replies: 0, rdv: 0 }
      );

      return { campaign: c, ...totals, prev: prevTotals, weeklyStats: cStats };
    });
  }, [campaigns, stats, prevStats]);

  const selected = selectedId
    ? campaignStats.find((cs) => cs.campaign.id === selectedId)
    : null;

  return (
    <div>
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden mb-6">
        <table>
          <thead>
            <tr className="bg-[var(--bg-tertiary)]">
              <th>Campaign</th>
              <th>Desk</th>
              <th>Contacts</th>
              <th>Sent</th>
              <th>Accepted</th>
              <th>Replies</th>
              <th>RDV</th>
              <th>Conversion</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {campaignStats.map((cs) => (
              <tr
                key={cs.campaign.id}
                onClick={() => setSelectedId(cs.campaign.id === selectedId ? null : cs.campaign.id)}
                className={`cursor-pointer transition-colors ${
                  cs.campaign.id === selectedId
                    ? 'bg-[var(--bg-tertiary)]'
                    : 'hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <td className="text-sm font-medium text-white">{cs.campaign.name}</td>
                <td className="text-sm">{cs.campaign.desk}</td>
                <td className="text-sm">{cs.campaign.contacts_count}</td>
                <td className="text-sm">
                  {cs.sent}
                  {compare && <ChangeIndicator current={cs.sent} previous={cs.prev.sent} />}
                </td>
                <td className="text-sm">
                  {cs.accepted}
                  {compare && <ChangeIndicator current={cs.accepted} previous={cs.prev.accepted} />}
                </td>
                <td className="text-sm">
                  {cs.replies}
                  {compare && <ChangeIndicator current={cs.replies} previous={cs.prev.replies} />}
                </td>
                <td className="text-sm">
                  {cs.rdv}
                  {compare && <ChangeIndicator current={cs.rdv} previous={cs.prev.rdv} />}
                </td>
                <td className="text-sm font-medium text-[var(--success)]">
                  {rate(cs.rdv, cs.sent)}
                </td>
                <td><StatusBadge status={cs.campaign.status} /></td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-[var(--text-secondary)]">
                  No campaigns yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border)]">
          <h3 className="text-sm font-bold text-white mb-4">
            {selected.campaign.name} — Detail
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
              <p className="text-xs text-[var(--text-secondary)] mb-1">Total Sent</p>
              <p className="text-xl font-bold text-white">{selected.sent}</p>
              {compare && <ChangeIndicator current={selected.sent} previous={selected.prev.sent} />}
            </div>
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
              <p className="text-xs text-[var(--text-secondary)] mb-1">Accepted</p>
              <p className="text-xl font-bold text-white">{selected.accepted}</p>
              <p className="text-xs text-[var(--accent)]">
                {rate(selected.accepted, selected.sent)}
                {compare && <ChangeIndicator current={selected.accepted} previous={selected.prev.accepted} />}
              </p>
            </div>
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
              <p className="text-xs text-[var(--text-secondary)] mb-1">Replies</p>
              <p className="text-xl font-bold text-white">{selected.replies}</p>
              <p className="text-xs text-[var(--warning)]">
                {rate(selected.replies, selected.sent)}
                {compare && <ChangeIndicator current={selected.replies} previous={selected.prev.replies} />}
              </p>
            </div>
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
              <p className="text-xs text-[var(--text-secondary)] mb-1">RDV</p>
              <p className="text-xl font-bold text-white">{selected.rdv}</p>
              <p className="text-xs text-[var(--success)]">
                {rate(selected.rdv, selected.replies)}
                {compare && <ChangeIndicator current={selected.rdv} previous={selected.prev.rdv} />}
              </p>
            </div>
          </div>

          {selected.weeklyStats.length > 0 ? (
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Weekly Breakdown</h4>
              <table>
                <thead>
                  <tr className="bg-[var(--bg-tertiary)]">
                    <th>Week</th>
                    <th>Desk</th>
                    <th>Sent</th>
                    <th>Accepted</th>
                    <th>Replies</th>
                    <th>RDV</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.weeklyStats.map((ws) => (
                    <tr key={ws.id}>
                      <td className="text-sm">{ws.week}</td>
                      <td className="text-sm">{ws.desk}</td>
                      <td className="text-sm">{ws.sent}</td>
                      <td className="text-sm">{ws.accepted}</td>
                      <td className="text-sm">{ws.replies}</td>
                      <td className="text-sm">{ws.rdv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">No weekly stats linked to this campaign yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
