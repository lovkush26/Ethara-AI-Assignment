import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, taskAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignee: '', priority: 'Medium', dueDate: '', status: 'To Do' });
  const [submitting, setSubmitting] = useState(false);
  
  // New Features: Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const isAdmin = project?.admin?._id === user?._id;

  useEffect(() => {
    fetchData();

    // Listen for custom app-data-changed events
    window.addEventListener('app-data-changed', fetchData);
    
    // Listen for cross-tab events
    const bc = new BroadcastChannel('workpilot_events');
    bc.onmessage = (event) => {
      if (event.data === 'app-data-changed') fetchData();
    };

    return () => {
      window.removeEventListener('app-data-changed', fetchData);
      bc.close();
    };
  }, [id]);

  const fetchData = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        projectAPI.getOne(id),
        taskAPI.getByProject(id)
      ]);
      setProject(projRes.data);
      setTasks(taskRes.data);
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const openCreateTask = (defaultStatus = 'To Do') => {
    setEditTask(null);
    setTaskForm({ title: '', description: '', assignee: '', priority: 'Medium', dueDate: '', status: defaultStatus });
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignee: task.assignee?._id || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      status: task.status,
    });
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editTask) {
        await taskAPI.update(editTask._id, { ...taskForm, project: id });
        toast.success('Task updated');
      } else {
        await taskAPI.create({ ...taskForm, project: id });
        toast.success('Task created');
      }
      setShowTaskModal(false);
      await fetchData();
      window.dispatchEvent(new Event('app-data-changed'));
      new BroadcastChannel('workpilot_events').postMessage('app-data-changed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    try {
      await taskAPI.update(taskId, { status: newStatus });
      toast.success(`Moved to ${newStatus}`);
      window.dispatchEvent(new Event('app-data-changed'));
      new BroadcastChannel('workpilot_events').postMessage('app-data-changed');
    } catch (err) {
      fetchData();
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    
    // Optimistic UI update
    setTasks(prev => prev.filter(t => t._id !== taskId));
    
    try {
      await taskAPI.delete(taskId);
      toast.success('Task deleted');
      window.dispatchEvent(new Event('app-data-changed'));
      new BroadcastChannel('workpilot_events').postMessage('app-data-changed');
    } catch (err) {
      fetchData(); // Revert on failure
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await projectAPI.addMember(id, memberEmail);
      toast.success('Member added!');
      setMemberEmail('');
      await fetchData();
      window.dispatchEvent(new Event('app-data-changed'));
      new BroadcastChannel('workpilot_events').postMessage('app-data-changed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await projectAPI.removeMember(id, userId);
      toast.success('Member removed');
      await fetchData();
      window.dispatchEvent(new Event('app-data-changed'));
      new BroadcastChannel('workpilot_events').postMessage('app-data-changed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      const task = tasks.find(t => t._id === taskId);
      if (task && task.status !== status) {
        handleStatusChange(taskId, status);
      }
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;
  if (!project) return null;

  const statuses = ['To Do', 'In Progress', 'Done'];

  const isOverdue = (date) => date && new Date(date) < new Date();
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High':
      case 'Critical': return { bg: 'rgba(239,68,68,0.15)', color: 'var(--danger)' };
      case 'Medium': return { bg: 'rgba(99,102,241,0.15)', color: 'var(--accent)' };
      default: return { bg: 'rgba(148,163,184,0.15)', color: 'var(--text-secondary)' };
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '28px', fontWeight: 800 }}>{project.name}</h1>
            <p className="page-subtitle" style={{ fontSize: '14px' }}>{project.description || 'No description'}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" style={{ background: 'var(--bg-card)' }}>
              <span className="icon">≡</span> Filter
            </button>
            <button className="btn btn-secondary" style={{ background: 'var(--bg-card)' }}>
              <span className="icon">⇅</span> Sort
            </button>
            {isAdmin && <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}>👥 Members ({project.members?.length})</button>}
          </div>
        </div>
      </div>

      {/* Kanban Board matching screenshot */}
      <div className="kanban-board" style={{ gap: '24px' }}>
        {statuses.map(status => {
          const columnTasks = filteredTasks.filter(t => t.status === status);
          return (
            <div 
              className="kanban-column" 
              key={status}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
              style={{ background: 'var(--bg-hover, rgba(0,0,0,0.02))', border: 'none', borderRadius: '12px', padding: '20px' }}
            >
              <div className="kanban-column-header" style={{ borderBottom: 'none', marginBottom: '20px', padding: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{status}</span>
                  <span style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
                    {columnTasks.length}
                  </span>
                </div>
                <div style={{ fontWeight: 'bold', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px' }}>...</div>
              </div>
              
              <div className="kanban-tasks">
                {columnTasks.map(task => {
                  const prioStyle = getPriorityStyle(task.priority);
                  return (
                    <div 
                      className="task-card" 
                      key={task._id} 
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => openEditTask(task)}
                      style={{ 
                        border: status === 'Done' ? '1px solid var(--border)' : (status === 'In Progress' ? '1px solid var(--accent)' : '1px solid var(--border)'),
                        borderLeft: status === 'In Progress' ? '4px solid var(--accent)' : '1px solid var(--border)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        opacity: status === 'Done' ? 0.7 : 1
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ background: prioStyle.bg, color: prioStyle.color, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                          {task.priority}
                        </span>
                        {status === 'In Progress' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }}></div>}
                      </div>

                      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)', textDecoration: status === 'Done' ? 'line-through' : 'none' }}>
                        {task.title}
                      </div>
                      
                      <div className="task-card-meta" style={{ justifyContent: 'space-between' }}>
                        {task.assignee ? (
                          <div className="user-avatar" style={{ width: 24, height: 24, fontSize: 11, background: `linear-gradient(135deg, hsl(${task.assignee.name.length * 40}, 70%, 50%), hsl(${task.assignee.name.length * 60}, 70%, 40%))` }}>
                            {task.assignee.name?.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <div className="user-avatar" style={{ width: 24, height: 24, fontSize: 11, background: 'var(--bg-secondary)', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
                            ?
                          </div>
                        )}
                        
                        {task.dueDate && (
                          <span style={{ fontSize: '12px', color: isOverdue(task.dueDate) && status !== 'Done' ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: isOverdue(task.dueDate) && status !== 'Done' ? 600 : 500 }}>
                            {isOverdue(task.dueDate) && status !== 'Done' ? '⚠ Today' : `📅 ${new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                          </span>
                        )}
                      </div>
                      
                      <div className="task-actions" onClick={e => e.stopPropagation()}>
                        {isAdmin && (
                          <button className="btn btn-ghost btn-sm" style={{ padding: '4px', color: 'var(--danger)' }}
                            onClick={() => handleDeleteTask(task._id)} title="Delete Task">🗑</button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* New Task Button matching screenshot */}
                <button 
                  onClick={() => openCreateTask(status)}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    background: 'transparent', 
                    border: '1px dashed var(--border)', 
                    borderRadius: '8px', 
                    color: 'var(--text-muted)', 
                    fontSize: '13px', 
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-secondary)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  ＋ New Task
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals remain structurally the same, functionality identical */}
      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editTask ? 'Edit Task' : 'Create Task'}</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            <form onSubmit={handleTaskSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={taskForm.title} placeholder="Task title"
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required disabled={!isAdmin && editTask} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={taskForm.description} placeholder="Optional description"
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} disabled={!isAdmin && editTask} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} disabled={!isAdmin && editTask}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-input" value={taskForm.dueDate}
                    onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} disabled={!isAdmin && editTask} />
                </div>
              </div>
              {isAdmin && (
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select className="form-select" value={taskForm.assignee}
                    onChange={e => setTaskForm({ ...taskForm, assignee: e.target.value })}>
                    <option value="">Unassigned</option>
                    {project.members?.map(m => (
                      <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
                    ))}
                  </select>
                </div>
              )}
              {editTask && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={taskForm.status}
                    onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Team Members</h2>
              <button className="modal-close" onClick={() => setShowMemberModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input className="form-input" type="email" placeholder="Enter member's email"
                value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required />
              <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>Add</button>
            </form>
            <div className="member-list">
              {project.members?.map(member => (
                <div className="member-item" key={member._id}>
                  <div className="member-info">
                    <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 13, background: `linear-gradient(135deg, hsl(${member.name.length * 40}, 70%, 50%), hsl(${member.name.length * 60}, 70%, 40%))` }}>
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{member.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{member.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {member._id === project.admin?._id ? (
                      <span className="badge badge-admin">Admin</span>
                    ) : (
                      <>
                        <span className="badge badge-member">Member</span>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                          onClick={() => handleRemoveMember(member._id)}>✕</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
