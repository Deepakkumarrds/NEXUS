'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Annotation = {
  id: string;
  x_percent: number;
  y_percent: number;
  comment: string;
  created_by_name: string;
  created_at: string;
};

type Version = {
  id: string;
  version_number: number;
  file_url: string;
  file_type: string;
  created_at: string;
  uploader: { name: string };
  annotations: Annotation[];
};

type AssetDetail = {
  id: string;
  title: string;
  description: string;
  internal_status: string;
  client_status: string;
  created_at: string;
  client: { company_name: string };
  versions: Version[];
};

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  // Upload New Version State
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [newFileUrl, setNewFileUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchAssetDetails();
  }, [params.id]);

  const fetchAssetDetails = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://rds-db.onrender.com'}/api/assets/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setAsset(data.data);
          if (data.data.versions.length > 0) {
            setSelectedVersion(data.data.versions[0]);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch asset', err);
        setLoading(false);
      });
  };

  const handleStatusUpdate = async (status: string) => {
    if (!asset) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://rds-db.onrender.com'}/api/assets/${asset.id}/internal-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internal_status: status })
      });
      if (res.ok) {
        fetchAssetDetails();
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileUrl || !asset) return;
    setIsUploading(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://rds-db.onrender.com'}/api/assets/${asset.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: newFileUrl,
          uploaded_by: user.id || '60d5ecb8b39d1b0015a67812'
        })
      });
      if (res.ok) {
        setShowVersionModal(false);
        setNewFileUrl('');
        fetchAssetDetails();
      }
    } catch (err) {
      console.error('Failed to upload version', err);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;
  if (!asset) return <div className="text-center py-20 text-slate-500">Asset not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link href="/approvals" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center">
        &larr; Back to Approvals
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Asset Link Viewer */}
        <div className="md:w-2/3 bg-slate-50 flex flex-col border-r border-slate-200">
          <div className="flex-1 relative flex flex-col items-center justify-center p-8 min-h-[500px]">
            <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm space-y-5">
              <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto shadow-xs">
                {selectedVersion?.file_type === 'Figma' ? (
                  <span className="font-bold text-indigo-600 text-lg">Figma</span>
                ) : selectedVersion?.file_type === 'Google Drive' ? (
                  <span className="font-bold text-emerald-600 text-lg">Drive</span>
                ) : selectedVersion?.file_type === 'Canva' ? (
                  <span className="font-bold text-violet-600 text-lg">Canva</span>
                ) : (
                  <span className="font-bold text-slate-600 text-lg">Link</span>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-lg">External Review Required</h3>
                <p className="text-slate-500 text-xs leading-relaxed">This asset is hosted externally. Click the link below to review it on the platform (Figma, Canva, or Google Drive) directly.</p>
              </div>
              
              {selectedVersion && (
                <a 
                  href={selectedVersion.file_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex w-full items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md transition-colors"
                >
                  Open Link in New Tab &rarr;
                </a>
              )}
              <p className="text-[10px] text-slate-400">After reviewing, submit your feedback or approval in the sidebar on the right.</p>
            </div>
          </div>
            
          {/* Version Selector */}
          <div className="h-20 bg-white border-t border-slate-200 flex items-center px-4 overflow-x-auto gap-3">
            {asset.versions.map(v => (
              <button 
                key={v.id}
                onClick={() => setSelectedVersion(v)}
                className={`px-4 py-2 rounded-lg border-2 transition-colors shrink-0 font-bold text-sm ${selectedVersion?.id === v.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-300 text-slate-600'}`}
              >
                Version {v.version_number}
              </button>
            ))}
            <button 
              onClick={() => setShowVersionModal(true)}
              className="px-4 py-2 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-colors shrink-0 font-bold text-sm flex items-center"
            >
              + New Version
            </button>
          </div>
        </div>

        {/* Right Side: Details & Workflow */}
        <div className="md:w-1/3 flex flex-col bg-white">
          <div className="p-6 border-b border-slate-100 flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{asset.title}</h1>
              <p className="text-sm font-semibold text-indigo-600 mb-4">{asset.client.company_name}</p>
              <p className="text-sm text-slate-600">{asset.description || 'No description provided.'}</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Internal Status</p>
                <div className="flex gap-2">
                  <select 
                    value={asset.internal_status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Internal Review">Internal Review</option>
                    <option value="Client Review">Send to Client Portal</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                {asset.internal_status === 'Client Review' && (
                  <p className="text-[10px] text-emerald-600 mt-2 font-semibold flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    Client can see this asset
                  </p>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Client Status</p>
                <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${
                  asset.client_status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                  asset.client_status === 'Rejected' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                  'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  {asset.client_status}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 border-b pb-2">Feedback & Annotations</h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {selectedVersion?.annotations.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No annotations on this version yet.</p>
                ) : (
                  selectedVersion?.annotations.map((ann, idx) => (
                    <div key={ann.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-indigo-700 flex items-center">
                          <span className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] mr-2">!</span>
                          {ann.created_by_name}
                        </span>
                        <span className="text-[10px] text-slate-400">{new Date(ann.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-600 pl-6">{ann.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-900">Upload New Version</h2>
              <button onClick={() => setShowVersionModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleUploadVersion} className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-slate-600">This will add Version {asset.versions.length + 1} and reset the client status to Pending.</p>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Asset Link (Google Drive, Figma, Canva, etc.) <span className="text-rose-500">*</span></label>
                  <input 
                    required 
                    type="url" 
                    value={newFileUrl}
                    onChange={e => setNewFileUrl(e.target.value)}
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                    placeholder="e.g. https://figma.com/file/..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setShowVersionModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isUploading || !newFileUrl} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50">
                  {isUploading ? 'Saving...' : 'Add Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
