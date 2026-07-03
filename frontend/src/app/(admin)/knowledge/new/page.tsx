'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com';

const DEPARTMENTS = ['Paid Media', 'SEO', 'Social Media', 'Content', 'Client Servicing', 'Strategy', 'General'];
const CATEGORIES  = ['SOP', 'Template', 'Framework', 'Playbook', 'Guideline', 'Checklist'];

export default function NewArticlePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'SOP',
    department: 'General',
    tags: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        department: form.department,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        created_by: user?.id
      };

      const res = await fetch(`${API}/api/knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.status === 'success') {
        router.push('/knowledge');
      } else {
        setError(data.message || 'Failed to create article');
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/knowledge" className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Article</h1>
          <p className="text-sm text-slate-500">Add to the organizational knowledge base</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g., Google Ads Campaign Setup SOP"
            className="w-full text-xl font-semibold text-slate-800 placeholder-slate-300 border-0 outline-none bg-transparent"
          />
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Categorize</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Department</label>
              <select
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-violet-300 bg-white text-slate-700"
              >
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-violet-300 bg-white text-slate-700"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Tags <span className="text-slate-400 font-normal">(comma separated)</span></label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="e.g., google ads, campaign setup, onboarding"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Content *</label>
            <span className="text-[10px] text-slate-400">{form.content.length} characters</span>
          </div>
          <textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Write the full article content here. Include step-by-step instructions, best practices, examples, and any relevant context…"
            rows={20}
            className="w-full text-sm text-slate-800 placeholder-slate-300 border-0 outline-none bg-transparent resize-none leading-relaxed"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pb-8">
          <Link
            href="/knowledge"
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 text-sm font-medium text-white px-6 py-3 rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Publish Article
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
