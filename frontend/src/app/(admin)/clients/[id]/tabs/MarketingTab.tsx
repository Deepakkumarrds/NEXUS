'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function MarketingTab({ client, clientId, fetchClientDetails }: any) {
  // Social Handles Form State
  const [socialPlatform, setSocialPlatform] = useState('Instagram');
  const [socialUrl, setSocialUrl] = useState('');
  const [socialUsername, setSocialUsername] = useState('');
  const [socialPassword, setSocialPassword] = useState('');
  const [socialAccess, setSocialAccess] = useState('Analyst');
  const [socialAccessToken, setSocialAccessToken] = useState('');
  const [socialPlatformAccountId, setSocialPlatformAccountId] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // SEO Access Form State
  const [seoPlatform, setSeoPlatform] = useState('Google Analytics');
  const [seoUrl, setSeoUrl] = useState('');
  const [seoUsername, setSeoUsername] = useState('');
  const [seoPassword, setSeoPassword] = useState('');
  const [seoAccess, setSeoAccess] = useState('Admin');

  // Paid Media Access Form State
  const [paidPlatform, setPaidPlatform] = useState('Google Ads');
  const [paidAccountId, setPaidAccountId] = useState('');
  const [paidUrl, setPaidUrl] = useState('');
  const [paidUsername, setPaidUsername] = useState('');
  const [paidPassword, setPaidPassword] = useState('');
  const [paidAccess, setPaidAccess] = useState('Advertiser');

  // Campaign Performance Form State
  const [campaignName, setCampaignName] = useState('');
  const [campImpressions, setCampImpressions] = useState('');
  const [campClicks, setCampClicks] = useState('');
  const [campConversions, setCampConversions] = useState('');
  const [campSpend, setCampSpend] = useState('');
  const [campStartDate, setCampStartDate] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddSocialHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialUrl.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/${clientId}/socials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: socialPlatform,
          profile_url: socialUrl,
          username: socialUsername,
          password: socialPassword,
          access_provided: socialAccess,
          access_token: socialAccessToken,
          platform_account_id: socialPlatformAccountId
        })
      });
      if (res.ok) {
        toast.success('Social handle added');
        setSocialUrl('');
        setSocialUsername('');
        setSocialPassword('');
        setSocialAccessToken('');
        setSocialPlatformAccountId('');
        fetchClientDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSocialHandle = async (handleId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/socials/${handleId}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchClientDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSeoAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seoUrl.trim() && !seoUsername.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/${clientId}/seo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: seoPlatform,
          profile_url: seoUrl,
          username: seoUsername,
          password: seoPassword,
          access_provided: seoAccess
        })
      });
      if (res.ok) {
        setSeoUrl(''); setSeoUsername(''); setSeoPassword('');
        fetchClientDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSeoAccess = async (accessId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/seo/${accessId}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchClientDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPaidMediaAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paidAccountId.trim() && !paidUsername.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/${clientId}/paid-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: paidPlatform,
          ad_account_id: paidAccountId,
          profile_url: paidUrl,
          username: paidUsername,
          password: paidPassword,
          access_provided: paidAccess
        })
      });
      if (res.ok) {
        setPaidAccountId(''); setPaidUrl(''); setPaidUsername(''); setPaidPassword('');
        fetchClientDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePaidMediaAccess = async (accessId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/paid-media/${accessId}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchClientDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || !campStartDate) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          campaign_name: campaignName,
          impressions: campImpressions,
          clicks: campClicks,
          leads_conversions: campConversions,
          spend_inr: campSpend,
          start_date: campStartDate
        })
      });
      if (res.ok) {
        setCampaignName(''); setCampImpressions(''); setCampClicks(''); setCampConversions(''); setCampSpend(''); setCampStartDate('');
        toast.success('Campaign metrics logged!');
        fetchClientDetails();
      } else {
        toast.error('Failed to log campaign metrics');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/campaigns/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchClientDetails();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">


      <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Social Media Vault</h2>
          <p className="text-xs text-slate-500 mt-1">Manage social media credentials, URLs, and access levels.</p>
        </div>

        <form onSubmit={handleAddSocialHandle} className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Platform</label>
            <select value={socialPlatform} onChange={e => setSocialPlatform(e.target.value)} className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white outline-none">
              <option value="Instagram">Instagram</option>
              <option value="Meta (Facebook)">Meta (Facebook)</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="YouTube">YouTube</option>
              <option value="Twitter">Twitter</option>
              <option value="Pinterest">Pinterest</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Profile URL</label>
            <input type="url" value={socialUrl} onChange={e => setSocialUrl(e.target.value)} placeholder="https://..." className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Username / Email</label>
            <input type="text" value={socialUsername} onChange={e => setSocialUsername(e.target.value)} placeholder="Username" className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
            <input type="text" value={socialPassword} onChange={e => setSocialPassword(e.target.value)} placeholder="Password" className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
          </div>
          <div className="md:col-span-1">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Access Level</label>
            <select value={socialAccess} onChange={e => setSocialAccess(e.target.value)} className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white outline-none">
              <option value="Admin">Admin</option>
              <option value="Advertiser">Advertiser</option>
              <option value="Analyst">Analyst</option>
              <option value="None">None</option>
            </select>
          </div>
          {socialPlatform === 'Instagram' && (
            <>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Access Token</label>
                <input type="text" value={socialAccessToken} onChange={e => setSocialAccessToken(e.target.value)} placeholder="IGAA..." className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">User ID</label>
                <input type="text" value={socialPlatformAccountId} onChange={e => setSocialPlatformAccountId(e.target.value)} placeholder="1784..." className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
              </div>
            </>
          )}
          <div className="md:col-span-6 flex justify-end mt-2">
            <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded hover:bg-indigo-700 transition-colors">
              Add Handle
            </button>
          </div>
        </form>

        {client.social_handles && client.social_handles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {client.social_handles.map((handle: any) => (
              <div key={handle.id} className="border border-slate-200 rounded-lg p-4 bg-white relative group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-indigo-100">
                      {handle.platform.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900 leading-none">{handle.platform}</p>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">{handle.access_provided} Access</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteSocialHandle(handle.id)} className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                </div>
                <div className="space-y-2 mt-3 text-xs bg-slate-50 p-2.5 rounded border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Username:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      {handle.username || '-'}
                      {handle.username && <button onClick={() => copyToClipboard(handle.username)} className="text-slate-400 hover:text-indigo-600">Copy</button>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Password:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      {handle.password ? (visiblePasswords[handle.id] ? handle.password : '••••••••') : '-'}
                      {handle.password && (
                        <>
                          <button onClick={() => togglePasswordVisibility(handle.id)} className="text-slate-400 hover:text-indigo-600 ml-1">👁️</button>
                          <button onClick={() => copyToClipboard(handle.password)} className="text-slate-400 hover:text-indigo-600">Copy</button>
                        </>
                      )}
                    </span>
                  </div>
                </div>
                {handle.profile_url && (
                  <div className="mt-3">
                    <a href={handle.profile_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center bg-indigo-50 py-1.5 rounded-md hover:bg-indigo-100 transition">Open Profile</a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-slate-300 rounded-lg bg-slate-50">
            <p className="text-sm text-slate-500 font-medium">No social media credentials saved yet.</p>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">SEO & Web Analytics Vault</h2>
          <p className="text-xs text-slate-500 mt-1">Manage access to Google Analytics, Search Console, Ahrefs, and other web tools.</p>
        </div>

        <form onSubmit={handleAddSeoAccess} className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Platform</label>
            <select value={seoPlatform} onChange={e => setSeoPlatform(e.target.value)} className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white outline-none">
              <option value="Google Analytics">Google Analytics</option>
              <option value="Google Search Console">Search Console</option>
              <option value="Ahrefs">Ahrefs</option>
              <option value="SEMrush">SEMrush</option>
              <option value="Shopify Admin">Shopify Admin</option>
              <option value="WordPress Admin">WordPress Admin</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Login URL</label>
            <input type="url" value={seoUrl} onChange={e => setSeoUrl(e.target.value)} placeholder="https://..." className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Username / Email</label>
            <input type="text" value={seoUsername} onChange={e => setSeoUsername(e.target.value)} placeholder="Username" className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
            <input type="text" value={seoPassword} onChange={e => setSeoPassword(e.target.value)} placeholder="Password" className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Access Role</label>
            <select value={seoAccess} onChange={e => setSeoAccess(e.target.value)} className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white outline-none">
              <option value="Admin">Admin</option>
              <option value="Editor">Editor</option>
              <option value="Viewer">Viewer</option>
              <option value="None">None</option>
            </select>
          </div>
          <div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-semibold text-xs px-4 py-1.5 rounded hover:bg-indigo-700 transition shadow-sm">Save</button>
          </div>
        </form>

        {client.seo_accesses && client.seo_accesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {client.seo_accesses.map((handle: any) => (
              <div key={handle.id} className="border border-slate-200 rounded-lg p-4 bg-white relative group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-sm border border-indigo-100">
                      SEO
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900 leading-none">{handle.platform}</p>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">{handle.access_provided} Access</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteSeoAccess(handle.id)} className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                </div>
                <div className="space-y-2 mt-3 text-xs bg-slate-50 p-2.5 rounded border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Username:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      {handle.username || '-'}
                      {handle.username && <button onClick={() => copyToClipboard(handle.username)} className="text-slate-400 hover:text-indigo-600">Copy</button>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Password:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      {handle.password ? (visiblePasswords[handle.id] ? handle.password : '••••••••') : '-'}
                      {handle.password && (
                        <>
                          <button onClick={() => togglePasswordVisibility(handle.id)} className="text-slate-400 hover:text-indigo-600 ml-1">👁️</button>
                          <button onClick={() => copyToClipboard(handle.password)} className="text-slate-400 hover:text-indigo-600">Copy</button>
                        </>
                      )}
                    </span>
                  </div>
                </div>
                {handle.profile_url && (
                  <div className="mt-3">
                    <a href={handle.profile_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center bg-indigo-50 py-1.5 rounded-md hover:bg-indigo-100 transition">Open Dashboard</a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-slate-300 rounded-lg bg-slate-50">
            <p className="text-sm text-slate-500 font-medium">No SEO credentials saved yet.</p>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Paid Media Vault</h2>
          <p className="text-xs text-slate-500 mt-1">Manage access to Ad accounts and billing profiles.</p>
        </div>

        <form onSubmit={handleAddPaidMediaAccess} className="grid grid-cols-1 md:grid-cols-7 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Platform</label>
            <select value={paidPlatform} onChange={e => setPaidPlatform(e.target.value)} className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white outline-none">
              <option value="Google Ads">Google Ads</option>
              <option value="Meta Ads Manager">Meta Ads</option>
              <option value="LinkedIn Ads">LinkedIn Ads</option>
              <option value="Amazon Ads">Amazon Ads</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ad Account ID</label>
            <input type="text" value={paidAccountId} onChange={e => setPaidAccountId(e.target.value)} placeholder="e.g. 123-456-7890" className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Login URL</label>
            <input type="url" value={paidUrl} onChange={e => setPaidUrl(e.target.value)} placeholder="https://..." className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Username / Email</label>
            <input type="text" value={paidUsername} onChange={e => setPaidUsername(e.target.value)} placeholder="Username" className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
            <input type="text" value={paidPassword} onChange={e => setPaidPassword(e.target.value)} placeholder="Password" className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Access Role</label>
            <select value={paidAccess} onChange={e => setPaidAccess(e.target.value)} className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white outline-none">
              <option value="Admin">Admin</option>
              <option value="Advertiser">Advertiser</option>
              <option value="Viewer">Viewer</option>
              <option value="None">None</option>
            </select>
          </div>
          <div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-semibold text-xs px-4 py-1.5 rounded hover:bg-indigo-700 transition shadow-sm">Save</button>
          </div>
        </form>
        {client.paid_media_accesses && client.paid_media_accesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {client.paid_media_accesses.map((handle: any) => (
              <div key={handle.id} className="border border-slate-200 rounded-lg p-4 bg-white relative group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-indigo-100">
                      PAID
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900 leading-none">{handle.platform}</p>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">{handle.access_provided} Access</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeletePaidMediaAccess(handle.id)} className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                </div>
                <div className="space-y-2 mt-3 text-xs bg-slate-50 p-2.5 rounded border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Account ID:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      {handle.ad_account_id || '-'}
                      {handle.ad_account_id && <button onClick={() => copyToClipboard(handle.ad_account_id)} className="text-slate-400 hover:text-indigo-600">Copy</button>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Username:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      {handle.username || '-'}
                      {handle.username && <button onClick={() => copyToClipboard(handle.username)} className="text-slate-400 hover:text-indigo-600">Copy</button>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Password:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      {handle.password ? (visiblePasswords[handle.id] ? handle.password : '••••••••') : '-'}
                      {handle.password && (
                        <>
                          <button onClick={() => togglePasswordVisibility(handle.id)} className="text-slate-400 hover:text-indigo-600 ml-1">👁️</button>
                          <button onClick={() => copyToClipboard(handle.password)} className="text-slate-400 hover:text-indigo-600">Copy</button>
                        </>
                      )}
                    </span>
                  </div>
                </div>
                {handle.profile_url && (
                  <div className="mt-3">
                    <a href={handle.profile_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center bg-indigo-50 py-1.5 rounded-md hover:bg-indigo-100 transition">Open Dashboard</a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-slate-300 rounded-lg bg-slate-50">
            <p className="text-sm text-slate-500 font-medium">No Paid Media credentials saved yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
