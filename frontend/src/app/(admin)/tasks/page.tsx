'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

type Task = {
  id: string;
  title: string;
  priority: string;
  status: string;
  due_date: string;
  completion_percentage: number;
  client?: { company_name: string };
  assignee?: { name: string };
  creator?: { name: string };
};

const COLUMNS = ['Pending', 'In Progress', 'Review', 'Completed'];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const fetchTasks = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const url = myTasksOnly 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com'}/api/tasks?my_tasks=true&user_id=${user.id}`
      : `${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com'}/api/tasks`;
      
    fetch(url)
      .then(res => res.json())
      .then(data => { 
        if (data && data.data) {
          setTasks(data.data); 
        }
        setLoading(false); 
      })
      .catch(error => {
        console.error('Error fetching tasks:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTasks();
  }, [myTasksOnly]);

  const handleBulkComplete = async () => {
    if(selectedTasks.length === 0) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com'}/api/tasks/bulk-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds: selectedTasks, status: 'Completed' })
      });
      if(res.ok) {
        setSelectedTasks([]);
        fetchTasks();
      }
    } catch(e) { console.error(e); }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'High':   return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low':    return 'bg-blue-50 text-blue-700 border-blue-200';
      default:       return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Returns the subtle bg based on priority / completed status (removed thick left borders)
  const getCardAccent = (priority: string, status: string) => {
    if (status === 'Completed') return 'bg-emerald-50/20';
    switch(priority) {
      case 'High':   return 'bg-rose-50/10';
      case 'Medium': return 'bg-amber-50/10';
      case 'Low':    return 'bg-blue-50/10';
      default:       return '';
    }
  };

  // Warning / check icon per priority
  const getPriorityIcon = (priority: string, status: string) => {
    if (status === 'Completed') return (
      <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
      </svg>
    );
    if (priority === 'High') return (
      <svg className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
    if (priority === 'Medium') return (
      <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
    if (priority === 'Low') return (
      <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
      </svg>
    );
    return null;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter ? task.priority === priorityFilter : true;
    const matchesDepartment = departmentFilter === 'All' ? true : (task as any).department === departmentFilter;
    return matchesSearch && matchesPriority && matchesDepartment;
  });

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;
    const task = tasks.find(t => t.id === draggableId);

    if (!task) return;

    const updatedTasks = tasks.map(t => {
      if (t.id === draggableId) {
        return { 
          ...t, 
          status: newStatus, 
          completion_percentage: newStatus === 'Completed' ? 100 : t.completion_percentage 
        };
      }
      return t;
    });
    setTasks(updatedTasks);

    try {
      await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com') + `/api/tasks/${draggableId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error('Failed to update task status', err);
      setTasks(tasks);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Task Kanban Board</h1>
          <p className="text-sm text-slate-500 mt-1">Drag and drop tasks to update their progress.</p>
        </div>
        <div className="flex space-x-3">
          {selectedTasks.length > 0 && (
            <button onClick={handleBulkComplete} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm">
              Mark {selectedTasks.length} Completed
            </button>
          )}
          <Link 
            href="/tasks/new" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Create Task
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Search Tasks</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              type="text"
              placeholder="Search task title..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Priority</label>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="text-sm border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none min-w-[150px]">
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="text-sm border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none min-w-[150px]">
            <option value="All">All Departments</option>
            <option value="Web Development">Web Development</option>
            <option value="SEO">SEO</option>
            <option value="Paid Media">Paid Media</option>
            <option value="Social Media">Social Media</option>
          </select>
        </div>
        <div className="flex items-center space-x-2 h-9">
          <input type="checkbox" id="myTasks" checked={myTasksOnly} onChange={e => setMyTasksOnly(e.target.checked)} className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" />
          <label htmlFor="myTasks" className="text-sm font-medium text-slate-700 cursor-pointer">My Tasks Only</label>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm bg-white rounded-lg border border-slate-200">Loading Kanban board...</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex overflow-x-auto gap-6 pb-4 items-start min-h-[600px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {COLUMNS.map((columnId) => (
              <div key={columnId} className="flex flex-col bg-slate-50 rounded-xl min-w-[300px] max-w-[300px] shrink-0 border border-slate-200 shadow-sm">
                <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-slate-100 rounded-t-xl">
                  <h2 className="font-bold text-slate-700 text-sm">{columnId}</h2>
                  <span className="bg-white text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">
                    {getTasksByStatus(columnId).length}
                  </span>
                </div>
                
                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-3 flex-1 overflow-y-auto min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''}`}
                    >
                      {getTasksByStatus(columnId).map((task, index) => {
                        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Completed';
                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`relative bg-white p-4 rounded-xl mb-3 border
                                  ${snapshot.isDragging ? 'shadow-xl border-indigo-300 ring-1 ring-indigo-300 scale-[1.02] z-50' : 'shadow-sm border-slate-200 hover:shadow-md hover:border-slate-300'}
                                  transition-all duration-200 group`}
                              >

                                {/* Priority badge row */}
                                <div className="flex justify-between items-center mb-3">
                                  <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase rounded-md border ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : getPriorityBadge(task.priority)}`}>
                                    {task.status === 'Completed' ? 'Done' : task.priority}
                                  </span>
                                  
                                  <div className="flex items-center gap-2">
                                    {task.due_date && (
                                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${isOverdue && task.status !== 'Completed' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'text-slate-400'}`}>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        {new Date(task.due_date).toLocaleDateString()}
                                      </span>
                                    )}
                                    {task.status !== 'Completed' && (
                                      <input type="checkbox" checked={selectedTasks.includes(task.id)} onChange={(e) => {
                                        if(e.target.checked) setSelectedTasks([...selectedTasks, task.id]);
                                        else setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                                      }} className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5" />
                                    )}
                                  </div>
                                </div>

                                <Link href={`/tasks/${task.id}`} className={`block font-bold text-sm mb-1.5 leading-snug group-hover:text-indigo-600 transition-colors ${task.status === 'Completed' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                  {task.title}
                                </Link>
                                <p className="text-xs text-slate-500 mb-4 font-medium flex items-center">
                                  <span className="truncate">{task.client?.company_name || 'Internal Task'}</span>
                                </p>

                                {/* Progress bar */}
                                {task.completion_percentage !== undefined && (
                                  <div className="mb-4">
                                    <div className="flex justify-between items-center mb-1.5">
                                      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Progress</span>
                                      <span className="text-[10px] font-bold text-slate-600">{task.completion_percentage}%</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          task.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-500'
                                        }`}
                                        style={{ width: `${task.completion_percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                                  {/* Department Tag */}
                                  {(task as any).department && (
                                    <div className="flex items-center gap-1.5">
                                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                        {(task as any).department}
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between items-center mt-1">
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600 shadow-sm" title={`Assignee: ${task.assignee?.name || 'Unassigned'}`}>
                                        {(task.assignee?.name || 'U').charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[10px] font-medium text-slate-400 leading-none mb-0.5">Assigned to</span>
                                        <span className="text-xs font-bold text-slate-700 leading-none">{task.assignee?.name || 'Unassigned'}</span>
                                      </div>
                                    </div>
                                    
                                    {task.creator && task.creator.name !== task.assignee?.name && (
                                      <div className="flex flex-col items-end text-right">
                                        <span className="text-[9px] font-medium text-slate-400 leading-none mb-0.5">Created by</span>
                                        <span className="text-[10px] font-bold text-slate-600 leading-none">{task.creator.name}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
