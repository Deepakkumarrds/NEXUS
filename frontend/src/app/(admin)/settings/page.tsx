'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [day, setDay] = useState(5);
  const [time, setTime] = useState('17:00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerSuccess, setTriggerSuccess] = useState('');
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [includeCampaigns, setIncludeCampaigns] = useState(true);
  const [includeTasks, setIncludeTasks] = useState(true);
  const [includeComms, setIncludeComms] = useState(true);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deliveryLogs, setDeliveryLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/settings`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setDay(data.data.weekly_report_day || 5);
          setTime(data.data.weekly_report_time || '17:00');
          if (data.data.include_campaigns !== undefined) setIncludeCampaigns(data.data.include_campaigns);
          if (data.data.include_tasks !== undefined) setIncludeTasks(data.data.include_tasks);
          if (data.data.include_communications !== undefined) setIncludeComms(data.data.include_communications);
        }
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clients`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const activeClients = data.data.filter((c: any) => c.client_status === 'Active');
          setClients(activeClients);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setSelectedClients(activeClients.map((c: any) => String(c.id)));
        }
      })
      .catch(e => console.error('Failed to fetch clients', e));

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/settings/delivery-logs`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) setDeliveryLogs(data.data);
      })
      .catch(e => console.error('Failed to fetch delivery logs', e));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          weekly_report_day: day,
          weekly_report_time: time,
          include_campaigns: includeCampaigns,
          include_tasks: includeTasks,
          include_communications: includeComms
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTrigger = async () => {
    if (!confirm('Are you sure you want to generate and send weekly reports to all active clients right now?')) return;
    
    setTriggering(true);
    setTriggerSuccess('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/settings/trigger-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientIds: selectedClients })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setTriggerSuccess(data.message || 'Reports sent successfully!');
        setTimeout(() => setTriggerSuccess(''), 5000);
      } else {
        alert(data.message || 'Failed to trigger reports');
      }
    } catch (error) {
      console.error('Failed to trigger reports:', error);
      alert('An error occurred while triggering reports.');
    } finally {
      setTriggering(false);
    }
  };

  const handlePreview = async (clientId: string) => {
    setPreviewLoading(true);
    setPreviewHtml(null); // open modal with loading state
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/settings/preview-report/${clientId}`);
      if (res.ok) {
        const html = await res.text();
        setPreviewHtml(html);
      } else {
        setPreviewHtml('<h1>Error loading preview</h1>');
      }
    } catch (error) {
      setPreviewHtml('<h1>Error loading preview</h1>');
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleClient = (clientId: string) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    } else {
      setSelectedClients([...selectedClients, clientId]);
    }
  };

  const days = [
    { id: 0, name: 'Sunday' },
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' }
  ];

  if (loading) return <div className="p-8 text-slate-500">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Automations</h1>
        <p className="text-slate-500 mt-1">Manage application-wide configurations and automation schedules.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Automated Weekly Reports</h2>
          <p className="text-sm text-slate-500">Configure when the system should automatically generate and email the weekly activity summary to your clients.</p>
        </div>
        
        <form onSubmit={handleSave} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Send Day</label>
              <select 
                value={day}
                onChange={(e) => setDay(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
              >
                {days.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Send Time (24h)</label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                required
              />
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Content Toggles</h3>
            <div className="flex gap-6 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeCampaigns}
                  onChange={(e) => setIncludeCampaigns(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-slate-700">Include Campaigns</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeTasks}
                  onChange={(e) => setIncludeTasks(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-slate-700">Include Tasks</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeComms}
                  onChange={(e) => setIncludeComms(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-slate-700">Include Communications</span>
              </label>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Manual Sending</h3>
            <p className="text-sm text-slate-500 mb-4">Select which clients should receive the report when triggering manually.</p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-lg max-h-60 overflow-y-auto p-2 mb-6">
              {clients.length === 0 ? (
                <p className="text-sm text-slate-500 p-4 text-center">No active clients found.</p>
              ) : (
                clients.map(client => (
                  <div key={client.id} className="flex items-center justify-between p-3 hover:bg-slate-100 rounded-md transition-colors">
                    <label className="flex items-center cursor-pointer flex-1">
                      <input 
                        type="checkbox" 
                        checked={selectedClients.includes(client.id)}
                        onChange={() => toggleClient(client.id)}
                        className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-3 text-sm font-medium text-slate-700">{client.company_name}</span>
                      <span className="ml-2 text-xs text-slate-400">({client.email || 'No email'})</span>
                    </label>
                    <button 
                      type="button" 
                      onClick={() => handlePreview(client.id)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                    >
                      Preview HTML
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-end border-t border-slate-100 pt-5 mt-2">
            {success && <span className="text-emerald-600 text-sm font-medium mr-4 flex items-center"><svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Settings saved!</span>}
            <button 
              type="submit" 
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed mr-3"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
            <button 
              type="button" 
              onClick={handleTrigger}
              disabled={triggering || selectedClients.length === 0}
              className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 focus:ring-4 focus:ring-slate-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {triggering ? 'Sending...' : `Send Reports to ${selectedClients.length} Clients Now`}
            </button>
          </div>
          {triggerSuccess && (
            <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm flex items-center border border-emerald-100">
              <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {triggerSuccess}
            </div>
          )}
        </form>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Delivery Logs</h2>
            <p className="text-sm text-slate-500">Recent automated and manual email deliveries.</p>
          </div>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                <th className="p-4">Date & Time</th>
                <th className="p-4">Client</th>
                <th className="p-4">Status</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {deliveryLogs.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-slate-500 text-sm">No delivery logs found.</td></tr>
              ) : (
                deliveryLogs.map(log => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm text-slate-700">{new Date(log.sent_at).toLocaleString()}</td>
                    <td className="p-4 text-sm font-medium text-slate-900">{log.client?.company_name || 'Unknown'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${log.status === 'Success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500 max-w-xs truncate" title={log.error_message || ''}>
                      {log.error_message || 'Delivered'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {(previewHtml !== null || previewLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: '80vh' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Email Preview</h3>
              <button 
                onClick={() => { setPreviewHtml(null); setPreviewLoading(false); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="flex-1 bg-slate-100 overflow-hidden relative">
              {previewLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <iframe 
                  srcDoc={previewHtml || ''} 
                  className="w-full h-full bg-white border-0"
                  title="Email Preview"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
