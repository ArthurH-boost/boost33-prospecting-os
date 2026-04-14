'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  LeadQualification,
  Campaign,
  Desk,
  DESKS,
  Qualification,
  NextAction,
  LeadStatus,
  LEAD_STATUSES,
} from '@/lib/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const QUALIFICATIONS: Qualification[] = ['CHAUD', 'TIEDE', 'FROID'];
const NEXT_ACTIONS: NextAction[] = ['RDV booké', 'Relance', 'Pas intéressé'];

const QUAL_COLORS: Record<Qualification, string> = {
  CHAUD: '#ef4444',
  TIEDE: '#f59e0b',
  FROID: '#3b82f6',
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  'À contacter': 'bg-blue-500/20 text-blue-400',
  'Appelé': 'bg-yellow-500/20 text-yellow-400',
  'RDV booké': 'bg-green-500/20 text-green-400',
  'Pas intéressé': 'bg-red-500/20 text-red-400',
  'Sans réponse': 'bg-gray-500/20 text-gray-400',
};

export default function LeadQualificationTab({
  leads,
  campaigns,
  onRefresh,
}: {
  leads: LeadQualification[];
  campaigns: Campaign[];
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [contactName, setContactName] = useState('');
  const [company, setCompany] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [qualification, setQualification] = useState<Qualification>('TIEDE');
  const [nextAction, setNextAction] = useState<NextAction>('Relance');
  const [campaignId, setCampaignId] = useState('');
  const [desk, setDesk] = useState<Desk>('Arthur');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  const saveQualification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    await supabase.from('lead_qualifications').insert({
      contact_name: contactName,
      company,
      reply_content: replyContent,
      qualification,
      next_action: nextAction,
      campaign_id: campaignId || null,
      desk,
      linkedin_url: linkedinUrl || null,
    });

    setContactName('');
    setCompany('');
    setReplyContent('');
    setQualification('TIEDE');
    setNextAction('Relance');
    setCampaignId('');
    setLinkedinUrl('');
    setSaving(false);
    setShowForm(false);
    onRefresh();
  };

  const updateStatusWithUser = async (leadId: string, newStatus: LeadStatus) => {
    setUpdatingId(leadId);
    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.email || user?.id || 'unknown';
    await supabase
      .from('lead_qualifications')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        updated_by: userName,
      })
      .eq('id', leadId);
    setUpdatingId(null);
    onRefresh();
  };

  const qualBreakdown = useMemo(() => {
    return QUALIFICATIONS.map((q) => ({
      name: q,
      value: leads.filter((l) => l.qualification === q).length,
    }));
  }, [leads]);

  const chaudLeads = useMemo(
    () => leads.filter((l) => l.qualification === 'CHAUD'),
    [leads]
  );

  const getGhlLink = (lead: LeadQualification) => {
    const searchParam = lead.linkedin_url
      ? encodeURIComponent(lead.linkedin_url)
      : encodeURIComponent(lead.contact_name);
    return `https://app.leadconnectorhq.com/contacts/?search=${searchParam}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-semibold text-white">Lead Qualification</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ Qualify Lead'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={saveQualification} className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border)] mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Contact Name</label>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Company</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">LinkedIn URL</label>
              <input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Campaign</label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="">No campaign</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Qualification</label>
              <div className="flex gap-2">
                {QUALIFICATIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQualification(q)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                      qualification === q
                        ? 'text-white'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                    style={qualification === q ? { backgroundColor: QUAL_COLORS[q] } : {}}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Next Action</label>
              <select
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value as NextAction)}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {NEXT_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Reply Content (short)</label>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving || !contactName}
            className="px-6 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Qualification'}
          </button>
        </form>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Pie chart */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border)]">
          <h4 className="text-sm font-semibold text-white mb-4">Qualification Breakdown</h4>
          {leads.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={qualBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {qualBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={QUAL_COLORS[entry.name as Qualification]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2e3144', borderRadius: 8, color: '#e4e5eb' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--text-secondary)] text-center py-8">No leads qualified yet.</p>
          )}
        </div>

        {/* Counts */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border)]">
          <h4 className="text-sm font-semibold text-white mb-4">Summary</h4>
          <div className="space-y-3">
            {QUALIFICATIONS.map((q) => {
              const count = leads.filter((l) => l.qualification === q).length;
              return (
                <div key={q} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: QUAL_COLORS[q] }} />
                    <span className="text-sm text-white">{q}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{count}</span>
                </div>
              );
            })}
            <div className="pt-2 border-t border-[var(--border)] flex justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Total</span>
              <span className="text-sm font-bold text-white">{leads.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CHAUD leads to follow up */}
      {chaudLeads.length > 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-[var(--border)]">
            <h4 className="text-sm font-semibold text-[var(--danger)]">CHAUD Leads to Follow Up</h4>
          </div>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr className="bg-[var(--bg-tertiary)]">
                  <th>Contact</th>
                  <th>Company</th>
                  <th>Desk</th>
                  <th>LinkedIn</th>
                  <th>CRM</th>
                  <th>Status</th>
                  <th>Next Action</th>
                  <th>Reply</th>
                  <th>Date</th>
                  <th>Mis a jour par</th>
                </tr>
              </thead>
              <tbody>
                {chaudLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="text-sm font-medium text-white">{l.contact_name}</td>
                    <td className="text-sm">{l.company}</td>
                    <td className="text-sm">{l.desk}</td>
                    <td className="text-sm">
                      {l.linkedin_url ? (
                        <a
                          href={l.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)] hover:underline"
                        >
                          LinkedIn
                        </a>
                      ) : (
                        <span className="text-[var(--text-secondary)]">—</span>
                      )}
                    </td>
                    <td className="text-sm">
                      <a
                        href={getGhlLink(l)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:underline"
                      >
                        GHL
                      </a>
                    </td>
                    <td>
                      <select
                        value={l.status || 'À contacter'}
                        onChange={(e) => updateStatusWithUser(l.id, e.target.value as LeadStatus)}
                        disabled={updatingId === l.id}
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--accent)] ${STATUS_COLORS[l.status || 'À contacter']}`}
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        l.next_action === 'RDV booké' ? 'bg-green-500/20 text-green-400' :
                        l.next_action === 'Relance' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {l.next_action}
                      </span>
                    </td>
                    <td className="text-sm text-[var(--text-secondary)] max-w-[200px]" title={l.reply_content || ''}>
                      {l.reply_content && l.reply_content.length > 60 ? l.reply_content.slice(0, 60) + '...' : l.reply_content}
                    </td>
                    <td className="text-sm text-[var(--text-secondary)]">
                      {new Date(l.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-xs text-[var(--text-secondary)]">
                      {l.updated_by ? (
                        <div>
                          <div>{l.updated_by}</div>
                          <div className="text-[10px] opacity-60">
                            {l.updated_at ? new Date(l.updated_at).toLocaleString() : ''}
                          </div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All leads */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border)]">
          <h4 className="text-sm font-semibold text-white">All Qualified Leads</h4>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr className="bg-[var(--bg-tertiary)]">
                <th>Contact</th>
                <th>Company</th>
                <th>Desk</th>
                <th>LinkedIn</th>
                <th>CRM</th>
                <th>Qualification</th>
                <th>Status</th>
                <th>Next Action</th>
                <th>Reply</th>
                <th>Date</th>
                <th>Mis a jour par</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td className="text-sm font-medium text-white">{l.contact_name}</td>
                  <td className="text-sm">{l.company}</td>
                  <td className="text-sm">{l.desk}</td>
                  <td className="text-sm">
                    {l.linkedin_url ? (
                      <a
                        href={l.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] hover:underline"
                      >
                        LinkedIn
                      </a>
                    ) : (
                      <span className="text-[var(--text-secondary)]">—</span>
                    )}
                  </td>
                  <td className="text-sm">
                    <a
                      href={getGhlLink(l)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:underline"
                    >
                      GHL
                    </a>
                  </td>
                  <td>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-bold"
                      style={{ backgroundColor: QUAL_COLORS[l.qualification] + '33', color: QUAL_COLORS[l.qualification] }}
                    >
                      {l.qualification}
                    </span>
                  </td>
                  <td>
                    <select
                      value={l.status || 'À contacter'}
                      onChange={(e) => updateStatusWithUser(l.id, e.target.value as LeadStatus)}
                      disabled={updatingId === l.id}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--accent)] ${STATUS_COLORS[l.status || 'À contacter']}`}
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      l.next_action === 'RDV booké' ? 'bg-green-500/20 text-green-400' :
                      l.next_action === 'Relance' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {l.next_action}
                    </span>
                  </td>
                  <td className="text-sm text-[var(--text-secondary)] max-w-[200px]" title={l.reply_content || ''}>
                    {l.reply_content && l.reply_content.length > 60 ? l.reply_content.slice(0, 60) + '...' : l.reply_content}
                  </td>
                  <td className="text-sm text-[var(--text-secondary)]">
                    {new Date(l.created_at).toLocaleDateString()}
                  </td>
                  <td className="text-xs text-[var(--text-secondary)]">
                    {l.updated_by ? (
                      <div>
                        <div>{l.updated_by}</div>
                        <div className="text-[10px] opacity-60">
                          {l.updated_at ? new Date(l.updated_at).toLocaleString() : ''}
                        </div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-[var(--text-secondary)]">
                    No leads qualified yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
