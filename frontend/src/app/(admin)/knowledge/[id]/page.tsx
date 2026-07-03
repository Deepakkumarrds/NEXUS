'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://rds-db.onrender.com';

const DEPT_COLORS: Record<string, string> = {
  'Paid Media':       'bg-blue-50 text-blue-700 border-blue-100',
  'SEO':              'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Social Media':     'bg-pink-50 text-pink-700 border-pink-100',
  'Content':          'bg-orange-50 text-orange-700 border-orange-100',
  'Client Servicing': 'bg-violet-50 text-violet-700 border-violet-100',
  'Strategy':         'bg-indigo-50 text-indigo-700 border-indigo-100',
  'General':          'bg-slate-50 text-slate-600 border-slate-100',
};

export default function ArticleViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/api/knowledge/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === 'success') setArticle(data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/api/knowledge/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      router.push('/knowledge');
    } catch (e) {
      alert('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-8 bg-slate-100 rounded w-1/4 mb-8"></div>
        <div className="bg-white rounded-2xl border border-slate-100 p-8">
          <div className="h-8 bg-slate-100 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => <div key={i} className="h-4 bg-slate-50 rounded"></div>)}
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-slate-500">Article not found.</p>
        <Link href="/knowledge" className="text-violet-600 hover:underline text-sm mt-2 inline-block">← Back to Knowledge Base</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/knowledge" className="text-slate-500 hover:text-violet-700 transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Knowledge Base
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-medium truncate">{article.title}</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Article Header */}
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full border ${DEPT_COLORS[article.department] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
              {article.department}
            </span>
            <span className="text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-violet-50 text-violet-700">
              {article.category}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-4">{article.title}</h1>

          {article.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {article.tags.map((tag: string) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                <span className="text-[10px] font-bold text-violet-600">
                  {article.author?.name?.[0]?.toUpperCase()}
                </span>
              </div>
              <span>{article.author?.name}</span>
              <span>·</span>
              <span>{new Date(article.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/knowledge/${article.id}/edit`}
                className="text-sm font-medium text-slate-500 hover:text-violet-700 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="p-8">
          <div className="prose prose-slate max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
              {article.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
