import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login('alex@university.edu', 'password123');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left Hero */}
      <div className="login-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} /> AI-Powered
          </div>
          <h1>Welcome to<br /><span className="gradient-text">CampusFlow</span></h1>
          <p>Your intelligent college community platform. Share notes, discover events, join discussions — all powered by AI.</p>
          <div className="hero-features">
            <div className="feature-pill">📚 Smart Notes</div>
            <div className="feature-pill">🎉 Events</div>
            <div className="feature-pill">💬 Forums</div>
            <div className="feature-pill">🔍 Lost & Found</div>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">2.4k+</span>
              <span className="stat-label">Students</span>
            </div>
            <div className="stat">
              <span className="stat-number">850+</span>
              <span className="stat-label">Notes Shared</span>
            </div>
            <div className="stat">
              <span className="stat-number">120+</span>
              <span className="stat-label">Events</span>
            </div>
          </div>
        </div>
        <div className="hero-bg-shapes">
          <div className="shape shape1"></div>
          <div className="shape shape2"></div>
          <div className="shape shape3"></div>
        </div>
      </div>

      {/* Right Form */}
      <div className="login-form-section">
        <div className="form-container">
          <div className="form-header">
            <div className="mobile-logo">
              <div className="logo-icon"><Sparkles size={20} /></div>
              <span>CampusFlow</span>
            </div>
            <h2>Sign in to your account</h2>
            <p>Enter your credentials to access the platform</p>
          </div>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="login-password">Password</label>
              <div className="password-input">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg login-btn" disabled={loading}>
              {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="divider"><span>or</span></div>

          <button className="demo-btn" onClick={handleDemoLogin} disabled={loading}>
            <Sparkles size={16} /> Sign in with Demo Account
          </button>

          <p className="switch-link">
            New to the flow? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
