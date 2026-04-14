'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PipelineStat, Campaign, LeadQualification, CampaignStat, DatePreset } from '@/lib/types';
import PageHeader from '@/components/PageHeader';
import DateFilter, { getDateRange, getPreviousPeriodRange } from '@/components/DateFilter';
import ByDeskTab from './ByDeskTab';
import ByCampaignTab from './ByCampaignTab';
import LeadQualificationTab from './LeadQualificationTab';
import CampagnesTab from './CampagnesTab';

type Tab = 'desk' | 'campaign' | 'leads' | 'campagnes';

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('desk');
  const [stats, setStats] = useState<PipelineStat[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<LeadQualification[]>([]);
  const [campaignStats, setCampaignStats] = useState<CampaignStat[]>([]);
  const [campaignStatsError, setCampaignStatsError] = useState<string | null>(null);
  const [prevLeads, setPrevLeads] = useState<LeadQualification[]>([]);
  const [prevStats, setPrevStats] = useState<PipelineStat[]>([]);

  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');
  const [compare, setCompare] = useState(false);

  const fetchCampaignStats = useCallback(async () => {
    console.log('[campaign_stats] Fetching all rows...');
    const res = await supabase
      .from('campaign_stats')
      .select('*')
      .order('synced_at', { ascending: false });

    console.log('[campaign_stats] response:', { data: res.data, error: res.error, count: res.data?.length });
    if (res.error) {
      console.error('[campaign_stats] Error:', res.error);
      setCampaignStatsError(res.error.message);
    } else {
      setCampaignStatsError(null);
      setCampaignStats(res.data ?? []);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    const range = getDateRange(datePreset);

    const [statsRes, campaignsRes, leadsRes] = await Promise.all([
      supabase
        .from('pipeline_stats')
        .select('*')
        .gte('created_at', range.from)
        .lt('created_at', range.to)
        .order('week', { ascending: false })
        .order('desk'),
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase
        .from('lead_qualifications')
        .select('*')
        .gte('created_at', range.from)
        .lt('created_at', range.to)
        .order('created_at', { ascending: false }),
    ]);
    if (statsRes.data) setStats(statsRes.data);
    if (campaignsRes.data) setCampaigns(campaignsRes.data);
    if (leadsRes.data) setLeads(leadsRes.data);

    await fetchCampaignStats();

    if (compare) {
      const prevRange = getPreviousPeriodRange(datePreset);
      const [prevStatsRes, prevLeadsRes] = await Promise.all([
        supabase
          .from('pipeline_stats')
          .select('*')
          .gte('created_at', prevRange.from)
          .lt('created_at', prevRange.to)
          .order('week', { ascending: false }),
        supabase
          .from('lead_qualifications')
          .select('*')
          .gte('created_at', prevRange.from)
          .lt('created_at', prevRange.to),
      ]);
      if (prevStatsRes.data) setPrevStats(prevStatsRes.data);
      if (prevLeadsRes.data) setPrevLeads(prevLeadsRes.data);
    } else {
      setPrevStats([]);
      setPrevLeads([]);
    }
  }, [datePreset, compare, fetchCampaignStats]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'desk', label: 'By Desk' },
    { key: 'campaign', label: 'By Campaign' },
    { key: 'leads', label: 'Lead Qualification' },
    { key: 'campagnes', label: 'Campagnes' },
  ];

  return (
    <div>
      <PageHeader title="Analytics" description="Full analytics dashboard — desks, campaigns, lead qualification" />

      <div className="flex gap-1 mb-6 bg-[var(--bg-secondary)] rounded-lg p-1 border border-[var(--border)] w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); if (t.key === 'campagnes') fetchCampaignStats(); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DateFilter
        selected={datePreset}
        onSelect={setDatePreset}
        compare={compare}
        onCompareToggle={() => setCompare(!compare)}
      />

      {tab === 'desk' && (
        <ByDeskTab stats={stats} leads={leads} prevLeads={compare ? prevLeads : []} prevStats={compare ? prevStats : []} compare={compare} />
      )}
      {tab === 'campaign' && (
        <ByCampaignTab stats={stats} campaigns={campaigns} prevStats={compare ? prevStats : []} compare={compare} />
      )}
      {tab === 'leads' && (
        <LeadQualificationTab leads={leads} campaigns={campaigns} onRefresh={fetchAll} />
      )}
      {tab === 'campagnes' && (
        <CampagnesTab data={campaignStats} error={campaignStatsError} onRefresh={fetchCampaignStats} />
      )}
    </div>
  );
}
