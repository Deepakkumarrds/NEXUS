'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Client {
  id: string;
  company_name: string;
  brand_name?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface ActionItem {
  action_item: string;
  assigned_to?: string;
  assigned_to_name?: string;
  deadline?: string;
}

export default function NewMeetingPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [speechNotice, setSpeechNotice] = useState('');

  const [formData, setFormData] = useState({
    client_id: '',
    meeting_title: '',
    meeting_date: new Date().toISOString().slice(0, 16),
    attendees: '',
    agenda: '',
    discussion_points: ''
  });

  const [actionItems, setActionItems] = useState<ActionItem[]>([
    { action_item: '', assigned_to: '', deadline: '' }
  ]);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Fetch clients
    fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + '/api/clients?activeOnly=true')
      .then(res => res.json())
      .then(data => { if (data && data.data) setClients(data.data); });

    // Fetch team users
    fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + '/api/users')
      .then(res => res.json())
      .then(data => { if (data && data.data) setUsers(data.data); });

    // Initialize Web Speech API if supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(prev => prev + ' ' + currentTranscript);
        };

        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            console.warn('Speech recognition status:', event.error);
          }
          setIsRecording(false);
          if (event.error === 'network') {
            setSpeechNotice('Live speech server connection timed out. You can paste notes or upload a file directly below!');
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setTranscript(prev => (prev ? prev + '\n' + content : content));
      }
    };
    reader.readAsText(file);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can paste notes directly into the transcript box!');
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Speech start error:', err);
        setIsRecording(false);
      }
    }
  };

  const handleExtractMom = async () => {
    if (!transcript.trim()) {
      alert('Please speak or paste transcript text first!');
      return;
    }

    setIsExtracting(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + '/api/meetings/extract-mom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });

      const json = await res.json();
      if (json.status === 'success' && json.data) {
        const extracted = json.data;

        setFormData(prev => ({
          ...prev,
          meeting_title: extracted.meeting_title || prev.meeting_title,
          agenda: extracted.agenda || prev.agenda,
          discussion_points: extracted.discussion_points || prev.discussion_points
        }));

        if (extracted.action_items && extracted.action_items.length > 0) {
          const mappedItems: ActionItem[] = extracted.action_items.map((item: any) => {
            let matchedUserId = '';
            if (item.assigned_to_name) {
              const foundUser = users.find(u => u.name.toLowerCase().includes(item.assigned_to_name.toLowerCase()));
              if (foundUser) matchedUserId = foundUser.id;
            }
            return {
              action_item: item.action_item || '',
              assigned_to: matchedUserId,
              deadline: item.deadline || ''
            };
          });
          setActionItems(mappedItems);
        }
      } else {
        alert(json.message || 'Failed to extract MOM');
      }
    } catch (err) {
      console.error('Error extracting MOM:', err);
      alert('Failed to connect to backend server for AI extraction.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleActionItemChange = (index: number, field: string, value: string) => {
    const newItems = [...actionItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setActionItems(newItems);
  };

  const addActionItem = () => {
    setActionItems([...actionItems, { action_item: '', assigned_to: '', deadline: '' }]);
  };

  const removeActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) {
      alert('Please select a Client!');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        action_items: actionItems.filter(ai => ai.action_item.trim() !== '')
      };

      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + '/api/meetings/save-with-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (response.ok && json.status === 'success') {
        alert(`Meeting MOM Saved Successfully! Auto-created ${json.tasks_created || 0} tasks in Task Manager & sent Cliq notification.`);
        window.location.href = '/meetings';
      } else {
        alert(json.message || 'Failed to save meeting.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend server.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6">
        <Link href="/meetings" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Meetings
        </Link>
        <div className="flex justify-between items-center mt-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Speech-to-MOM & Task Generator</h1>
            <p className="text-sm text-slate-500 mt-1">Live transcribe voice or paste raw notes to auto-generate structured MOM & tasks in 1-click.</p>
          </div>
        </div>
      </div>

      {/* STEP 1: Live Voice Recording & Notes Box */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-xl shadow-md mb-8">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2">
            <span className="flex h-3 w-3 relative">
              {isRecording && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isRecording ? 'bg-red-500' : 'bg-emerald-400'}`}></span>
            </span>
            <h2 className="font-semibold text-lg">Step 1: Live Voice / Transcript Input</h2>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={toggleRecording}
              className={`px-4 py-2 text-xs font-semibold rounded-lg shadow transition-all flex items-center ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              {isRecording ? '🛑 Stop Recording' : '🎙️ Start Live Voice Transcribe'}
            </button>

            <button
              type="button"
              onClick={handleExtractMom}
              disabled={isExtracting || !transcript.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 text-xs font-semibold rounded-lg shadow transition-all flex items-center"
            >
              {isExtracting ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-1.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Extracting MOM with AI...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1.5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  ✨ AI Extract MOM & Tasks
                </>
              )}
            </button>
          </div>
        </div>

        <textarea
          rows={4}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Speech transcript will appear here in real-time as you speak, or you can paste rough meeting notes here..."
          className="w-full bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all font-mono"
        />
      </div>

      {/* STEP 2: Interactive Review & Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <h2 className="font-semibold text-lg text-slate-900">Step 2: Review & Save Structured MOM</h2>
          <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2.5 py-1 rounded-full">Interactive Form</span>
        </div>

        <div className="space-y-6 text-sm">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Client / Brand Name *</label>
              <select 
                name="client_id"
                required
                value={formData.client_id}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white text-slate-900"
                onChange={handleChange}
              >
                <option value="">Select client brand...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.brand_name ? `${c.company_name} (${c.brand_name})` : c.company_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Meeting Title *</label>
              <input 
                type="text" 
                name="meeting_title"
                required
                value={formData.meeting_title}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900 font-medium"
                placeholder="e.g. Gauraanga Global Weekly Strategy Review"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Date & Time *</label>
              <input 
                type="datetime-local" 
                name="meeting_date"
                required
                value={formData.meeting_date}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Attendees</label>
              <input 
                type="text" 
                name="attendees"
                value={formData.attendees}
                placeholder="e.g. Utkarsh, Gowtham, Deepak"
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900"
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Agenda / Goal</label>
            <input 
              type="text"
              name="agenda"
              value={formData.agenda}
              placeholder="What was the purpose of the meeting?"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Key Discussion Points & Decisions *</label>
            <textarea 
              name="discussion_points"
              required
              rows={5}
              value={formData.discussion_points}
              placeholder="Bullet-point summary of key discussions and decisions..."
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900 whitespace-pre-wrap leading-relaxed"
              onChange={handleChange}
            />
          </div>

          {/* Action Items Section */}
          <div className="pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-slate-900">Assigned Action Items</h3>
                <p className="text-xs text-slate-500">Each action item will automatically be created as a tracked Task in the Task Manager!</p>
              </div>
              <button 
                type="button" 
                onClick={addActionItem}
                className="text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2 rounded-lg transition-colors border border-indigo-200 flex items-center"
              >
                + Add Action Item
              </button>
            </div>
            
            <div className="space-y-3">
              {actionItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="col-span-6">
                    <input 
                      type="text" 
                      placeholder="Action item task title..."
                      className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                      value={item.action_item}
                      onChange={(e) => handleActionItemChange(index, 'action_item', e.target.value)}
                    />
                  </div>

                  <div className="col-span-3">
                    <select
                      className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-slate-900"
                      value={item.assigned_to || ''}
                      onChange={(e) => handleActionItemChange(index, 'assigned_to', e.target.value)}
                    >
                      <option value="">Assign owner...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <input 
                      type="date" 
                      className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                      value={item.deadline || ''}
                      onChange={(e) => handleActionItemChange(index, 'deadline', e.target.value)}
                    />
                  </div>

                  <div className="col-span-1 text-center">
                    {actionItems.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeActionItem(index)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end space-x-4">
          <Link
            href="/meetings"
            className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow transition-colors flex items-center"
          >
            {isSaving ? 'Saving & Creating Tasks...' : '💾 Save MOM & Create Tasks'}
          </button>
        </div>
      </form>
    </div>
  );
}
