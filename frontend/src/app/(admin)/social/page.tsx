"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { Camera, Image as ImageIcon, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function SocialPosterPage() {
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [postId, setPostId] = useState('');

  // Multi-account state
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [instagramAccounts, setInstagramAccounts] = useState<any[]>([]);
  const [selectedSocialHandleId, setSelectedSocialHandleId] = useState('');

  // Fetch clients on load
  React.useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clients`);
        if (res.data.status === 'success') {
          setClients(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch clients:', err);
      }
    };
    fetchClients();
  }, []);

  // Fetch Instagram accounts when a client is selected
  React.useEffect(() => {
    if (!selectedClientId) {
      setInstagramAccounts([]);
      setSelectedSocialHandleId('');
      return;
    }

    const fetchAccounts = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clients/${selectedClientId}/socials`);
        if (res.data.status === 'success') {
          const igAccounts = res.data.data.filter((handle: any) => handle.platform === 'Instagram' && handle.access_token);
          setInstagramAccounts(igAccounts);
          if (igAccounts.length > 0) {
            setSelectedSocialHandleId(igAccounts[0].id);
          } else {
            setSelectedSocialHandleId('');
          }
        }
      } catch (err) {
        console.error('Failed to fetch social handles:', err);
      }
    };
    fetchAccounts();
  }, [selectedClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl && !selectedFile) {
      setStatus('error');
      setMessage('Please provide an Image URL or upload a file.');
      return;
    }

    if (!selectedSocialHandleId) {
      setStatus('error');
      setMessage('Please select a connected Instagram account.');
      return;
    }

    setStatus('loading');
    setMessage('');
    setPostId('');

    try {
      let finalImageUrl = imageUrl;

      // 1. If a file is selected, upload it first to get a public URL
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadResponse = await axios.post('http://localhost:5000/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (uploadResponse.data && uploadResponse.data.url) {
          finalImageUrl = uploadResponse.data.url;
        } else {
          throw new Error('File upload failed to return a public URL.');
        }
      }

      // 2. Post to Instagram
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/social/instagram/post`, {
        imageUrl: finalImageUrl,
        caption,
        socialHandleId: selectedSocialHandleId
      });

      if (response.data.status === 'success') {
        setStatus('success');
        setMessage('Post successfully published to Instagram!');
        setPostId(response.data.postId);
        setImageUrl('');
        setSelectedFile(null);
        setCaption('');
      } else {
        throw new Error(response.data.message || 'Failed to post.');
      }
    } catch (error: any) {
      console.error('Posting error:', error);
      setStatus('error');
      setMessage(error.response?.data?.message || error.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Camera className="w-6 h-6 text-pink-500" />
          Instagram Publisher
        </h1>
        <p className="text-gray-500 mt-1">Easily post images directly to your Instagram account.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Account Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
            <div>
              <label className="block text-sm font-medium text-indigo-900 mb-1">
                Select Client
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              >
                <option value="">-- Choose a Client --</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-indigo-900 mb-1">
                Select Instagram Account
              </label>
              <select
                value={selectedSocialHandleId}
                onChange={(e) => setSelectedSocialHandleId(e.target.value)}
                disabled={!selectedClientId || instagramAccounts.length === 0}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 disabled:bg-gray-100 disabled:text-gray-400"
              >
                {instagramAccounts.length === 0 ? (
                  <option value="">No connected IG accounts</option>
                ) : (
                  instagramAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      @{acc.username || 'Unknown'} ({acc.platform_account_id || 'Me'})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Image Upload Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Upload Image OR Provide URL *
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                    setImageUrl(''); // Clear URL if file is selected
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-gray-300 rounded-md p-2"
              />
            </div>
            
            <div className="relative mt-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ImageIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setSelectedFile(null); // Clear file if URL is typed
                }}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                placeholder="Or paste public Image URL..."
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">If you upload a file, it will be uploaded to the cloud automatically so Instagram can access it.</p>
          </div>

          {/* Caption Input */}
          <div className="space-y-2">
            <label htmlFor="caption" className="block text-sm font-medium text-gray-700">
              Caption
            </label>
            <textarea
              id="caption"
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              placeholder="Write a catchy caption for your post..."
            />
          </div>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="rounded-md bg-green-50 p-4 border border-green-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">{message}</h3>
                  {postId && (
                    <div className="mt-2 text-sm text-green-700">
                      <p>Post ID: <span className="font-mono">{postId}</span></p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Posting Failed</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Publishing to Instagram...
                </>
              ) : (
                <>
                  <Send className="-ml-1 mr-2 h-5 w-5" />
                  Publish Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Image Preview */}
      {(imageUrl || selectedFile) && !imageUrl.includes('localhost') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Image Preview</h2>
          <div className="relative rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center min-h-[200px]">
             <img 
               src={selectedFile ? URL.createObjectURL(selectedFile) : imageUrl} 
               alt="Instagram preview" 
               className="max-w-full max-h-[400px] object-contain"
               onError={(e) => {
                 (e.target as HTMLImageElement).style.display = 'none';
               }}
             />
          </div>
        </div>
      )}
    </div>
  );
}
