import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="landing-page">
      {/* Animated background blobs */}
      <div className="landing-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="sidebar-logo" style={{ width: 36, height: 36, fontSize: 18, background: 'var(--accent)' }}>🚀</div>
            <span className="sidebar-title" style={{ fontSize: 22 }}>WorkPilot</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary">Go to Workspace</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost" style={{ color: '#fff' }}>Sign In</Link>
                <Link to="/register" className="btn btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-badge">✨ Next-Generation Team Workflows</div>
        <h1 className="hero-title">
          Build the Future.<br />
          <span className="hero-gradient-text">Manage with WorkPilot.</span>
        </h1>
        <p className="hero-subtitle">
          WorkPilot helps modern teams organize complex projects, assign tasks, and track progress
          with an intuitive, high-performance workspace.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-primary btn-lg">Start Free Trial →</Link>
          <a href="#features" className="btn btn-glass btn-lg">Explore Platform</a>
        </div>

        {/* Stats */}
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">🚀</span>
            <span className="hero-stat-label">Fast Execution</span>
          </div>
          <div className="hero-stat-divider"></div>
          <div className="hero-stat">
            <span className="hero-stat-value">⚡</span>
            <span className="hero-stat-label">Seamless Collaboration</span>
          </div>
          <div className="hero-stat-divider"></div>
          <div className="hero-stat">
            <span className="hero-stat-value">🔒</span>
            <span className="hero-stat-label">Enterprise Secure</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features" id="features">
        <h2 className="section-title">Everything You Need</h2>
        <p className="section-subtitle">Powerful features designed specifically for modern technical teams</p>
        <div className="features-grid">
          {[
            { icon: '🚀', title: 'Agile Projects', desc: 'Create initiatives, invite contributors, and assign specific team roles' },
            { icon: '📋', title: 'Dynamic Kanban', desc: 'Drag-and-drop task management optimized for rapid iteration' },
            { icon: '👥', title: 'Team Collaboration', desc: 'Real-time updates and seamless handover between engineers' },
            { icon: '📊', title: 'Analytics Dashboard', desc: 'Deep insights into workload distribution and project bottlenecks' },
            { icon: '🎯', title: 'Smart Priorities', desc: 'Keep the team focused on critical milestones and deliverables' },
            { icon: '🛡️', title: 'Secure Access', desc: 'Granular permissions to protect your proprietary data and projects' },
          ].map((f, i) => (
            <div className="feature-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="cta-card">
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>Ready to accelerate your workflow?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '28px' }}>
            Join WorkPilot today and transform how your team builds the future.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">Create Free Account →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} WorkPilot Platform. Built for the assignment.</p>
      </footer>
    </div>
  );
}
