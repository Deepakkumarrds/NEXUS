'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function TaskDetailsPage() {
  const params = useParams();
  const taskId = params.id as string;
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');

  const fetchTaskDetails = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks/${taskId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setTask(data.data);
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

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment }),
      });
      if (res.ok) {
        setNewComment('');
        fetchTaskDetails(); // Refresh comments
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-slate-500">Loading task details...</div>;
  if (!task) return <div className="text-rose-500">Task not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <Link href="/tasks" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Tasks
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Task Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`px-2 py-1 text-xs font-medium rounded border mb-3 inline-block ${task.status === 'Done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
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
                <span className={`font-medium ${new Date(task.due_date) < new Date() && task.status !== 'Done' ? 'text-rose-600' : 'text-slate-800'}`}>
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date set'}
                </span>
              </div>

              <div>
                <span className="block text-slate-500 text-xs uppercase tracking-wide">Created</span>
                <span className="text-slate-700">{new Date(task.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
