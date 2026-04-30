import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI } from '../services/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    window.addEventListener('app-data-changed', fetchStats);
    
    const bc = new BroadcastChannel('workpilot_events');
    bc.onmessage = (event) => {
      if (event.data === 'app-data-changed') fetchStats();
    };

    return () => {
      window.removeEventListener('app-data-changed', fetchStats);
      bc.close();
    };
  }, []);

  const fetchStats = async () => {
    try {
      const res = await taskAPI.getDashboardStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  const totalTasks = stats?.totalTasks || 0;
  const statusData = [
    { label: 'To Do', count: stats?.tasksByStatus?.['To Do'] || 0, color: '#94a3b8', bg: 'rgba(148,163,184,0.2)' },
    { label: 'In Progress', count: stats?.tasksByStatus?.['In Progress'] || 0, color: '#6366f1', bg: 'rgba(99,102,241,0.2)' },
    { label: 'Done', count: stats?.tasksByStatus?.['Done'] || 0, color: '#10b981', bg: 'rgba(16,185,129,0.2)' }
  ];

  const userData = stats?.tasksPerUser ? Object.entries(stats.tasksPerUser).map(([name, data]) => ({
    name,
    total: data.total,
    done: data.done
  })).sort((a, b) => b.total - a.total).slice(0, 4) : [];
  
  const maxUserTasks = Math.max(1, ...userData.map(u => u.total));

  // Find some overdue tasks from recent tasks if available, or just placeholder text if we only have the count
  const overdueCount = stats?.overdueTasks || 0;

  return (
    <div className="fade-in dashboard-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '32px', marginBottom: '8px' }}>Dashboard Overview</h1>
          <p className="page-subtitle">Real-time metrics and task distribution across the team.</p>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📅 Last updated: Just now
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Total Tasks Card */}
        <div className="card glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', padding: '8px', borderRadius: '8px' }}>📋</div>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Total Tasks</h3>
            </div>
            <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{totalTasks}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '12px' }}>
              Across {stats?.totalProjects || 0} active projects
            </p>
          </div>
          <div style={{ marginTop: '32px' }}>
            <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
              ↗ +12% from last week
            </span>
          </div>
        </div>

        {/* Tasks by Status Card */}
        <div className="card glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Tasks by Status</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {statusData.map(status => (
              <div key={status.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{status.label}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{status.count} tasks</span>
                </div>
                <div style={{ background: 'var(--bg-secondary)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ background: status.color, height: '100%', width: `${totalTasks > 0 ? (status.count / totalTasks) * 100 : 0}%`, borderRadius: '5px', transition: 'width 1s ease-out' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Workload Distribution */}
        <div className="card glass-card">
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Workload Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {userData.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No user data available.</div>
            ) : (
              userData.map((user, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="user-avatar" style={{ width: 36, height: 36, fontSize: 14, background: `linear-gradient(135deg, hsl(${user.name.length * 40}, 70%, 50%), hsl(${user.name.length * 60}, 70%, 40%))` }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ width: '130px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Team Member</div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, background: 'var(--bg-secondary)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ background: 'var(--accent)', height: '100%', width: `${(user.total / maxUserTasks) * 100}%`, borderRadius: '3px' }}></div>
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', width: '20px', textAlign: 'right' }}>{user.total}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Critical Overdue */}
        <div className="card glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--danger)' }}></div>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Critical Overdue</h3>
            </div>
            <span style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
              {overdueCount} Items
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {overdueCount === 0 ? (
              <div style={{ color: 'var(--success)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                🎉 No overdue tasks! Great job team.
              </div>
            ) : (
              // If we have overdue tasks but don't have the specific list in this API, we can show recent tasks that might be overdue, 
              // or just a placeholder list based on the overdueCount
              stats?.recentTasks?.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'Done').slice(0, 3).map((task, idx) => (
                <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', background: 'var(--bg-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{task.title}</h4>
                    <span style={{ color: 'var(--danger)', fontSize: '12px', fontWeight: 600 }}>⚠️ Overdue</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    {task.project?.name || 'Project'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ background: 'var(--bg-card)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {task.priority} Priority
                    </span>
                    {task.assignee && (
                      <div className="user-avatar" style={{ width: 20, height: 20, fontSize: 10, background: 'var(--accent)' }}>
                        {task.assignee.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {/* Fallback if recentTasks doesn't contain the overdue ones */}
            {overdueCount > 0 && (!stats.recentTasks || stats.recentTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'Done').length === 0) && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', background: 'var(--bg-secondary)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>You have {overdueCount} overdue tasks</h4>
                    <span style={{ color: 'var(--danger)', fontSize: '12px', fontWeight: 600 }}>⚠️ Overdue</span>
                  </div>
                  <Link to="/projects" style={{ fontSize: '12px', color: 'var(--accent)' }}>Check your projects to resolve them →</Link>
              </div>
            )}
            
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '8px', border: '1px solid var(--border)' }}>
              View All Overdue Tasks
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
