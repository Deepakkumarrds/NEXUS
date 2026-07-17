'use client';

import { useState } from 'react';

interface TabAICalendarProps {
  client: any;
}

export default function TabAICalendar({ client }: TabAICalendarProps) {
  const [platforms, setPlatforms] = useState('Instagram, LinkedIn, Facebook');
  const [campaignTheme, setCampaignTheme] = useState('General Brand Awareness');
  const [promotions, setPromotions] = useState('None');
  const [topics, setTopics] = useState('Industry tips, Team culture, Client success stories');
  const [targetAudience, setTargetAudience] = useState('General Audience');
  const [toneOfVoice, setToneOfVoice] = useState('Professional and Engaging');
  const [brandUSP, setBrandUSP] = useState('');
  const [creativeGuidelines, setCreativeGuidelines] = useState('Include engaging hooks, trending formats, and strong calls to action.');
  const [postCount, setPostCount] = useState(15);

  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCalendarData([]);

    try {
      const res = await fetch('http://localhost:5000/api/ai/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          platforms,
          campaignTheme,
          promotions,
          topics,
          targetAudience,
          toneOfVoice,
          brandUSP,
          creativeGuidelines,
          postCount
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate calendar');
      }

      setCalendarData(data.data.calendar || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!client) return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] space-y-8">
      
      {/* Header section */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center">
          <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          AI Calendar Generator
        </h2>
        <p className="text-sm text-slate-500 mt-1">Generate a 30-day social media calendar using Groq AI. It will use {client.company_name}'s profile data automatically.</p>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleGenerate} className="bg-slate-50 p-5 rounded-xl border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">Configuration Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Target Platforms</label>
            <input type="text" value={platforms} onChange={e => setPlatforms(e.target.value)} className="w-full text-sm border border-slate-300 rounded-md p-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Number of Posts</label>
            <input type="number" min="1" max="30" value={postCount} onChange={e => setPostCount(Number(e.target.value))} className="w-full text-sm border border-slate-300 rounded-md p-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" required />
          </div>
        </div>

        <div className="space-y-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Campaign Theme / Focus</label>
              <input type="text" value={campaignTheme} onChange={e => setCampaignTheme(e.target.value)} className="w-full text-sm border border-slate-300 rounded-md p-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Key Promotional Offers</label>
              <input type="text" value={promotions} onChange={e => setPromotions(e.target.value)} className="w-full text-sm border border-slate-300 rounded-md p-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Audience</label>
              <input type="text" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} className="w-full text-sm border border-slate-300 rounded-md p-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Gen Z, Tech founders, Local homeowners" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tone of Voice</label>
              <input type="text" value={toneOfVoice} onChange={e => setToneOfVoice(e.target.value)} className="w-full text-sm border border-slate-300 rounded-md p-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Humorous, Professional, Inspirational" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Brand Unique Selling Proposition (USP)</label>
            <input type="text" value={brandUSP} onChange={e => setBrandUSP(e.target.value)} className="w-full text-sm border border-slate-300 rounded-md p-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="What makes this brand stand out?" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Specific Topics to Include</label>
            <input type="text" value={topics} onChange={e => setTopics(e.target.value)} className="w-full text-sm border border-slate-300 rounded-md p-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Creative Guidelines & Formats</label>
            <textarea value={creativeGuidelines} onChange={e => setCreativeGuidelines(e.target.value)} rows={2} className="w-full text-sm border border-slate-300 rounded-md p-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Prefer reels and carousels, use trending audio ideas..." />
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-indigo-600 text-white font-medium text-sm px-6 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Generating AI Calendar...
              </>
            ) : (
              'Generate Calendar'
            )}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results Grid */}
      {calendarData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">Generated Calendar ({calendarData.length} posts)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {calendarData.map((post: any, index: number) => (
              <div key={index} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md">Day {post.date_offset}</span>
                    <span className="text-xs font-semibold text-slate-700">{post.platform}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{post.content_type}</span>
                </div>
                
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Visual Idea</h4>
                    <p className="text-sm text-slate-700 italic bg-slate-50 p-2 rounded border border-slate-100">{post.visual_idea}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Caption</h4>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{post.caption}</p>
                  </div>
                  
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.hashtags.map((tag: string, i: number) => (
                        <span key={i} className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
