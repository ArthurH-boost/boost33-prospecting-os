'use client';

import { useState, useMemo } from 'react';
import { CampaignStat, Desk, DESKS } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';

const fmtRate = (value: number) => (value > 0 ? value.toFixed(1) + '%' : '—');

export default function CampagnesTab({
  data,
  error,
  onRefresh,
}: {
  data: CampaignStat[];
  error: string | null;
  onRefresh: () => Promise<void>;
}) {
  const [deskFilter, setDeskFilter] = useState<Desk | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    return data.filter((row) => {
      if (deskFilter !== 'all' && row.desk !== deskFilter) return false;
      if (statusFilter === 'active' && row.status !== 'active') return false;
      return true;
    });
  }, [data, deskFilter, statusFilter]);

  const deskInfo = useMemo(() => {
    const map: Record<string, { count: number; lastSync: string | null }> = {};
    for (const d of DESKS) {
      const rows = data.filter((r) => r.desk === d);
      const latest = rows.reduce((acc, r) => {
        if (!r.synced_at) return acc;
        return !acc || r.synced_at > acc ? r.synced_at : acc;
      }, null as string | null);
      map[d] = { count: rows.length, lastSync: latest };
    }
    return map;
  }, [data]);

  const desksInData = useMemo(() => {
    return DESKS.filter((d) => deskInfo[d].count > 0);
  }, [deskInfo]);

  const desksWithNoData = useMemo(() => {
    return DESKS.filter((d) => deskInfo[d].count === 0);
  }, [deskInfo]);

  const kpis = useMemo(() => {
    const totalInvitations = filtered.reduce((s, r) => s + (r.invitations_sent || 0), 0);
    const totalConnections = filtered.reduce((s, r) => s + (r.connections_accepted || 0), 0);
    const totalReplies = filtered.reduce((s, r) => s + (r.replies_received || 0), 0);
    const avgAcceptance =
      filtered.length > 0
        ? filtered.reduce((s, r) => s + (r.acceptance_rate || 0), 0) / filtered.length
        : 0;
    return { totalInvitations, totalConnections, avgAcceptance, totalReplies };
  }, [filtered]);

  const latestSync = useMemo(() => {
    if (data.length === 0) return null;
    return data.reduce((latest, r) => {
      if (!r.synced_at) return latest;
      return !latest || r.synced_at > latest ? r.synced_at : latest;
    }, '' as string);
  }, [data]);

  return (
    <div>
      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <p className="font-medium mb-1">Erreur lors du chargement de campaign_stats</p>
          <p className="text-red-400/80">{error}</p>
          <p className="text-xs text-red-400/60 mt-2">Verifiez que la table &quot;campaign_stats&quot; existe dans Supabase et que les colonnes correspondent au schema attendu.</p>
        </div>
      )}

      {/* Header with refresh + period note */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-3 py-1.5 rounded-lg">
            Stats 30 derniers jours
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {data.length} campagne{data.length !== 1 ? 's' : ''} — Desks: {desksInData.length > 0 ? desksInData.join(', ') : 'aucun'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {latestSync && (
            <p className="text-xs text-[var(--text-secondary)]">
              Derniere sync: {new Date(latestSync).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors disabled:opacity-50"
          >
            {refreshing ? 'Chargement...' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* Desk availability warnings */}
      {desksWithNoData.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {desksWithNoData.map((d) => (
            <div key={d} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <span className="text-xs font-medium text-yellow-400">{d}</span>
              <span className="text-xs text-yellow-400/70">Donnees non disponibles - timeout API</span>
            </div>
          ))}
          {desksInData.map((d) => (
            <div key={d} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="text-xs font-medium text-green-400">{d} ({deskInfo[d].count})</span>
              {deskInfo[d].lastSync && (
                <span className="text-xs text-green-400/70">
                  sync {new Date(deskInfo[d].lastSync!).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
          <p className="text-xs text-[var(--text-secondary)] mb-1">Total Invitations</p>
          <p className="text-2xl font-bold text-white">{kpis.totalInvitations.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
          <p className="text-xs text-[var(--text-secondary)] mb-1">Total Connections</p>
          <p className="text-2xl font-bold text-white">{kpis.totalConnections.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
          <p className="text-xs text-[var(--text-secondary)] mb-1">Taux Acceptation Moyen</p>
          <p className="text-2xl font-bold text-[var(--accent)]">{fmtRate(kpis.avgAcceptance)}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
          <p className="text-xs text-[var(--text-secondary)] mb-1">Total Replies</p>
          <p className="text-2xl font-bold text-white">{kpis.totalReplies.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={deskFilter}
          onChange={(e) => setDeskFilter(e.target.value as Desk | 'all')}
          className="px-3 py-2 rounded-lg text-sm bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        >
          <option value="all">Tous les Desks ({data.length})</option>
          {DESKS.map((d) => (
            <option key={d} value={d}>{d} ({deskInfo[d].count})</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'active' | 'all')}
          className="px-3 py-2 rounded-lg text-sm bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        >
          <option value="all">Tous les Statuts</option>
          <option value="active">Actives uniquement</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden">
        <table>
          <thead>
            <tr className="bg-[var(--bg-tertiary)]">
              <th>Desk</th>
              <th>Campagne</th>
              <th>Invitations</th>
              <th>Connexions</th>
              <th>Taux Accept.</th>
              <th>Reponses</th>
              <th>Taux Reponse</th>
              <th>Statut</th>
              <th>Derniere Sync</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                <td className="text-sm">{row.desk}</td>
                <td className="text-sm font-medium text-white">{row.campaign_name}</td>
                <td className="text-sm">{row.invitations_sent ?? 0}</td>
                <td className="text-sm">{row.connections_accepted ?? 0}</td>
                <td className="text-sm font-medium text-[var(--accent)]">{fmtRate(row.acceptance_rate ?? 0)}</td>
                <td className="text-sm">{row.replies_received ?? 0}</td>
                <td className="text-sm font-medium text-[var(--warning)]">{fmtRate(row.reply_rate ?? 0)}</td>
                <td><StatusBadge status={row.status} /></td>
                <td className="text-sm text-[var(--text-secondary)]">
                  {row.synced_at
                    ? new Date(row.synced_at).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-[var(--text-secondary)]">
                  {data.length === 0
                    ? 'Aucune donnee dans campaign_stats. Verifiez la table Supabase.'
                    : 'Aucune campagne ne correspond aux filtres.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
