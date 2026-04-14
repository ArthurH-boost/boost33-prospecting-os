'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Campaign, Desk, DESKS } from '@/lib/types';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';

export default function CampaignLogPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [desk, setDesk] = useState<Desk>('Arthur');
  const [templateUsed, setTemplateUsed] = useState('');
  const [startDate, setStartDate] = useState('');
  const [contactsCount, setContactsCount] = useState(0);

  const fetchCampaigns = async () => {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setCampaigns(data);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const saveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    await supabase.from('campaigns').insert({
      name,
      desk,
      template_used: templateUsed,
      start_date: startDate || null,
      contacts_count: contactsCount,
      status: 'active',
    });

    setName('');
    setDesk('Arthur');
    setTemplateUsed('');
    setStartDate('');
    setContactsCount(0);
    setShowForm(false);
    setSaving(false);
    await fetchCampaigns();
  };

  const deleteCampaign = async (id: string) => {
    await supabase.from('campaigns').delete().eq('id', id);
    await fetchCampaigns();
  };

  return (
    <div>
      <PageHeader title="Campaign Log" description="Log campaigns configured in Prosp">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ Log Campaign'}
        </button>
      </PageHeader>

      {showForm && (
        <form onSubmit={saveCampaign} className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border)] mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Campaign Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="Q1 Tech CEOs France"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Desk</label>
              <select
                value={desk}
                onChange={(e) => setDesk(e.target.value as Desk)}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {DESKS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Template Used</label>
              <input
                value={templateUsed}
                onChange={(e) => setTemplateUsed(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="e.g. Tech CEO FR v2"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Estimated Contacts</label>
              <input
                type="number"
                value={contactsCount}
                onChange={(e) => setContactsCount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving || !name}
                className="px-6 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Campaign'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden">
        <table>
          <thead>
            <tr className="bg-[var(--bg-tertiary)]">
              <th>Name</th>
              <th>Desk</th>
              <th>Template</th>
              <th>Start Date</th>
              <th>Contacts</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                <td className="text-sm font-medium text-white">{c.name}</td>
                <td className="text-sm">{c.desk}</td>
                <td className="text-sm text-[var(--text-secondary)]">{c.template_used || '—'}</td>
                <td className="text-sm text-[var(--text-secondary)]">
                  {c.start_date ? new Date(c.start_date).toLocaleDateString() : '—'}
                </td>
                <td className="text-sm">{c.contacts_count}</td>
                <td><StatusBadge status={c.status} /></td>
                <td>
                  <button
                    onClick={() => deleteCampaign(c.id)}
                    className="text-[var(--danger)] hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-[var(--text-secondary)]">
                  No campaigns logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
