'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Client {
  id: string;
  company_name: string;
  brand_name?: string;
  email?: string;
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
    discussion_points: '',
    recipient_emails: ''
  });

  const [actionItems, setActionItems] = useState<ActionItem[]>([
    { action_item: '', assigned_to: '', deadline: '' }
  ]);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Fetch clients safely
    fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + '/api/clients?activeOnly=true')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data && data.data) setClients(data.data); })
      .catch(err => console.warn('Clients fetch warning:', err));

    // Fetch team users safely
    fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + '/api/users')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data && data.data) setUsers(data.data); })
      .catch(err => console.warn('Users fetch warning:', err));

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
            setSpeechNotice('Live speech connection timed out. You can paste notes or upload a file directly below.');
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    const selectedClient = clients.find(c => c.id === clientId);
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      recipient_emails: selectedClient?.email ? selectedClient.email : prev.recipient_emails
    }));
  };

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
      alert('Speech recognition is not supported in this browser. You can paste notes directly into the text area.');
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
      alert('Please speak or paste transcript text first.');
      return;
    }

    setIsExtracting(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + '/api/meetings/extract-mom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });

      if (!res.ok) {
        throw new Error(`Server status ${res.status}. Please check backend connection.`);
      }

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

  const handleSaveAndDispatch = async (sendMode: 'instant' | 'schedule_30min') => {
    if (!formData.client_id) {
      alert('Please select a Client.');
      return;
    }
    if (!formData.meeting_title.trim()) {
      alert('Please enter a Meeting Title.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        send_mode: sendMode,
        action_items: actionItems.filter(ai => ai.action_item.trim() !== '')
      };

      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + '/api/meetings/save-with-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (response.ok && json.status === 'success') {
        if (sendMode === 'instant') {
          alert(`Meeting MOM Saved & Dispatched Instantly.\nTasks Created: ${json.tasks_created || 0}`);
        } else {
          alert(`Meeting MOM Saved.\nScheduled to automatically send in 30 minutes.\nYou can review or edit it in the meetings dashboard before dispatch.`);
        }
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
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-6">
        <Link href="/meetings" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center transition-colors">
          Back to Meetings
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-4 tracking-tight">Log Meeting Minutes (MOM)</h1>
        <p className="text-sm text-slate-500 mt-1">Transcribe speech or paste meeting notes to extract MOM, assign tasks, and schedule dispatches.</p>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
        <div className="space-y-6 text-sm">
          
          {/* Transcript / Notes Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-medium text-slate-700">Meeting Notes / Speech Transcript</label>
              <div className="flex space-x-2">
                <label className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded cursor-pointer transition-colors">
                  Upload File
                  <input type="file" accept=".txt,.md" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    isRecording 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  {isRecording ? 'Stop Transcribe' : 'Voice Transcribe'}
                </button>
                <button
                  type="button"
                  onClick={handleExtractMom}
                  disabled={isExtracting || !transcript.trim()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
                >
                  {isExtracting ? 'Extracting...' : 'Extract MOM with AI'}
                </button>
              </div>
            </div>

            {speechNotice && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">{speechNotice}</p>
            )}

            <textarea
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Speech transcript will appear here in real-time as you speak, or paste meeting notes here..."
              className="w-full border border-slate-300 rounded-md p-2.5 text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Meeting Title *</label>
              <input 
                type="text" 
                name="meeting_title"
                required
                value={formData.meeting_title}
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900"
                placeholder="e.g. Q3 Strategic Planning"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Client *</label>
              <select 
                name="client_id"
                required
                value={formData.client_id}
                style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                onChange={handleClientSelect}
              >
                <option value="">Select a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.brand_name ? `${c.company_name} (${c.brand_name})` : c.company_name}</option>
                ))}
              </select>
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
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Attendees</label>
              <input 
                type="text" 
                name="attendees"
                value={formData.attendees}
                placeholder="e.g. John Doe, Jane Smith"
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900"
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Recipient Emails (Whom to Send)</label>
            <input 
              type="text" 
              name="recipient_emails"
              value={formData.recipient_emails}
              placeholder="e.g. client@brand.com, manager@rds.com"
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900"
              onChange={handleChange}
            />
            <p className="text-xs text-slate-500 mt-1">Pre-filled with client email. Separate multiple email addresses with commas.</p>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Agenda</label>
            <input 
              type="text"
              name="agenda"
              value={formData.agenda}
              placeholder="What was the purpose of the meeting?"
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Discussion Points *</label>
            <textarea 
              name="discussion_points"
              required
              rows={5}
              value={formData.discussion_points}
              placeholder="Detailed notes and points discussed..."
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900"
              onChange={handleChange}
            />
          </div>

          {/* Action Items */}
          <div className="pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900">Action Items</h3>
              <button 
                type="button" 
                onClick={addActionItem}
                className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md transition-colors"
              >
                + Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {actionItems.map((item, index) => (
                <div key={index} className="flex gap-3 items-start bg-slate-50 p-3 rounded-md border border-slate-200">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Describe the task..."
                      className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                      value={item.action_item}
                      onChange={(e) => handleActionItemChange(index, 'action_item', e.target.value)}
                    />
                  </div>
                  <div className="w-44">
                    <select
                      style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                      className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      value={item.assigned_to || ''}
                      onChange={(e) => handleActionItemChange(index, 'assigned_to', e.target.value)}
                    >
                      <option value="">Assign owner...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-36">
                    <input 
                      type="date" 
                      className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                      value={item.deadline || ''}
                      onChange={(e) => handleActionItemChange(index, 'deadline', e.target.value)}
                    />
                  </div>
                  {actionItems.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeActionItem(index)}
                      className="mt-2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <Link
            href="/meetings"
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </Link>

          <div className="flex space-x-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveAndDispatch('schedule_30min')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-md transition-colors border border-slate-300"
            >
              Save & Schedule Send (30 Mins)
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveAndDispatch('instant')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
            >
              Send Instantly Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
