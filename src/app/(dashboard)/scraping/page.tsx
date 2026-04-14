'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Post, Desk, DESKS } from '@/lib/types';
import PageHeader from '@/components/PageHeader';


export default function ScrapingPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [desk, setDesk] = useState<Desk>('Arthur');
  const [loading, setLoading] = useState(false);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const addPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);

    await supabase.from('posts').insert({
      url: url.trim(),
      note: note.trim() || null,
      desk,
      status: 'pending',
      profile_count: 0,
    });

    setUrl('');
    setNote('');
    await fetchPosts();
    setLoading(false);
  };

  const updateStatus = async (id: string, status: Post['status']) => {
    await supabase.from('posts').update({ status }).eq('id', id);
    await fetchPosts();
  };

  const updateProfileCount = async (id: string, count: number) => {
    await supabase.from('posts').update({ profile_count: count }).eq('id', id);
    await fetchPosts();
  };

  const deletePost = async (id: string) => {
    await supabase.from('posts').delete().eq('id', id);
    await fetchPosts();
  };

  return (
    <div>
      <PageHeader
        title="Scraping Tracker"
        description="Track LinkedIn post scraping and raw profiles"
      />

      {/* Add Post Form */}
      <form onSubmit={addPost} className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border)] mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              LinkedIn Post URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.linkedin.com/posts/..."
              required
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note..."
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Desk
            </label>
            <div className="flex gap-2">
              <select
                value={desk}
                onChange={(e) => setDesk(e.target.value as Desk)}
                className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {DESKS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Posts Table */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden">
        <table>
          <thead>
            <tr className="bg-[var(--bg-tertiary)]">
              <th>URL</th>
              <th>Note</th>
              <th>Desk</th>
              <th>Status</th>
              <th>Profiles</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                <td className="max-w-xs">
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:text-[var(--accent-hover)] text-sm truncate block"
                  >
                    {post.url.length > 50 ? post.url.slice(0, 50) + '...' : post.url}
                  </a>
                </td>
                <td className="text-sm text-[var(--text-secondary)]">{post.note || '—'}</td>
                <td className="text-sm">{post.desk}</td>
                <td>
                  <select
                    value={post.status}
                    onChange={(e) => updateStatus(post.id, e.target.value as Post['status'])}
                    className="bg-transparent text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="pending">pending</option>
                    <option value="scraping">scraping</option>
                    <option value="done">done</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={post.profile_count}
                    onChange={(e) => updateProfileCount(post.id, parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </td>
                <td className="text-sm text-[var(--text-secondary)]">
                  {new Date(post.created_at).toLocaleDateString()}
                </td>
                <td>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-[var(--danger)] hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-[var(--text-secondary)]">
                  No posts yet. Add a LinkedIn URL above to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
