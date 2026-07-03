'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Asset = {
  id: string;
  title: string;
  description: string;
  internal_status: string;
  client_status: string;
  due_date: string | null;
  created_at: string;
  client: { company_name: string };
  task?: { title: string };
  versions: { file_url: string; file_type: string; version_number: number; uploader: { name: string } }[];
};

type Client = {
  id: string;
  company_name: string;
};

export default function ApprovalsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchAssets();
    fetchClients();
  }, []);

  const fetchAssets = () => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com') + '/api/assets')
      .then(res => res.json())
      .then(data => {
        if (data && data.data) setAssets(data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch assets', err);
        setLoading(false);
      });
  };

  const fetchClients = () => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com') + '/api/clients?activeOnly=true')
      .then(res => res.json())
      .then(data => {
        if (data && data.data) setClients(data.data);
      })
      .catch(err => console.error('Failed to fetch clients', err));
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl || !clientId || !title) return;

    setIsUploading(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com') + '/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: fileUrl,
          title,
          description,
          client_id: clientId,
          uploaded_by: user.id || '60d5ecb8b39d1b0015a67812',
          due_date: dueDate || null
        }),
      });
      if (res.ok) {
        setShowUploadModal(false);
        setFileUrl('');
        setTitle('');
        setDescription('');
        setDueDate('');
        fetchAssets();
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  const getInternalBadge = (status: string) => {
    switch (status) {
      case 'Client Review': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200'; // Draft
    }
  };

  const getClientBadge = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200'; // Pending
    }
  };

  const isImage = (mimetype: string) => mimetype.startsWith('image/');

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Creative Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">Manage asset workflows, versions, and client feedback.</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-md flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          Upload New Asset
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
      ) : assets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No assets uploaded yet</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">Upload designs, documents, or deliverables to send them straight to the client portal for approval.</p>
          <button onClick={() => setShowUploadModal(true)} className="text-indigo-600 font-semibold hover:text-indigo-800">Upload First Asset &rarr;</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map(asset => {
            const latestVersion = asset.versions[0];
            return (
              <div 
                key={asset.id} 
                onClick={() => router.push(`/approvals/${asset.id}`)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col"
              >
                <div className="h-48 bg-slate-50 relative flex flex-col items-center justify-center border-b border-slate-200 p-4">
                  <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-2 shadow-xs">
                    {latestVersion?.file_type === 'Figma' ? (
                      <span className="font-bold text-indigo-600 text-xs">Figma</span>
                    ) : latestVersion?.file_type === 'Google Drive' ? (
                      <span className="font-bold text-emerald-600 text-xs">Drive</span>
                    ) : latestVersion?.file_type === 'Canva' ? (
                      <span className="font-bold text-violet-600 text-xs">Canva</span>
                    ) : (
                      <span className="font-bold text-slate-600 text-xs">Link</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-semibold truncate max-w-full text-center px-4 mb-2">{latestVersion?.file_url}</span>
                  
                  <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border shadow-xs ${getInternalBadge(asset.internal_status)}`}>
                      Int: {asset.internal_status}
                    </span>
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border shadow-xs ${getClientBadge(asset.client_status)}`}>
                      Ext: {asset.client_status}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-1 bg-slate-900/70 backdrop-blur text-white text-[10px] font-bold rounded shadow-xs">
                      V{latestVersion?.version_number || 1}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 truncate pr-2">{asset.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">{asset.description || 'No description provided.'}</p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-end">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">{asset.client?.company_name}</p>
                      <p className="text-[10px] text-slate-400">Due: {asset.due_date ? new Date(asset.due_date).toLocaleDateString() : 'No deadline'}</p>
                    </div>
                    <div className="text-indigo-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-900">Upload Creative Asset</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleFileUpload} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Select Client <span className="text-rose-500">*</span></label>
                  <select 
                    required 
                    value={clientId} 
                    onChange={e => setClientId(e.target.value)}
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  >
                    <option value="">-- Select Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Asset Title <span className="text-rose-500">*</span></label>
                  <input 
                    required 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                    placeholder="e.g. Q3 Social Media Campaign Images"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Description (Optional)</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                    rows={3}
                    placeholder="Internal context or client notes..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date (Optional)</label>
                  <input 
                    type="date" 
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)}
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Asset Link (Google Drive, Figma, Canva, etc.) <span className="text-rose-500">*</span></label>
                  <input 
                    required 
                    type="url" 
                    value={fileUrl}
                    onChange={e => setFileUrl(e.target.value)}
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                    placeholder="e.g. https://drive.google.com/file/..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isUploading || !fileUrl || !clientId || !title} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center">
                  {isUploading ? (
                    <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...</>
                  ) : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
