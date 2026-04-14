'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '@/lib/supabase';
import { Desk, DESKS, CEO_TITLES } from '@/lib/types';
import PageHeader from '@/components/PageHeader';

interface CsvRow {
  [key: string]: string;
}

interface FilterStats {
  total: number;
  matched: number;
  matchRate: string;
  dupesRemoved: number;
}

const COLUMN_MAPPINGS: Record<string, string[]> = {
  jobTitle: ['jobtitle', 'job_title', 'title', 'job title', 'position'],
  headline: ['headline', 'linkedin_headline', 'linkedin headline'],
  linkedin_url: ['linkedin_url', 'linkedin url', 'linkedinurl', 'linkedin', 'person linkedin url'],
  email: ['email', 'email address', 'emailaddress', 'person email'],
  location: ['location', 'city', 'country', 'person location'],
  name: ['name', 'full name', 'fullname', 'first name', 'person name'],
  company: ['company', 'company name', 'organization', 'companyname', 'company name for emails'],
};

function detectColumn(headers: string[], target: string): string | null {
  const candidates = COLUMN_MAPPINGS[target] || [];
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  for (const candidate of candidates) {
    const idx = lowerHeaders.indexOf(candidate);
    if (idx !== -1) return headers[idx];
  }
  return null;
}

function matchesCeoTitle(value: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return CEO_TITLES.some((title) => lower.includes(title.toLowerCase()));
}

export default function CeoFilterPage() {
  const [desk, setDesk] = useState<Desk>('Arthur');
  const [allRows, setAllRows] = useState<CsvRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string | null>>({});
  const [stats, setStats] = useState<FilterStats | null>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setProcessing(true);
    const allParsed: CsvRow[] = [];
    const names: string[] = [];
    let completed = 0;

    Array.from(files).forEach((file) => {
      names.push(file.name);
      Papa.parse<CsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          allParsed.push(...results.data);
          completed++;

          if (completed === files.length) {
            const hdrs = results.meta.fields || [];
            setHeaders(hdrs);
            setAllRows(allParsed);
            setFileNames(names);

            const map: Record<string, string | null> = {};
            for (const key of Object.keys(COLUMN_MAPPINGS)) {
              map[key] = detectColumn(hdrs, key);
            }
            setColumnMap(map);
            setProcessing(false);
          }
        },
      });
    });
  };

  const runFilter = async () => {
    setProcessing(true);

    const titleCol = columnMap.jobTitle;
    const headlineCol = columnMap.headline;
    const emailCol = columnMap.email;
    const linkedinCol = columnMap.linkedin_url;

    // Filter by CEO titles in title AND headline
    const matched = allRows.filter((row) => {
      const titleMatch = titleCol ? matchesCeoTitle(row[titleCol]) : false;
      const headlineMatch = headlineCol ? matchesCeoTitle(row[headlineCol]) : false;
      return titleMatch || headlineMatch;
    });

    // Deduplicate by email + LinkedIn URL
    const seen = new Set<string>();
    const deduped: CsvRow[] = [];
    let dupesCount = 0;

    matched.forEach((row) => {
      const email = emailCol ? (row[emailCol] || '').toLowerCase().trim() : '';
      const linkedin = linkedinCol ? (row[linkedinCol] || '').toLowerCase().trim() : '';
      const key = `${email}||${linkedin}`;

      if (key === '||') {
        deduped.push(row);
        return;
      }

      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(row);
      } else {
        dupesCount++;
      }
    });

    setFilteredRows(deduped);

    const filterStats: FilterStats = {
      total: allRows.length,
      matched: deduped.length,
      matchRate: allRows.length > 0 ? ((deduped.length / allRows.length) * 100).toFixed(1) : '0',
      dupesRemoved: dupesCount,
    };
    setStats(filterStats);

    // Save session to Supabase
    await supabase.from('filter_sessions').insert({
      desk,
      total: filterStats.total,
      matched: filterStats.matched,
      dupes: filterStats.dupesRemoved,
    });

    setProcessing(false);
  };

  const exportCsv = () => {
    if (!filteredRows.length) return;

    const csv = Papa.unparse(filteredRows);
    // Add UTF-8 BOM
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ceo_filtered_${desk}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="CEO Filter"
        description="Upload CSVs, filter for CEO/Founder profiles, deduplicate & export"
      />

      {/* Upload & Config */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border)] mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Upload CSV Files (Apollo + Prosp)
            </label>
            <input
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileUpload}
              className="w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--accent)] file:text-white hover:file:bg-[var(--accent-hover)] file:cursor-pointer"
            />
            {fileNames.length > 0 && (
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Loaded: {fileNames.join(', ')} — {allRows.length} rows total
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Desk
            </label>
            <select
              value={desk}
              onChange={(e) => setDesk(e.target.value as Desk)}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {DESKS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Column Mapping */}
      {headers.length > 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border)] mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">Column Mapping (auto-detected)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(columnMap).map(([key, val]) => (
              <div key={key}>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">{key}</label>
                <select
                  value={val || ''}
                  onChange={(e) =>
                    setColumnMap((prev) => ({ ...prev, [key]: e.target.value || null }))
                  }
                  className="w-full px-2 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="">Not mapped</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={runFilter}
              disabled={processing || allRows.length === 0}
              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {processing ? 'Filtering...' : 'Run CEO Filter'}
            </button>
            {filteredRows.length > 0 && (
              <button
                onClick={exportCsv}
                className="px-4 py-2 bg-[var(--success)] hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Export CSV ({filteredRows.length} rows)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Rows', value: stats.total, color: 'text-white' },
            { label: 'Matched CEOs', value: stats.matched, color: 'text-[var(--success)]' },
            { label: 'Match Rate', value: `${stats.matchRate}%`, color: 'text-[var(--accent)]' },
            { label: 'Dupes Removed', value: stats.dupesRemoved, color: 'text-[var(--warning)]' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
              <p className="text-xs text-[var(--text-secondary)]">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      {filteredRows.length > 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold text-white">
              Filtered Results Preview (first 50)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr className="bg-[var(--bg-tertiary)]">
                  {Object.entries(columnMap)
                    .filter(([, v]) => v)
                    .map(([key]) => (
                      <th key={key}>{key}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                    {Object.entries(columnMap)
                      .filter(([, v]) => v)
                      .map(([key, col]) => (
                        <td key={key} className="text-sm truncate max-w-xs">
                          {col ? row[col] || '—' : '—'}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
