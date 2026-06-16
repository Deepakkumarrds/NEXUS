'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');

  // Delay Log Form State
  const [delayReason, setDelayReason] = useState('Client_Delay');
  const [delayNotes, setDelayNotes] = useState('');
  const [isSubmittingDelay, setIsSubmittingDelay] = useState(false);

  // New states for Checklist & Resources
  const [checklist, setChecklist] = useState<any[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [resourceLinks, setResourceLinks] = useState<any[]>([]);
  const [newResourceLink, setNewResourceLink] = useState('');
  const [newResourceTitle, setNewResourceTitle] = useState('');

  const fetchTaskDetails = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks/${taskId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setTask(data.data);
          try {
            setChecklist(typeof data.data.checklist === 'string' ? JSON.parse(data.data.checklist) : (data.data.checklist || []));
          } catch(e) { setChecklist([]); }
          try {
            setResourceLinks(typeof data.data.resource_links === 'string' ? JSON.parse(data.data.resource_links) : (data.data.resource_links || []));
          } catch(e) { setResourceLinks([]); }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const updateTaskData = async (updates: any) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) fetchTaskDetails();
    } catch(e) {
      console.error(e);
    }
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newChecklistItem.trim()) return;
    const newList = [...checklist, { id: Date.now(), text: newChecklistItem, done: false }];
    setChecklist(newList);
    setNewChecklistItem('');
    updateTaskData({ checklist: JSON.stringify(newList) });
  };

  const toggleChecklist = (id: number) => {
    const newList = checklist.map(item => item.id === id ? { ...item, done: !item.done } : item);
    setChecklist(newList);
    updateTaskData({ checklist: JSON.stringify(newList) });
  };

  const removeChecklist = (id: number) => {
    const newList = checklist.filter(item => item.id !== id);
    setChecklist(newList);
    updateTaskData({ checklist: JSON.stringify(newList) });
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newResourceLink.trim()) return;
    const newList = [...resourceLinks, { id: Date.now(), title: newResourceTitle || 'Link', url: newResourceLink }];
    setResourceLinks(newList);
    setNewResourceLink('');
    setNewResourceTitle('');
    updateTaskData({ resource_links: JSON.stringify(newList) });
  };

  const removeResource = (id: number) => {
    const newList = resourceLinks.filter(item => item.id !== id);
    setResourceLinks(newList);
    updateTaskData({ resource_links: JSON.stringify(newList) });
  };

  const cloneTask = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks/${taskId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id || '' })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Task cloned successfully');
        router.push(`/tasks/${data.data.id}`);
      } else {
        toast.error('Failed to clone task');
      }
    } catch (err) {
      toast.error('Error cloning task');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment, user_id: user.id }),
      });
      if (res.ok) {
        setNewComment('');
        fetchTaskDetails(); // Refresh comments
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogDelay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDelay(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delay_reason: delayReason,
          delay_notes: delayNotes,
          original_due_date: task.due_date 
        })
      });
      if (res.ok) {
        toast.success('Delay details logged successfully!');
        setDelayNotes('');
        fetchTaskDetails();
      } else {
        toast.error('Failed to log delay details');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error');
    } finally {
      setIsSubmittingDelay(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading task details...</div>;
  if (!task) return <div className="p-8 text-center text-rose-500">Task not found.</div>;

  const isPastDue = task.due_date && new Date(task.due_date) < new Date();
  const isDelayed = isPastDue && task.status !== 'Completed';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6 flex justify-between items-center">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-sm font-medium text-slate-500 space-x-2">
          <Link href="/" className="hover:text-indigo-600 transition-colors flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/tasks" className="hover:text-indigo-600 transition-colors">
            Tasks
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-semibold truncate max-w-[250px]">{task.title}</span>
        </nav>
        <button onClick={cloneTask} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded text-sm font-semibold shadow-sm transition-colors flex items-center">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          Duplicate Task
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Task Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`px-2 py-1 text-xs font-semibold rounded border mb-3 inline-block ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {task.status}
                </span>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{task.title}</h1>
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border uppercase tracking-wide ${task.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                {task.priority} Priority
              </span>
            </div>
            
            <p className="text-slate-700 whitespace-pre-wrap text-sm mt-4">{task.description}</p>
          </div>

          {/* Checklist & Resources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Checklist */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">Sub-task Checklist</h3>
              <form onSubmit={handleAddChecklist} className="flex space-x-2 mb-3">
                <input type="text" placeholder="Add sub-task..." value={newChecklistItem} onChange={e=>setNewChecklistItem(e.target.value)} className="flex-1 border border-slate-300 rounded p-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                <button type="submit" className="bg-indigo-600 text-white px-3 text-xs rounded hover:bg-indigo-700">+</button>
              </form>
              <ul className="space-y-2">
                {checklist.map(item => (
                  <li key={item.id} className="flex items-center justify-between group">
                    <label className="flex items-center space-x-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={item.done} onChange={() => toggleChecklist(item.id)} className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                      <span className={item.done ? 'line-through text-slate-400' : 'text-slate-700'}>{item.text}</span>
                    </label>
                    <button onClick={() => removeChecklist(item.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </li>
                ))}
                {checklist.length === 0 && <p className="text-xs text-slate-400 italic">No checklist items.</p>}
              </ul>
            </div>

            {/* Resource Links */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">Resource Links</h3>
              <form onSubmit={handleAddResource} className="flex flex-col space-y-2 mb-3">
                <div className="flex space-x-2">
                  <input type="text" placeholder="Title (e.g. Google Drive)" value={newResourceTitle} onChange={e=>setNewResourceTitle(e.target.value)} className="w-1/3 border border-slate-300 rounded p-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                  <input type="url" placeholder="URL Link..." value={newResourceLink} onChange={e=>setNewResourceLink(e.target.value)} required className="flex-1 border border-slate-300 rounded p-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                  <button type="submit" className="bg-indigo-600 text-white px-3 text-xs rounded hover:bg-indigo-700">+</button>
                </div>
              </form>
              <ul className="space-y-2">
                {resourceLinks.map(item => (
                  <li key={item.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded text-sm group">
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline truncate max-w-[150px]" title={item.url}>
                      {item.title}
                    </a>
                    <button onClick={() => removeResource(item.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </li>
                ))}
                {resourceLinks.length === 0 && <p className="text-xs text-slate-400 italic">No external resource links.</p>}
              </ul>
            </div>
          </div>

          {/* Delayed Task Logger Card */}
          {isDelayed && (
            <div className="bg-amber-50/50 p-6 rounded-lg border border-amber-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-amber-800 text-sm flex items-center">
                  ⚠️ Task Past Due Date (Delay Logging)
                </h3>
                <p className="text-xs text-amber-700 mt-1">Please log the operational reason for this delay to update the account managers.</p>
              </div>

              {task.delay_reason ? (
                <div className="p-3 bg-white border border-amber-200 rounded text-xs space-y-1">
                  <p className="text-slate-700"><span className="font-bold text-amber-800">Reason:</span> {task.delay_reason.replace('_', ' ')}</p>
                  {task.delay_notes && <p className="text-slate-700"><span className="font-bold text-amber-800">Notes:</span> {task.delay_notes}</p>}
                  {task.original_due_date && <p className="text-slate-500 text-[10px]">Original Deadline: {new Date(task.original_due_date).toLocaleDateString()}</p>}
                </div>
              ) : (
                <form onSubmit={handleLogDelay} className="space-y-3 text-xs font-semibold text-slate-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-amber-800">Delay Category</label>
                      <select value={delayReason} onChange={e => setDelayReason(e.target.value)} className="w-full border border-slate-300 rounded p-2 bg-white outline-none">
                        <option value="Client_Delay">Waiting on Client Assets / Copy Approval</option>
                        <option value="Scope_Creep">Scope Creep / Extra Deliverable Request</option>
                        <option value="Internal_Delay">Internal Re-work / Technical Issue</option>
                        <option value="Other">Other Operational Issue</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-amber-800">Delay Reason Notes</label>
                      <input required type="text" placeholder="Explain details of blocker..." value={delayNotes} onChange={e => setDelayNotes(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none bg-white" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmittingDelay} className="bg-amber-600 text-white font-bold px-4 py-2 rounded hover:bg-amber-700 transition-colors disabled:opacity-50">Log Delay Reason</button>
                </form>
              )}
            </div>
          )}

          {/* Comments Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Discussion & Activity</h3>
            
            <form onSubmit={handlePostComment} className="mb-6">
              <textarea 
                rows={3} 
                className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="Write a comment or update..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="mt-2 flex justify-end">
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 transition">
                  Post Comment
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((comment: any) => (
                  <div key={comment.id} className="flex space-x-3 p-3 bg-slate-50 rounded border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 text-xs font-bold">
                      {comment.user?.name ? comment.user.name.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-slate-900 text-sm">{comment.user?.name || 'User'}</span>
                        <span className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-700 mt-1">{comment.comment}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 italic">No comments yet. Start the discussion.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Details</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <span className="block text-slate-500 text-xs uppercase tracking-wide">Client</span>
                <span className="font-medium text-slate-800">{task.client?.company_name || 'Internal'}</span>
              </div>
              
              <div>
                <span className="block text-slate-500 text-xs uppercase tracking-wide">Assignee</span>
                <span className="font-medium text-slate-800">{task.assignee?.name || 'Unassigned'}</span>
              </div>
              
              <div>
                <span className="block text-slate-500 text-xs uppercase tracking-wide">Due Date</span>
                <span className={`font-medium ${isPastDue && task.status !== 'Completed' ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date set'}
                </span>
              </div>

              {/* Recurrence Details */}
              {task.is_recurring && (
                <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded text-xs space-y-1">
                  <p className="font-bold text-indigo-700">🗓️ Social Calendar Recurrence</p>
                  <p className="text-slate-600">Pattern: <span className="font-semibold">{task.recurrence_pattern}</span></p>
                  {task.recurrence_end && (
                    <p className="text-slate-600">Ends: <span className="font-semibold">{new Date(task.recurrence_end).toLocaleDateString()}</span></p>
                  )}
                </div>
              )}

              {/* Delay Logs details in sidebar */}
              {task.delay_reason && (
                <div className="bg-rose-50 border border-rose-100 p-2.5 rounded text-xs space-y-1">
                  <p className="font-bold text-rose-700">⚠️ Delay Log Detail</p>
                  <p className="text-slate-600">Reason: <span className="font-semibold">{task.delay_reason.replace('_', ' ')}</span></p>
                  {task.delay_notes && <p className="text-slate-600">Notes: {task.delay_notes}</p>}
                </div>
              )}

              <div>
                <span className="block text-slate-500 text-xs uppercase tracking-wide">Created</span>
                <span className="text-slate-700">{new Date(task.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          {/* Task Activity Feed */}
          {task.activities && task.activities.length > 0 && (
            <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Activity Feed</h3>
              <ul className="space-y-3 relative border-l border-slate-200 ml-2">
                {task.activities.map((act: any) => (
                  <li key={act.id} className="pl-4 relative">
                    <div className="absolute w-2 h-2 bg-indigo-500 rounded-full -left-[4.5px] top-1.5 ring-4 ring-white"></div>
                    <p className="text-xs text-slate-600">{act.activity_type}</p>
                    <p className="text-[10px] text-slate-400">{new Date(act.created_at).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
