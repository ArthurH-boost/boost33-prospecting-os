'use client';

import { useEffect, useMemo, useState } from 'react';

type Qualification = {
  id?: string;
  created_at: string;
  contact_name?: string | null;
  company?: string | null;
  qualification?: string | null;
  campaign?: string | null;
  sales?: string | null;
  desk?: string | null;
  ghl_contact_id?: string | null;
  week?: string | null;
  [k: string]: unknown;
};

type PipelineContact = {
  id?: string;
  ghl_contact_id?: string | null;
  stage?: string | null;
  desk?: string | null;
  sales?: string | null;
  last_stage_change_at?: string | null;
  [k: string]: unknown;
};

type CampaignStat = {
  id?: string;
  campaign_name?: string | null;
  desk?: string | null;
  status?: string | null;
  invitations_sent?: number | null;
  connections?: number | null;
  replies?: number | null;
  synced_at?: string | null;
  [k: string]: unknown;
};

type ApiResponse = {
  qualifications: Qualification[];
  pipeline: PipelineContact[];
  campaigns: CampaignStat[];
};

const DESKS = ['Arthur', 'Advisor', 'Boost33'] as const;

const SALES_LIST = [
  'Paulina',
  'Joshua',
  'Baptiste',
  'Yanis',
  'Aurélie',
  'Ilan',
  'Matthieu',
  'Valentin',
  'Jamal',
  'Arthur',
  'Kenneth',
];

const STAGES: { name: string; category: 'linkedin' | 'rdv' | 'sales' | 'terminal' }[] = [
  { name: 'Froid', category: 'linkedin' },
  { name: 'Relance 1', category: 'linkedin' },
  { name: 'Tiède', category: 'linkedin' },
  { name: 'Chaud', category: 'linkedin' },
  { name: 'appel à passer', category: 'rdv' },
  { name: 'Rdv planifié', category: 'rdv' },
  { name: 'Rdv réalisé', category: 'rdv' },
  { name: 'no show closing', category: 'rdv' },
  { name: 'Closing', category: 'sales' },
  { name: 'R1 Inter premium', category: 'sales' },
  { name: 'R1 inter Elite', category: 'sales' },
  { name: 'R1 FR Premium', category: 'sales' },
  { name: 'R1 FR Elite', category: 'sales' },
  { name: 'R2', category: 'sales' },
  { name: 'Contrat envoyé', category: 'sales' },
  { name: 'Deal tardif', category: 'sales' },
  { name: 'Win', category: 'terminal' },
  { name: 'Lose', category: 'terminal' },
];

const CATEGORY_COLORS: Record<string, string> = {
  linkedin: 'bg-blue-500',
  rdv: 'bg-amber-500',
  sales: 'bg-green-500',
  terminal: 'bg-gray-500',
};

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-S${String(weekNo).padStart(2, '0')}`;
}

function weekOf(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return isoWeek(d);
}

function last6Weeks(): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    out.push(isoWeek(d));
  }
  return out;
}

function qualBadge(q?: string | null): string {
  const v = (q || '').toUpperCase();
  if (v === 'CHAUD') return 'bg-red-100 text-red-700 border border-red-200';
  if (v === 'TIÈDE' || v === 'TIEDE') return 'bg-amber-100 text-amber-700 border border-amber-200';
  if (v === 'FROID') return 'bg-blue-100 text-blue-700 border border-blue-200';
  return 'bg-gray-100 text-gray-700 border border-gray-200';
}

type TabKey = 'dashboard' | 'pipeline' | 'sales' | 'campaigns' | 'leads' | 'weekly';

export default function AnalyticsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('dashboard');

  const fetchData = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/analytics/data', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      setData(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentWeek = isoWeek(new Date());

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Analytics Boost33</h1>
            <p className="text-sm text-gray-500">Semaine courante : {currentWeek}</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>
        </div>

        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          {(
            [
              ['dashboard', 'Dashboard'],
              ['pipeline', 'Pipeline'],
              ['sales', 'Par Sales'],
              ['campaigns', 'Campagnes'],
              ['leads', 'Leads'],
              ['weekly', 'Hebdo'],
            ] as [TabKey, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
                tab === k
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {err && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {err}
          </div>
        )}

        {loading && !data && <div className="text-gray-500">Chargement des données...</div>}

        {data && (
          <>
            {tab === 'dashboard' && <DashboardTab data={data} currentWeek={currentWeek} />}
            {tab === 'pipeline' && <PipelineTab data={data} />}
            {tab === 'sales' && <SalesTab data={data} />}
            {tab === 'campaigns' && <CampaignsTab data={data} />}
            {tab === 'leads' && <LeadsTab data={data} />}
            {tab === 'weekly' && <WeeklyTab data={data} />}
          </>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${tone || 'text-gray-900'}`}>{value}</div>
    </div>
  );
}

function DashboardTab({ data, currentWeek }: { data: ApiResponse; currentWeek: string }) {
  const weekLeads = data.qualifications.filter(
    (q) => (q.week || weekOf(q.created_at)) === currentWeek
  );
  const chaud = weekLeads.filter((q) => (q.qualification || '').toUpperCase() === 'CHAUD');
  const tiede = weekLeads.filter((q) => {
    const v = (q.qualification || '').toUpperCase();
    return v === 'TIÈDE' || v === 'TIEDE';
  });
  const froid = weekLeads.filter((q) => (q.qualification || '').toUpperCase() === 'FROID');

  const stageCount = (name: string) =>
    data.pipeline.filter((p) => (p.stage || '').toLowerCase() === name.toLowerCase()).length;

  const deskCounts = DESKS.map((d) => ({
    desk: d,
    count: chaud.filter((q) => q.desk === d).length,
  }));
  const maxDesk = Math.max(1, ...deskCounts.map((d) => d.count));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          KPIs leads — semaine {currentWeek}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card label="Total leads" value={weekLeads.length} />
          <Card label="CHAUD" value={chaud.length} tone="text-red-600" />
          <Card label="TIÈDE" value={tiede.length} tone="text-amber-600" />
          <Card label="FROID" value={froid.length} tone="text-blue-600" />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">KPIs pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card label="Rdv planifié" value={stageCount('Rdv planifié')} />
          <Card label="Rdv réalisé" value={stageCount('Rdv réalisé')} />
          <Card label="Closing" value={stageCount('Closing')} />
          <Card label="Win" value={stageCount('Win')} tone="text-green-600" />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Leads CHAUD par desk — semaine {currentWeek}
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          {deskCounts.map((d) => (
            <div key={d.desk}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{d.desk}</span>
                <span className="text-gray-600">{d.count}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${(d.count / maxDesk) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PipelineTab({ data }: { data: ApiResponse }) {
  const [desk, setDesk] = useState<string>('Tous');
  const filtered = desk === 'Tous' ? data.pipeline : data.pipeline.filter((p) => p.desk === desk);

  const counts = STAGES.map((s) => ({
    ...s,
    count: filtered.filter((p) => (p.stage || '').toLowerCase() === s.name.toLowerCase()).length,
  }));
  const max = Math.max(1, ...counts.map((c) => c.count));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['Tous', ...DESKS].map((d) => (
          <button
            key={d}
            onClick={() => setDesk(d)}
            className={`px-3 py-1.5 text-sm rounded border ${
              desk === d
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
        {counts.map((s) => (
          <div key={s.name} className="flex items-center gap-3">
            <div className="w-40 text-sm text-gray-700 shrink-0">{s.name}</div>
            <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
              <div
                className={`h-full ${CATEGORY_COLORS[s.category]}`}
                style={{ width: `${(s.count / max) * 100}%` }}
              />
            </div>
            <div className="w-10 text-right text-sm font-medium">{s.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesTab({ data }: { data: ApiResponse }) {
  const weeks = useMemo(() => {
    const set = new Set<string>();
    data.qualifications.forEach((q) => {
      const w = q.week || weekOf(q.created_at);
      if (w) set.add(w);
    });
    return Array.from(set).sort().reverse();
  }, [data.qualifications]);

  const [week, setWeek] = useState<string>(weeks[0] || isoWeek(new Date()));

  const rows = SALES_LIST.map((s) => {
    const leads = data.qualifications.filter(
      (q) => q.sales === s && (q.week || weekOf(q.created_at)) === week
    );
    const qual = (v: string) =>
      leads.filter((l) => (l.qualification || '').toUpperCase() === v).length;
    const stageOf = (name: string) =>
      data.pipeline.filter(
        (p) => p.sales === s && (p.stage || '').toLowerCase() === name.toLowerCase()
      ).length;

    return {
      sales: s,
      total: leads.length,
      chaud: qual('CHAUD'),
      tiede: leads.filter((l) => {
        const v = (l.qualification || '').toUpperCase();
        return v === 'TIÈDE' || v === 'TIEDE';
      }).length,
      froid: qual('FROID'),
      rdvP: stageOf('Rdv planifié'),
      rdvR: stageOf('Rdv réalisé'),
      win: stageOf('Win'),
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Semaine :</label>
        <select
          value={week}
          onChange={(e) => setWeek(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded bg-white"
        >
          {weeks.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Sales</th>
              <th className="text-right px-4 py-2 font-medium">Leads</th>
              <th className="text-right px-4 py-2 font-medium">Chaud</th>
              <th className="text-right px-4 py-2 font-medium">Tiède</th>
              <th className="text-right px-4 py-2 font-medium">Froid</th>
              <th className="text-right px-4 py-2 font-medium">Rdv planifié</th>
              <th className="text-right px-4 py-2 font-medium">Rdv réalisé</th>
              <th className="text-right px-4 py-2 font-medium">Win</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.sales} className="border-t border-gray-100">
                <td className="px-4 py-2 font-medium">{r.sales}</td>
                <td className="px-4 py-2 text-right">{r.total}</td>
                <td className="px-4 py-2 text-right text-red-600">{r.chaud}</td>
                <td className="px-4 py-2 text-right text-amber-600">{r.tiede}</td>
                <td className="px-4 py-2 text-right text-blue-600">{r.froid}</td>
                <td className="px-4 py-2 text-right">{r.rdvP}</td>
                <td className="px-4 py-2 text-right">{r.rdvR}</td>
                <td className="px-4 py-2 text-right text-green-600 font-medium">{r.win}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CampaignsTab({ data }: { data: ApiResponse }) {
  const [desk, setDesk] = useState<string>('Tous');

  const filtered = data.campaigns.filter((c) => {
    const deskOk = desk === 'Tous' || c.desk === desk;
    const hasStats =
      (c.invitations_sent || 0) > 0 || (c.connections || 0) > 0 || (c.replies || 0) > 0;
    const running = (c.status || '').toLowerCase() === 'running';
    return deskOk && (running || hasStats);
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['Tous', ...DESKS].map((d) => (
          <button
            key={d}
            onClick={() => setDesk(d)}
            className={`px-3 py-1.5 text-sm rounded border ${
              desk === d
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Campagne</th>
              <th className="text-left px-4 py-2 font-medium">Desk</th>
              <th className="text-right px-4 py-2 font-medium">Invitations</th>
              <th className="text-right px-4 py-2 font-medium">Connexions</th>
              <th className="text-right px-4 py-2 font-medium">Réponses</th>
              <th className="text-right px-4 py-2 font-medium">Taux acceptation</th>
              <th className="text-right px-4 py-2 font-medium">Taux réponse</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const inv = c.invitations_sent || 0;
              const conn = c.connections || 0;
              const rep = c.replies || 0;
              const accept = inv > 0 ? ((conn / inv) * 100).toFixed(1) : '—';
              const reply = conn > 0 ? ((rep / conn) * 100).toFixed(1) : '—';
              return (
                <tr key={c.id || i} className="border-t border-gray-100">
                  <td className="px-4 py-2">{c.campaign_name || '—'}</td>
                  <td className="px-4 py-2 text-gray-600">{c.desk || '—'}</td>
                  <td className="px-4 py-2 text-right">{inv}</td>
                  <td className="px-4 py-2 text-right">{conn}</td>
                  <td className="px-4 py-2 text-right">{rep}</td>
                  <td className="px-4 py-2 text-right">{accept === '—' ? accept : `${accept}%`}</td>
                  <td className="px-4 py-2 text-right">{reply === '—' ? reply : `${reply}%`}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Aucune campagne
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeadsTab({ data }: { data: ApiResponse }) {
  const [search, setSearch] = useState('');
  const [qual, setQual] = useState('Tous');
  const [sales, setSales] = useState('Tous');
  const [page, setPage] = useState(1);
  const perPage = 50;

  const stageByGhl = useMemo(() => {
    const m = new Map<string, string>();
    data.pipeline.forEach((p) => {
      if (p.ghl_contact_id) m.set(p.ghl_contact_id, p.stage || '');
    });
    return m;
  }, [data.pipeline]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return data.qualifications.filter((q) => {
      if (qual !== 'Tous') {
        const v = (q.qualification || '').toUpperCase();
        if (qual === 'TIÈDE' ? !(v === 'TIÈDE' || v === 'TIEDE') : v !== qual) return false;
      }
      if (sales !== 'Tous' && q.sales !== sales) return false;
      if (s) {
        const blob = `${q.contact_name || ''} ${q.company || ''} ${q.campaign || ''}`.toLowerCase();
        if (!blob.includes(s)) return false;
      }
      return true;
    });
  }, [data.qualifications, search, qual, sales]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageSafe = Math.min(page, totalPages);
  const rows = filtered.slice((pageSafe - 1) * perPage, pageSafe * perPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Rechercher contact, entreprise, campagne..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-64 px-3 py-1.5 text-sm border border-gray-200 rounded bg-white"
        />
        <select
          value={qual}
          onChange={(e) => {
            setQual(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded bg-white"
        >
          {['Tous', 'CHAUD', 'TIÈDE', 'FROID'].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={sales}
          onChange={(e) => {
            setSales(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded bg-white"
        >
          <option value="Tous">Tous sales</option>
          {SALES_LIST.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Date</th>
              <th className="text-left px-4 py-2 font-medium">Contact</th>
              <th className="text-left px-4 py-2 font-medium">Entreprise</th>
              <th className="text-left px-4 py-2 font-medium">Qualif.</th>
              <th className="text-left px-4 py-2 font-medium">Campagne</th>
              <th className="text-left px-4 py-2 font-medium">Sales</th>
              <th className="text-left px-4 py-2 font-medium">Stage GHL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q, i) => (
              <tr key={q.id || i} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                  {q.created_at ? new Date(q.created_at).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="px-4 py-2">{q.contact_name || '—'}</td>
                <td className="px-4 py-2">{q.company || '—'}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${qualBadge(q.qualification)}`}>
                    {q.qualification || '—'}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-600">{q.campaign || '—'}</td>
                <td className="px-4 py-2">{q.sales || '—'}</td>
                <td className="px-4 py-2 text-gray-600">
                  {(q.ghl_contact_id && stageByGhl.get(q.ghl_contact_id)) || '—'}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Aucun lead
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-600">
          {filtered.length} lead{filtered.length > 1 ? 's' : ''} — page {pageSafe} / {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pageSafe === 1}
            className="px-3 py-1.5 border border-gray-200 rounded bg-white disabled:opacity-50"
          >
            Précédent
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageSafe === totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded bg-white disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}

function WeeklyTab({ data }: { data: ApiResponse }) {
  const weeks = last6Weeks();

  const rows = SALES_LIST.map((s) => {
    const cells = weeks.map((w) => {
      const leads = data.qualifications.filter(
        (q) => q.sales === s && (q.week || weekOf(q.created_at)) === w
      );
      const chaud = leads.filter((l) => (l.qualification || '').toUpperCase() === 'CHAUD').length;
      const tiede = leads.filter((l) => {
        const v = (l.qualification || '').toUpperCase();
        return v === 'TIÈDE' || v === 'TIEDE';
      }).length;
      return { total: leads.length, chaud, tiede };
    });
    const win = data.pipeline.filter(
      (p) => p.sales === s && (p.stage || '').toLowerCase() === 'win'
    ).length;
    const rdv = data.pipeline.filter((p) => {
      const st = (p.stage || '').toLowerCase();
      return p.sales === s && (st === 'rdv planifié' || st === 'rdv réalisé');
    }).length;
    return { sales: s, cells, win, rdv };
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left px-4 py-2 font-medium sticky left-0 bg-gray-50">Sales</th>
            {weeks.map((w) => (
              <th key={w} className="text-center px-3 py-2 font-medium whitespace-nowrap">
                {w}
              </th>
            ))}
            <th className="text-center px-3 py-2 font-medium">Win total</th>
            <th className="text-center px-3 py-2 font-medium">RDV total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sales} className="border-t border-gray-100">
              <td className="px-4 py-2 font-medium sticky left-0 bg-white">{r.sales}</td>
              {r.cells.map((c, i) => (
                <td key={i} className="px-3 py-2 text-center">
                  <div className="font-medium">{c.total}</div>
                  <div className="text-xs text-gray-500">
                    <span className="text-red-600">{c.chaud}C</span>{' '}
                    <span className="text-amber-600">{c.tiede}T</span>
                  </div>
                </td>
              ))}
              <td className="px-3 py-2 text-center font-medium text-green-600">{r.win}</td>
              <td className="px-3 py-2 text-center font-medium">{r.rdv}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
