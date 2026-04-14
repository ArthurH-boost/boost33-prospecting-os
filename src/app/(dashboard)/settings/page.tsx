'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TeamProfile, Desk, DESKS } from '@/lib/types';
import PageHeader from '@/components/PageHeader';

interface DeskApiKey {
  desk: Desk;
  key: string;
  saved: boolean;
}

interface TestResult {
  desk: Desk;
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}

const DEFAULT_PROFILES: Omit<TeamProfile, 'id' | 'created_at' | 'prosp_api_key'>[] = [
  {
    name: 'Paulina Kudzinskaitė',
    first_name: 'Paulina',
    last_name: 'Kudzinskaitė',
    job_title: 'Digital Marketing Specialist',
    linkedin_url: 'https://www.linkedin.com/in/paulina-kudzinskait%C4%97-a489a5167',
    desk: 'Arthur',
  },
  {
    name: 'Arthur Hamelin',
    first_name: 'Arthur',
    last_name: 'Hamelin',
    job_title: 'Head of Sales',
    linkedin_url: 'https://www.linkedin.com/in/arthur-hamelin-944287139',
    desk: 'Boost33',
  },
  {
    name: 'Hugh Gareau',
    first_name: 'Hugh',
    last_name: 'Gareau',
    job_title: 'Senior Business Developer',
    linkedin_url: 'https://www.linkedin.com/in/hugh-gareau-9379a7238',
    desk: 'Boost33',
  },
  {
    name: 'Kenneth Tanga',
    first_name: 'Kenneth',
    last_name: 'Tanga',
    job_title: 'Head of Sales',
    linkedin_url: 'https://www.linkedin.com/in/kenneth-tanga18000',
    desk: 'Boost33',
  },
  {
    name: 'Baptiste Sery',
    first_name: 'Baptiste',
    last_name: 'Sery',
    job_title: 'Business Development',
    linkedin_url: 'https://www.linkedin.com/in/baptiste-sery-2676a4209',
    desk: 'Advisor',
  },
  {
    name: 'Yanis Amaouche',
    first_name: 'Yanis',
    last_name: 'Amaouche',
    job_title: 'Advisor',
    linkedin_url: 'https://www.linkedin.com/in/yanis-amaouche-bb8660386',
    desk: 'Advisor',
  },
  {
    name: 'Aurélie Nabaile',
    first_name: 'Aurélie',
    last_name: 'Nabaile',
    job_title: 'Conseiller',
    linkedin_url: 'https://www.linkedin.com/in/aurelie-nabaile-6a5246106',
    desk: 'Advisor',
  },
  {
    name: 'Ilan Lambert',
    first_name: 'Ilan',
    last_name: 'Lambert',
    job_title: 'Advisor startup & PME',
    linkedin_url: 'https://www.linkedin.com/in/ilan-lambert-a734a5308',
    desk: 'Advisor',
  },
  {
    name: 'Matthieu Mace',
    first_name: 'Matthieu',
    last_name: 'Mace',
    job_title: 'Associé gérant',
    linkedin_url: 'https://www.linkedin.com/in/matthieumace',
    desk: 'Advisor',
  },
  {
    name: 'Valentin Stettler',
    first_name: 'Valentin',
    last_name: 'Stettler',
    job_title: 'Sales Executive',
    linkedin_url: 'https://www.linkedin.com/in/valentin-stettler78',
    desk: 'Advisor',
  },
];

export default function SettingsPage() {
  const [profiles, setProfiles] = useState<TeamProfile[]>([]);
  const [apiKeys, setApiKeys] = useState<DeskApiKey[]>(
    DESKS.map((d) => ({ desk: d, key: '', saved: false }))
  );
  const [testResults, setTestResults] = useState<TestResult[]>(
    DESKS.map((d) => ({ desk: d, status: 'idle', message: '' }))
  );
  const [seeding, setSeeding] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);

  const fetchData = async () => {
    // Fetch profiles
    const { data: profileData } = await supabase
      .from('team_profiles')
      .select('*')
      .order('desk')
      .order('name');
    if (profileData) setProfiles(profileData);

    // Fetch API keys from settings
    const { data: settingsData } = await supabase
      .from('settings')
      .select('*')
      .like('key', 'prosp_api_key_%');
    if (settingsData) {
      setApiKeys((prev) =>
        prev.map((ak) => {
          const setting = settingsData.find(
            (s: { key: string; value: string }) => s.key === `prosp_api_key_${ak.desk.toLowerCase()}`
          );
          return setting ? { ...ak, key: setting.value, saved: true } : ak;
        })
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const seedProfiles = async () => {
    setSeeding(true);
    // Only insert profiles that don't already exist (by linkedin_url)
    const existingUrls = new Set(profiles.map((p) => p.linkedin_url));
    const toInsert = DEFAULT_PROFILES.filter((p) => !existingUrls.has(p.linkedin_url));

    if (toInsert.length > 0) {
      await supabase.from('team_profiles').insert(toInsert);
    }
    await fetchData();
    setSeeding(false);
  };

  const deleteProfile = async (id: string) => {
    await supabase.from('team_profiles').delete().eq('id', id);
    await fetchData();
  };

  const saveApiKey = async (desk: Desk, key: string) => {
    setSavingKeys(true);
    const settingKey = `prosp_api_key_${desk.toLowerCase()}`;
    await supabase.from('settings').upsert(
      { key: settingKey, value: key, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    setApiKeys((prev) =>
      prev.map((ak) => (ak.desk === desk ? { ...ak, saved: true } : ak))
    );
    setSavingKeys(false);
  };

  const testConnection = async (desk: Desk) => {
    setTestResults((prev) =>
      prev.map((tr) =>
        tr.desk === desk ? { ...tr, status: 'loading', message: 'Testing...' } : tr
      )
    );

    const ak = apiKeys.find((a) => a.desk === desk);
    if (!ak?.key) {
      setTestResults((prev) =>
        prev.map((tr) =>
          tr.desk === desk ? { ...tr, status: 'error', message: 'No API key configured' } : tr
        )
      );
      return;
    }

    try {
      const res = await fetch('/api/prosp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: '/campaigns/lists', apiKey: ak.key, data: {} }),
      });
      const data = await res.json();

      if (res.ok && !data.error) {
        setTestResults((prev) =>
          prev.map((tr) =>
            tr.desk === desk
              ? { ...tr, status: 'success', message: 'Connection OK' }
              : tr
          )
        );
      } else {
        setTestResults((prev) =>
          prev.map((tr) =>
            tr.desk === desk
              ? { ...tr, status: 'error', message: data.error || data.message || `HTTP ${res.status}` }
              : tr
          )
        );
      }
    } catch (err) {
      setTestResults((prev) =>
        prev.map((tr) =>
          tr.desk === desk
            ? { ...tr, status: 'error', message: err instanceof Error ? err.message : 'Network error' }
            : tr
        )
      );
    }
  };

  const profilesByDesk = DESKS.reduce<Record<Desk, TeamProfile[]>>((acc, d) => {
    acc[d] = profiles.filter((p) => p.desk === d);
    return acc;
  }, {} as Record<Desk, TeamProfile[]>);

  return (
    <div>
      <PageHeader title="Settings" description="Team profiles, API keys & connections" />

      {/* ====== SECTION 1: TEAM PROFILES ====== */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Team Profiles</h2>
          <button
            onClick={seedProfiles}
            disabled={seeding}
            className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {seeding ? 'Loading...' : profiles.length === 0 ? 'Load Default Profiles' : 'Sync Missing Profiles'}
          </button>
        </div>

        {DESKS.map((desk) => (
          <div key={desk} className="mb-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">{desk}</h3>
            {profilesByDesk[desk].length > 0 ? (
              <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden">
                <table>
                  <thead>
                    <tr className="bg-[var(--bg-tertiary)]">
                      <th>Name</th>
                      <th>Job Title</th>
                      <th>LinkedIn</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profilesByDesk[desk].map((p) => (
                      <tr key={p.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                        <td className="text-sm font-medium text-white">{p.name}</td>
                        <td className="text-sm text-[var(--text-secondary)]">{p.job_title}</td>
                        <td className="text-sm">
                          <a
                            href={p.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline"
                          >
                            Profile
                          </a>
                        </td>
                        <td>
                          <button
                            onClick={() => deleteProfile(p.id)}
                            className="text-[var(--danger)] hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                No profiles for this desk. Click &quot;Load Default Profiles&quot; to seed.
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ====== SECTION 2 & 3: API KEYS + TEST ====== */}
      <div className="mb-10">
        <h2 className="text-base font-semibold text-white mb-4">Prosp API Keys</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DESKS.map((desk) => {
            const ak = apiKeys.find((a) => a.desk === desk)!;
            const tr = testResults.find((t) => t.desk === desk)!;
            return (
              <div
                key={desk}
                className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]"
              >
                <h3 className="text-sm font-bold text-white mb-3">{desk}</h3>
                <div className="mb-3">
                  <label className="block text-xs text-[var(--text-secondary)] mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={ak.key}
                    onChange={(e) =>
                      setApiKeys((prev) =>
                        prev.map((a) =>
                          a.desk === desk ? { ...a, key: e.target.value, saved: false } : a
                        )
                      )
                    }
                    placeholder="prosp_api_key_..."
                    className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveApiKey(desk, ak.key)}
                    disabled={savingKeys || !ak.key || ak.saved}
                    className="flex-1 px-3 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {ak.saved ? 'Saved' : 'Save Key'}
                  </button>
                  <button
                    onClick={() => testConnection(desk)}
                    disabled={!ak.key || tr.status === 'loading'}
                    className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border)] text-white text-xs font-medium rounded-lg transition-colors border border-[var(--border)] disabled:opacity-50"
                  >
                    {tr.status === 'loading' ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
                {tr.status !== 'idle' && tr.status !== 'loading' && (
                  <div
                    className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium ${
                      tr.status === 'success'
                        ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                        : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {tr.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
