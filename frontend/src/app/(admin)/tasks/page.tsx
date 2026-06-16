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
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const fetchTasks = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const url = myTasksOnly 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks?my_tasks=true&user_id=${user.id}`
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks`;
      
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks/bulk-status`, {
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
      case 'High': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter ? task.priority === priorityFilter : true;
    return matchesSearch && matchesPriority;
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
      await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + `/api/tasks/${draggableId}/status`, {
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
        <div className="flex items-center space-x-2 h-9">
          <input type="checkbox" id="myTasks" checked={myTasksOnly} onChange={e => setMyTasksOnly(e.target.checked)} className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" />
          <label htmlFor="myTasks" className="text-sm font-medium text-slate-700 cursor-pointer">My Tasks Only</label>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm bg-white rounded-lg border border-slate-200">Loading Kanban board...</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex overflow-x-auto gap-6 pb-4 items-start min-h-[600px]">
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
                                className={`relative bg-white p-4 rounded-lg mb-3 border ${snapshot.isDragging ? 'shadow-lg border-indigo-300 ring-1 ring-indigo-300 scale-105' : 'shadow-sm hover:border-slate-300'} ${isOverdue ? 'border-rose-400 bg-rose-50' : 'border-slate-200'} transition-all`}
                              >
                                {task.status !== 'Completed' && (
                                  <input type="checkbox" checked={selectedTasks.includes(task.id)} onChange={(e) => {
                                    if(e.target.checked) setSelectedTasks([...selectedTasks, task.id]);
                                    else setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                                  }} className="absolute top-4 right-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                                )}
                                <div className="flex justify-between items-start mb-2">
                                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${getPriorityBadge(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                  {task.due_date && (
                                    <span className={`text-[10px] font-medium mr-6 ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                                      {new Date(task.due_date).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                <Link href={`/tasks/${task.id}`} className="block font-semibold text-slate-800 text-sm mb-1 hover:text-indigo-600">
                                  {task.title}
                                </Link>
                                <p className="text-xs text-slate-500 mb-3 font-medium">
                                  {task.client?.company_name || 'Internal'}
                                </p>
                                
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                                  <div className="flex -space-x-2 overflow-hidden">
                                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700" title={task.assignee?.name || 'Unassigned'}>
                                      {(task.assignee?.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                  </div>
                                  {task.completion_percentage !== undefined && (
                                    <span className="text-xs font-bold text-slate-400">
                                      {task.completion_percentage}%
                                    </span>
                                  )}
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
