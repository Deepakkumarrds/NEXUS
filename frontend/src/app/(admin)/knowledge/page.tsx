'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com';

interface Article {
  id: string;
  title: string;
  category: string;
  department: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  author: { name: string };
}

const DEPARTMENTS = ['All', 'Paid Media', 'SEO', 'Social Media', 'Content', 'Client Servicing', 'Strategy', 'General'];
const CATEGORIES = ['All', 'SOP', 'Template', 'Framework', 'Playbook', 'Guideline', 'Checklist'];

const DEPT_COLORS: Record<string, string> = {
  'Paid Media':       'bg-blue-50 text-blue-700 border-blue-100',
  'SEO':              'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Social Media':     'bg-pink-50 text-pink-700 border-pink-100',
  'Content':          'bg-orange-50 text-orange-700 border-orange-100',
  'Client Servicing': 'bg-violet-50 text-violet-700 border-violet-100',
  'Strategy':         'bg-indigo-50 text-indigo-700 border-indigo-100',
  'General':          'bg-slate-50 text-slate-700 border-slate-100',
};

const CAT_COLORS: Record<string, string> = {
  'SOP':        'bg-amber-50 text-amber-700',
  'Template':   'bg-cyan-50 text-cyan-700',
  'Framework':  'bg-purple-50 text-purple-700',
  'Playbook':   'bg-rose-50 text-rose-700',
  'Guideline':  'bg-teal-50 text-teal-700',
  'Checklist':  'bg-lime-50 text-lime-700',
};

export default function KnowledgePage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('All');
  const [cat, setCat] = useState('All');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { fetchArticles(); }, [search, dept, cat]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (dept !== 'All') params.set('department', dept);
      if (cat !== 'All') params.set('category', cat);

      const res = await fetch(`${API}/api/knowledge?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setArticles(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    setDeleting(id);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/api/knowledge/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setArticles(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      alert('Failed to delete article');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
            <p className="text-sm text-slate-500">SOPs, templates, frameworks & playbooks</p>
          </div>
        </div>
        <Link
          href="/knowledge/new"
          className="flex items-center gap-2 text-sm font-medium text-white px-4 py-2 rounded-xl transition-all hover:opacity-90 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Article
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search articles…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </div>
          <select
            value={dept}
            onChange={e => setDept(e.target.value)}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-violet-300 bg-white text-slate-700"
          >
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select
            value={cat}
            onChange={e => setCat(e.target.value)}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-violet-300 bg-white text-slate-700"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Article Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {loading ? 'Loading…' : `${articles.length} article${articles.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="flex gap-2 mb-3">
                <div className="h-5 w-16 bg-slate-100 rounded-full"></div>
                <div className="h-5 w-20 bg-slate-100 rounded-full"></div>
              </div>
              <div className="h-5 bg-slate-100 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-slate-50 rounded w-full mb-1"></div>
              <div className="h-4 bg-slate-50 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)' }}>
            <svg className="w-7 h-7 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No articles yet</h3>
          <p className="text-sm text-slate-400 mb-5">Start building your organizational knowledge base</p>
          <Link
            href="/knowledge/new"
            className="inline-flex items-center gap-2 text-sm font-medium text-white px-5 py-2.5 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create First Article
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map(article => (
            <div key={article.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all hover:border-violet-100 group">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${DEPT_COLORS[article.department] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                  {article.department}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${CAT_COLORS[article.category] || 'bg-slate-50 text-slate-600'}`}>
                  {article.category}
                </span>
              </div>

              <Link href={`/knowledge/${article.id}`}>
                <h3 className="text-sm font-semibold text-slate-800 mb-2 group-hover:text-violet-700 transition-colors line-clamp-2">
                  {article.title}
                </h3>
              </Link>

              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {article.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-violet-600">{article.author?.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{article.author?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/knowledge/${article.id}/edit`}
                    className="text-[11px] text-slate-400 hover:text-violet-600 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(article.id)}
                    disabled={deleting === article.id}
                    className="text-[11px] text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {deleting === article.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
