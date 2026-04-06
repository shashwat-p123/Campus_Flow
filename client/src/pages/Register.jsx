import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';
import './Login.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', branch: '', semester: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        ...form,
        semester: form.semester ? parseInt(form.semester) : null,
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Hero — same as login */}
      <div className="login-hero">
        <div className="hero-content">
          <div className="hero-badge"><Sparkles size={16} /> AI-Powered</div>
          <h1>Join the<br /><span className="gradient-text">CampusFlow</span></h1>
          <p>Create your account and become part of your college's most connected community.</p>
          <div className="hero-features">
            <div className="feature-pill">📚 Share Notes</div>
            <div className="feature-pill">🤖 AI Summaries</div>
            <div className="feature-pill">🎉 Events</div>
            <div className="feature-pill">💬 Discuss</div>
          </div>
        </div>
        <div className="hero-bg-shapes">
          <div className="shape shape1"></div>
          <div className="shape shape2"></div>
          <div className="shape shape3"></div>
        </div>
      </div>

      {/* Form */}
      <div className="login-form-section">
        <div className="form-container">
          <div className="form-header">
            <div className="mobile-logo">
              <div className="logo-icon"><Sparkles size={20} /></div>
              <span>CampusFlow</span>
            </div>
            <h2>Create your account</h2>
            <p>Fill in your details to get started</p>
          </div>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="reg-name">Full Name</label>
              <input id="reg-name" name="name" type="text" className="input"
                placeholder="John Doe" value={form.name} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label htmlFor="reg-email">Email Address</label>
              <input id="reg-email" name="email" type="email" className="input"
                placeholder="you@university.edu" value={form.email} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label htmlFor="reg-password">Password</label>
              <div className="password-input">
                <input id="reg-password" name="password" type={showPass ? 'text' : 'password'}
                  className="input" placeholder="Min 6 characters" value={form.password}
                  onChange={handleChange} required minLength={6} />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label htmlFor="reg-branch">Branch</label>
                <select id="reg-branch" name="branch" className="input" value={form.branch} onChange={handleChange}>
                  <option value="">Select</option>
                  <option>Computer Science</option>
                  <option>Physics</option>
                  <option>Mathematics</option>
                  <option>Chemistry</option>
                  <option>Literature</option>
                  <option>Engineering</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label htmlFor="reg-semester">Semester</label>
                <select id="reg-semester" name="semester" className="input" value={form.semester} onChange={handleChange}>
                  <option value="">Select</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg login-btn" disabled={loading}>
              {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : <>Create Account <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="switch-link">
            Already a member? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
