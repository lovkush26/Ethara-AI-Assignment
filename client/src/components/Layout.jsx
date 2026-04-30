import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { taskAPI, authAPI, notificationAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Layout({ children }) {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Profile State
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', profilePic: user?.profilePic || '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    setShowNotifications(false);
  }, [location.pathname]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoadingNotifs(true);
      const [statsRes, notifsRes] = await Promise.all([
        taskAPI.getDashboardStats(),
        notificationAPI.getAll()
      ]);
      
      const stats = statsRes.data;
      const backendNotifs = notifsRes.data.map(n => ({
        id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        time: new Date(n.createdAt).toLocaleString(),
        read: n.read,
        targetUrl: n.targetUrl || '',
        fromBackend: true
      }));

      const derivedNotifs = [];
      
      // Keep overdue check
      if (stats.overdueTasks > 0) {
        derivedNotifs.push({
          id: 'overdue_alert',
          type: 'danger',
          title: 'Critical Overdue Tasks',
          message: `You have ${stats.overdueTasks} overdue tasks.`,
          time: 'Action Required',
          read: false
        });
      }

      const allNotifs = [...derivedNotifs, ...backendNotifs];

      if (allNotifs.length === 0) {
        allNotifs.push({
          id: 'welcome_notif',
          type: 'success',
          title: 'All caught up!',
          message: 'No pending tasks or critical alerts.',
          time: 'Just now',
          read: true
        });
      }
      
      setNotifications(allNotifs);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen for custom app-data-changed events to update notifications in real-time
    window.addEventListener('app-data-changed', fetchNotifications);
    
    // Listen for cross-tab events
    const bc = new BroadcastChannel('workpilot_events');
    bc.onmessage = (event) => {
      if (event.data === 'app-data-changed') fetchNotifications();
    };

    return () => {
      window.removeEventListener('app-data-changed', fetchNotifications);
      bc.close();
    };
  }, [user, location.pathname]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const activeNotifications = notifications.filter(Boolean);

  const handleNotificationClick = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      try {
        await notificationAPI.markAsRead();
        // Optimistically update local state
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (err) {
        console.error('Failed to mark read', err);
      }
    }
  };

  const clearAllNotifications = async (e) => {
    e.stopPropagation();
    try {
      await notificationAPI.clearAll();
      setNotifications([]);
      setShowNotifications(false);
      toast.success('Notifications cleared');
      fetchNotifications(); // Refresh list (will show welcome notif)
    } catch (err) {
      toast.error('Failed to clear notifications');
    }
  };

  const handleNotificationItemClick = (notif) => {
    if (!notif.targetUrl) return;
    setShowNotifications(false);
    navigate(notif.targetUrl);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await authAPI.updateProfile(profileForm);
      updateUser(res.data);
      toast.success('Profile updated successfully');
      setShowProfile(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <div className="app-layout">
      <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '24px 20px', borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div className="sidebar-logo" style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px', width: '32px', height: '32px', fontSize: '14px', flexShrink: 0 }}>
              WP
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>WorkPilot</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Project Workspace</div>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/projects')}>
            ➕ New Project
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}>
            <span className="icon" style={{ opacity: 0.7 }}>⊞</span> Dashboard
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}>
            <span className="icon" style={{ opacity: 0.7 }}>📁</span> Projects
          </NavLink>

          <button className="nav-link" onClick={toggleTheme} style={{ marginTop: 'auto' }}>
            <span className="icon">{theme === 'dark' ? '☀️' : '🌙'}</span> {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-link" style={{ color: 'var(--text-secondary)' }} onClick={() => setShowProfile(true)}>
            <span className="icon">⚙️</span> Settings
          </button>
          <button className="nav-link" onClick={handleLogout} style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
            <span className="icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      <div className="main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '260px' }}>
        
        <header className="top-header" style={{ 
          height: '70px', 
          borderBottom: '1px solid var(--border)', 
          background: 'var(--bg-secondary)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 32px',
          position: 'sticky', 
          top: 0, 
          zIndex: 90
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent)' }}>WorkPilot</div>
            <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
              <span style={{ position: 'absolute', left: '12px', top: '10px', opacity: 0.4 }}>🔍</span>
              <input 
                className="form-input" 
                placeholder="Search tasks, projects..." 
                style={{ paddingLeft: '36px', background: 'var(--bg-card)', border: '1px solid var(--border)', height: '40px' }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={handleNotificationClick}>
              <span style={{ fontSize: '20px', filter: 'grayscale(100%)', opacity: 0.6 }}>🔔</span>
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--bg-secondary)' }}></span>
              )}
              
              {showNotifications && (
                <div style={{ position: 'absolute', top: '36px', right: '-10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', width: '320px', boxShadow: 'var(--shadow)', padding: '16px', zIndex: 100, cursor: 'default' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications ({unreadCount} unread)</h4>
                    {activeNotifications.length > 0 && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={clearAllNotifications}>Clear all</span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                    {activeNotifications.length === 0 ? (
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No notifications</div>
                    ) : (
                      activeNotifications.map((notif, idx) => (
                        <div
                          key={notif.id || idx}
                          onClick={() => handleNotificationItemClick(notif)}
                          style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingBottom: '12px', borderBottom: idx < activeNotifications.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: '12px', opacity: notif.read ? 0.7 : 1, cursor: notif.targetUrl ? 'pointer' : 'default' }}
                          title={notif.targetUrl ? 'Open related project' : undefined}
                        >
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: `var(--${notif.type || 'accent'})`, marginTop: 4, flexShrink: 0 }}></div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{notif.title}</div>
                            <div style={{ marginTop: '2px' }}>{notif.message}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{notif.time}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <span style={{ fontSize: '20px', cursor: 'pointer', filter: 'grayscale(100%)', opacity: 0.6 }} onClick={() => toast("Help center coming soon!")}>❓</span>
            
            {/* Profile Picture or Initials */}
            {user?.profilePic ? (
              <img 
                src={user.profilePic} 
                alt="Profile" 
                onClick={() => setShowProfile(true)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', border: '2px solid var(--border)', objectFit: 'cover' }} 
              />
            ) : (
              <div className="user-avatar" style={{ cursor: 'pointer', border: '2px solid var(--border)' }} title={`${user?.name} (${user?.email})`} onClick={() => setShowProfile(true)}>
                {initials}
              </div>
            )}
          </div>
        </header>

        <main className="main-content fade-in" style={{ marginLeft: 0, padding: '32px' }} onClick={() => setShowNotifications(false)}>
          {children}
        </main>
      </div>

      {/* Profile Settings Modal */}
      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Profile</h2>
              <button className="modal-close" onClick={() => setShowProfile(false)}>✕</button>
            </div>
            <form onSubmit={handleProfileSubmit}>
              <div className="form-group" style={{ textAlign: 'center', marginBottom: '24px' }}>
                {profileForm.profilePic ? (
                  <img src={profileForm.profilePic} alt="Preview" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px', border: '2px solid var(--accent)' }} />
                ) : (
                  <div className="user-avatar" style={{ width: 80, height: 80, fontSize: 32, margin: '0 auto 12px' }}>{initials}</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Profile Picture URL (Optional)</label>
                <input className="form-input" type="url" placeholder="https://example.com/avatar.jpg" value={profileForm.profilePic} onChange={e => setProfileForm({...profileForm, profilePic: e.target.value})} />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Paste a direct link to an image to use as your avatar.</p>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProfile(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={updatingProfile}>
                  {updatingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {sidebarOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 99 }} onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
