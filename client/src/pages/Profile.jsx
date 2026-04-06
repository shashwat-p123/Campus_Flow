import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notesAPI, forumAPI } from '../services/api';
import { formatDate, getInitials, getSubjectColor, truncate } from '../utils/helpers';
import {
  User, BookOpen, MessageSquare, Moon, Sun, LogOut,
  Mail, Calendar, GraduationCap, Clock, Eye
} from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('notes');
  const [myNotes, setMyNotes] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      Promise.all([
        notesAPI.getAll().catch(() => []),
        forumAPI.getAll().catch(() => []),
      ]).then(([notes, posts]) => {
        setMyNotes(notes.filter(n => n.uploaded_by === user.id));
        setMyPosts(posts.filter(p => p.posted_by === user.id));
        setLoading(false);
      });
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="profile-page animate-fade-in">
      {/* Profile Header */}
      <div className="profile-card card">
        <div className="profile-banner" />
        <div className="profile-info">
          <div className="profile-avatar-lg">
            {getInitials(user.name)}
          </div>
          <div className="profile-details">
            <h1>{user.name}</h1>
            <div className="profile-meta-items">
              <span><Mail size={14} /> {user.email}</span>
              {user.branch && <span><GraduationCap size={14} /> {user.branch}</span>}
              {user.semester && <span><Calendar size={14} /> Semester {user.semester}</span>}
              <span><Clock size={14} /> Joined {formatDate(user.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="stat-card card">
          <BookOpen size={24} className="stat-icon" />
          <div className="stat-data">
            <span className="stat-num">{myNotes.length}</span>
            <span className="stat-lbl">Notes Shared</span>
          </div>
        </div>
        <div className="stat-card card">
          <MessageSquare size={24} className="stat-icon" />
          <div className="stat-data">
            <span className="stat-num">{myPosts.length}</span>
            <span className="stat-lbl">Discussions</span>
          </div>
        </div>
        <div className="stat-card card">
          <Eye size={24} className="stat-icon" />
          <div className="stat-data">
            <span className="stat-num">{myNotes.reduce((sum, n) => sum + (n.views || 0), 0)}</span>
            <span className="stat-lbl">Total Views</span>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="profile-settings card">
        <h3>Settings</h3>
        <div className="setting-row">
          <div className="setting-info">
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            <div>
              <p className="setting-title">Dark Mode</p>
              <p className="setting-desc">Toggle between light and dark themes</p>
            </div>
          </div>
          <button className="toggle-switch" onClick={toggleTheme} data-active={theme === 'dark'}>
            <div className="toggle-knob" />
          </button>
        </div>
        <div className="setting-row">
          <div className="setting-info">
            <LogOut size={18} />
            <div>
              <p className="setting-title">Sign Out</p>
              <p className="setting-desc">Log out of your account</p>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={logout}>Sign Out</button>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="profile-content">
        <div className="profile-tabs">
          <button className={`ptab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
            <BookOpen size={16} /> My Notes
          </button>
          <button className={`ptab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
            <MessageSquare size={16} /> My Posts
          </button>
        </div>

        {loading ? (
          <div className="profile-content-grid">
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
          </div>
        ) : activeTab === 'notes' ? (
          <div className="profile-content-grid">
            {myNotes.length === 0 ? (
              <p className="empty-text">No notes shared yet</p>
            ) : (
              myNotes.map(note => (
                <div key={note.id} className="mini-card card">
                  <div className="mc-bar" style={{ background: getSubjectColor(note.subject) }} />
                  <div className="mc-body">
                    <span className="note-subject" style={{ color: getSubjectColor(note.subject), background: getSubjectColor(note.subject) + '15' }}>
                      {note.subject}
                    </span>
                    <h4>{truncate(note.title, 50)}</h4>
                    <div className="mc-meta">
                      <span><Eye size={12} /> {note.views}</span>
                      <span><Clock size={12} /> {formatDate(note.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="profile-content-grid">
            {myPosts.length === 0 ? (
              <p className="empty-text">No discussions posted yet</p>
            ) : (
              myPosts.map(post => (
                <div key={post.id} className="mini-card card">
                  <div className="mc-body">
                    <h4>{truncate(post.title, 60)}</h4>
                    <div className="mc-meta">
                      <span>▲ {post.upvotes}</span>
                      <span><MessageSquare size={12} /> {post.comment_count}</span>
                      <span><Clock size={12} /> {formatDate(post.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
