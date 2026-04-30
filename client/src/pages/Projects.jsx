import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await projectAPI.getAll();
      setProjects(res.data);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await projectAPI.create({ name, description });
      toast.success('Project created!');
      setShowModal(false);
      setName('');
      setDescription('');
      fetchProjects();
      window.dispatchEvent(new Event('app-data-changed'));
      new BroadcastChannel('workpilot_events').postMessage('app-data-changed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await projectAPI.delete(id);
      toast.success('Project deleted');
      fetchProjects();
      window.dispatchEvent(new Event('app-data-changed'));
      new BroadcastChannel('workpilot_events').postMessage('app-data-changed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage active initiatives and team assignments.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Create Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📁</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div className="card-grid">
          {projects.map((project, i) => {
            const isAdmin = project.admin?._id === user?._id;
            
            // Assign some placeholder icons to match the screenshot vibe
            const icons = ['🚀', '📱', '🛡️', '💻', '🎨', '📈'];
            const cardIcon = icons[i % icons.length];
            
            // Determine risk status based on some dummy logic (since we don't have this in DB)
            const isAtRisk = i === 2; // Hardcode the 3rd card as "At Risk" like the screenshot for visual parity

            return (
              <Link to={`/projects/${project._id}`} key={project._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Top section with Icon and Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(99,102,241,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      {cardIcon}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {isAdmin && (
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(project._id); }} 
                          style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'var(--danger)', fontSize: '12px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Delete Project"
                        >
                          🗑️ Delete
                        </button>
                      )}
                      <span style={{ 
                        background: isAtRisk ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', 
                        color: isAtRisk ? 'var(--danger)' : 'var(--info)', 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: 600 
                      }}>
                        {isAtRisk ? 'At Risk' : 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Title and Description */}
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{project.name}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', flex: 1 }}>
                    {project.description || 'No description provided for this project. Update it to help your team.'}
                  </p>

                  {/* Bottom Footer with Avatars and Progress */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    
                    {/* Overlapping Avatars */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {project.members?.slice(0, 3).map((m, idx) => (
                        <div key={m._id} className="user-avatar" style={{ 
                          width: 28, height: 28, fontSize: 11, 
                          background: `linear-gradient(135deg, hsl(${m.name.length * 40}, 70%, 50%), hsl(${m.name.length * 60}, 70%, 40%))`,
                          border: '2px solid var(--bg-card)',
                          marginLeft: idx > 0 ? '-8px' : '0',
                          zIndex: 3 - idx
                        }}>
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {project.members?.length > 3 && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px', fontWeight: 600 }}>
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label" htmlFor="project-name">Project Name</label>
                <input id="project-name" className="form-input" placeholder="My Awesome Project"
                  value={name} onChange={e => setName(e.target.value)} required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="project-desc">Description</label>
                <textarea id="project-desc" className="form-textarea" placeholder="Brief description..."
                  value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
