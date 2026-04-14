'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Campaign, Template } from '@/lib/types';
import PageHeader from '@/components/PageHeader';


interface ChecklistItem {
  label: string;
  ok: boolean;
  detail: string;
}

export default function ReviewKickoffPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [template, setTemplate] = useState<Template | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<string>('');

  const fetchCampaigns = async () => {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .in('status', ['draft', 'ready'])
      .order('created_at', { ascending: false });
    if (data) setCampaigns(data);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setChecklist([]);
      setTemplate(null);
      return;
    }

    const campaign = campaigns.find((c) => c.id === selectedId);
    if (!campaign) return;

    const buildChecklist = async () => {
      // Fetch template if exists
      let tmpl: Template | null = null;
      if (campaign.template_id) {
        const { data } = await supabase
          .from('templates')
          .select('*')
          .eq('id', campaign.template_id)
          .single();
        tmpl = data;
        setTemplate(data);
      }

      const items: ChecklistItem[] = [
        {
          label: 'Contacts loaded',
          ok: campaign.contacts_count > 0,
          detail: campaign.contacts_count > 0
            ? `${campaign.contacts_count} contacts`
            : 'No contacts — set count in Campaign Setup',
        },
        {
          label: 'Template selected',
          ok: !!tmpl,
          detail: tmpl ? `${tmpl.name} (${tmpl.lang})` : 'No template selected',
        },
        {
          label: 'Prosp API Key',
          ok: !!campaign.prosp_api_key,
          detail: campaign.prosp_api_key ? 'Configured' : 'Missing — add in Campaign Setup',
        },
        {
          label: 'n8n Webhook URL',
          ok: !!campaign.webhook_url,
          detail: campaign.webhook_url ? 'Configured' : 'Missing — add in Campaign Setup',
        },
        {
          label: 'Schedule configured',
          ok: !!(campaign.schedule_json?.max_per_day && campaign.schedule_json?.start_time),
          detail: campaign.schedule_json?.max_per_day
            ? `${campaign.schedule_json.max_per_day}/day, ${campaign.schedule_json.start_time}–${campaign.schedule_json.end_time}`
            : 'No schedule set',
        },
      ];

      setChecklist(items);
    };

    buildChecklist();
  }, [selectedId, campaigns]);

  const allChecked = checklist.length > 0 && checklist.every((item) => item.ok);

  const kickoff = async () => {
    const campaign = campaigns.find((c) => c.id === selectedId);
    if (!campaign || !campaign.webhook_url) return;

    setLaunching(true);
    setLaunchResult('');

    try {
      const payload = {
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        desk: campaign.desk,
        contacts_count: campaign.contacts_count,
        template: template
          ? { id: template.id, name: template.name, message: template.message }
          : null,
        schedule: campaign.schedule_json,
        prosp_api_key: campaign.prosp_api_key,
      };

      const res = await fetch(campaign.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await supabase
          .from('campaigns')
          .update({ status: 'active' })
          .eq('id', campaign.id);

        setLaunchResult('Campaign launched successfully! Status updated to active.');
        await fetchCampaigns();
        setSelectedId('');
      } else {
        setLaunchResult(`Webhook returned ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      setLaunchResult(`Error: ${err instanceof Error ? err.message : 'Failed to reach webhook'}`);
    }

    setLaunching(false);
  };

  return (
    <div>
      <PageHeader
        title="Review & Kickoff"
        description="Pre-launch checklist and campaign activation"
      />

      {/* Campaign Selector */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border)] mb-6">
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Select Campaign to Review
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full max-w-md px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          <option value="">Choose a campaign...</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.desk}) — {c.status}
            </option>
          ))}
        </select>
      </div>

      {/* Checklist */}
      {selectedId && checklist.length > 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border)] mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">Pre-Launch Checklist</h3>
          <div className="space-y-3">
            {checklist.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  item.ok
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                <span className={`text-lg ${item.ok ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                  {item.ok ? '\u2713' : '\u2717'}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={kickoff}
              disabled={!allChecked || launching}
              className="px-6 py-2.5 bg-[var(--success)] hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {launching ? 'Launching...' : 'Launch Campaign'}
            </button>
            {!allChecked && (
              <p className="text-xs text-[var(--warning)]">
                All checks must pass before launching.
              </p>
            )}
          </div>

          {launchResult && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              launchResult.includes('successfully')
                ? 'bg-green-500/10 text-[var(--success)] border border-green-500/30'
                : 'bg-red-500/10 text-[var(--danger)] border border-red-500/30'
            }`}>
              {launchResult}
            </div>
          )}
        </div>
      )}

      {/* Template Preview */}
      {template && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border)]">
          <h3 className="text-sm font-semibold text-white mb-3">Template Preview</h3>
          <div className="flex gap-4 mb-3">
            <span className="text-xs px-2 py-1 bg-[var(--bg-tertiary)] rounded text-[var(--text-secondary)]">
              {template.lang}
            </span>
            <span className="text-xs px-2 py-1 bg-[var(--bg-tertiary)] rounded text-[var(--text-secondary)]">
              {template.sector}
            </span>
            <span className="text-xs px-2 py-1 bg-[var(--bg-tertiary)] rounded text-[var(--text-secondary)]">
              {template.persona}
            </span>
          </div>
          <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
            {template.message}
          </div>
        </div>
      )}
    </div>
  );
}
