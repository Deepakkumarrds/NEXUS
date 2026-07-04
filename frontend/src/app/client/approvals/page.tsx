'use client';

import { useEffect, useState, useRef } from 'react';
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
  annotations: Annotation[];
};

type Asset = {
  id: string;
  title: string;
  description: string;
  client_status: string;
  versions: Version[];
};

export default function ClientApprovalsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [activeVersion, setActiveVersion] = useState<Version | null>(null);
  
  // Annotation State
  const imageRef = useRef<HTMLImageElement>(null);
  const [newAnnotation, setNewAnnotation] = useState<{ x: number, y: number } | null>(null);
  const [annotationText, setAnnotationText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      fetchAssets(user.client_id || user.id);
    }
  }, []);

  const fetchAssets = (clientId: string) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/assets/client/${clientId}`)
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

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setNewAnnotation({ x, y });
    setAnnotationText('');
  };

  const handleSaveAnnotation = async () => {
    if (!activeVersion || !newAnnotation || !annotationText.trim()) return;
    setIsSubmitting(true);
    
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : { name: 'Client' };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/assets/versions/${activeVersion.id}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x_percent: newAnnotation.x,
          y_percent: newAnnotation.y,
          comment: annotationText,
          client_user_id: user.id,
          created_by_name: user.name
        })
      });
      if (res.ok) {
        const addedAnn = await res.json();
        setActiveVersion({
          ...activeVersion,
          annotations: [...(activeVersion.annotations || []), addedAnn.data]
        });
        setNewAnnotation(null);
        setAnnotationText('');
      }
    } catch (err) {
      console.error('Failed to save annotation', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!selectedAsset) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/assets/${selectedAsset.id}/client-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_status: status })
      });
      if (res.ok) {
        setAssets(assets.map(a => a.id === selectedAsset.id ? { ...a, client_status: status } : a));
        setSelectedAsset(null);
        setActiveVersion(null);
      }
    } catch (err) {
      console.error('Failed to update asset status', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const isImage = (mimetype: string) => mimetype?.startsWith('image/');

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Creative Approvals</h1>
        <p className="text-slate-500 mt-1">Review and approve designs. Click anywhere on an image to leave a pin!</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
      ) : assets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">You're all caught up!</h3>
          <p className="text-slate-500 max-w-md mx-auto">There are no new creative assets pending your review right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map(asset => {
            const latestVersion = asset.versions[0];
            return (
            <div key={asset.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="h-56 bg-slate-100 relative flex items-center justify-center border-b border-slate-200 group">
                {latestVersion && isImage(latestVersion.file_type) ? (
                  <img src={(process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + latestVersion.file_url} alt={asset.title} className="object-cover w-full h-full" />
                ) : (
                  <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                )}
                
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <button 
                    onClick={() => {
                      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/assets/${asset.id}`)
                        .then(res => res.json())
                        .then(data => {
                          setSelectedAsset(data.data);
                          setActiveVersion(data.data.versions[0]);
                        });
                    }}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg hover:scale-105 transition-transform"
                  >
                    Open Review Modal
                  </button>
                </div>
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-slate-900/80 text-white text-[10px] font-bold rounded shadow-sm">
                    V{latestVersion?.version_number || 1}
                  </span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-slate-900 text-lg leading-tight pr-2">{asset.title}</h3>
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border shrink-0 ${getStatusBadge(asset.client_status)}`}>
                    {asset.client_status}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{asset.description || 'No additional details provided.'}</p>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Interactive Review Modal */}
      {selectedAsset && activeVersion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Left: Image Canvas */}
            <div className="md:w-2/3 bg-slate-100 border-r border-slate-200 relative flex flex-col">
              <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">{selectedAsset.title} - Version {activeVersion.version_number}</h3>
                {selectedAsset.versions.length > 1 && (
                  <select 
                    value={activeVersion.id}
                    onChange={(e) => {
                      const v = selectedAsset.versions.find(ver => ver.id === e.target.value);
                      if (v) setActiveVersion(v);
                    }}
                    className="text-sm border border-slate-300 rounded-md px-2 py-1"
                  >
                    {selectedAsset.versions.map(v => (
                      <option key={v.id} value={v.id}>Version {v.version_number}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex-1 relative overflow-auto p-4 flex items-center justify-center min-h-[500px]">
                {isImage(activeVersion.file_type) ? (
                  <div className="relative inline-block shadow-md cursor-crosshair">
                    <img 
                      ref={imageRef}
                      src={(process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + activeVersion.file_url} 
                      alt="Asset" 
                      onClick={handleImageClick}
                      className="max-h-[600px] object-contain block"
                    />
                    
                    {/* Existing Annotations */}
                    {activeVersion.annotations?.map((ann, idx) => (
                      <div 
                        key={ann.id}
                        className="absolute w-6 h-6 -ml-3 -mt-3 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white group hover:z-10"
                        style={{ left: `${ann.x_percent}%`, top: `${ann.y_percent}%` }}
                      >
                        {idx + 1}
                        <div className="absolute hidden group-hover:block bg-slate-900 text-white p-3 rounded-lg text-xs w-48 z-20 bottom-full mb-2 -left-20 shadow-xl">
                          <p className="font-semibold text-indigo-300">{ann.created_by_name}</p>
                          <p className="mt-1">{ann.comment}</p>
                        </div>
                      </div>
                    ))}

                    {/* New Annotation Form */}
                    {newAnnotation && (
                      <div 
                        className="absolute w-6 h-6 -ml-3 -mt-3 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white z-20"
                        style={{ left: `${newAnnotation.x}%`, top: `${newAnnotation.y}%` }}
                      >
                        +
                        <div className="absolute bg-white text-slate-900 p-3 rounded-xl shadow-2xl w-64 top-full mt-3 -left-28 border border-slate-200" onClick={e => e.stopPropagation()}>
                          <textarea
                            autoFocus
                            value={annotationText}
                            onChange={e => setAnnotationText(e.target.value)}
                            placeholder="Add your comment here..."
                            className="w-full text-sm p-2 border border-slate-300 rounded-md outline-none focus:border-indigo-500 resize-none"
                            rows={3}
                          />
                          <div className="flex gap-2 mt-2">
                            <button onClick={handleSaveAnnotation} disabled={isSubmitting || !annotationText.trim()} className="flex-1 bg-indigo-600 text-white py-1.5 rounded-md text-xs font-bold hover:bg-indigo-700 disabled:opacity-50">Save</button>
                            <button onClick={() => setNewAnnotation(null)} className="flex-1 bg-slate-100 text-slate-600 py-1.5 rounded-md text-xs font-bold hover:bg-slate-200">Cancel</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-slate-500">
                    <p>This file type does not support visual annotations.</p>
                    <a href={(process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + activeVersion.file_url} target="_blank" className="text-indigo-600 underline mt-2 inline-block">Download File</a>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Feedback & Approval Panel */}
            <div className="md:w-1/3 bg-white flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h2 className="font-bold text-slate-900">Feedback Panel</h2>
                <button onClick={() => { setSelectedAsset(null); setActiveVersion(null); setNewAnnotation(null); }} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">All Comments</h3>
                {activeVersion.annotations?.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-8">Click on the image to leave a comment.</p>
                ) : (
                  <div className="space-y-4">
                    {activeVersion.annotations?.map((ann, idx) => (
                      <div key={ann.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-indigo-700 flex items-center text-sm">
                            <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] mr-2 shrink-0">{idx + 1}</span>
                            {ann.created_by_name}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 pl-7">{ann.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
                <button 
                  disabled={isSubmitting}
                  onClick={() => handleStatusUpdate('Rejected')}
                  className="flex-1 bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  Request Revisions
                </button>
                <button 
                  disabled={isSubmitting}
                  onClick={() => handleStatusUpdate('Approved')}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30 shadow-lg text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  Approve Asset
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
