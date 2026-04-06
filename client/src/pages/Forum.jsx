import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forumAPI } from '../services/api';
import { formatDate, truncate, getInitials, getCategoryColor } from '../utils/helpers';
import {
  MessageSquare, TrendingUp, Clock, Plus, X, Search,
  ArrowUp, ArrowDown, MessageCircle, Tag, Users, Award
} from 'lucide-react';
import './Forum.css';

export default function Forum() {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('recent');
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const categories = [
    { key: 'all', label: 'All Topics', icon: MessageSquare },
    { key: 'academic', label: 'Academic', icon: Award },
    { key: 'clubs', label: 'Clubs', icon: Users },
    { key: 'general', label: 'General', icon: MessageCircle },
  ];

  useEffect(() => {
    fetchDiscussions();
  }, [category, sort]);

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const params = { sort };
      if (category !== 'all') params.category = category;
      const data = await forumAPI.getAll(params);
      setDiscussions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id, value) => {
    try {
      const { vote } = await forumAPI.vote(id, 'discussion', value);
      setDiscussions(prev => prev.map(d => {
        if (d.id !== id) return d;
        const diff = vote - (d.user_vote || 0);
        return { ...d, upvotes: d.upvotes + diff, user_vote: vote };
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const form = e.target;
    const tags = form.tags.value ? form.tags.value.split(',').map(t => t.trim()) : [];
    try {
      const discussion = await forumAPI.create({
        title: form.title.value,
        content: form.content.value,
        category: form.category.value,
        tags,
      });
      setShowCreate(false);
      navigate(`/forum/${discussion.id}`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Trending tags from discussions
  const allTags = discussions.flatMap(d => d.tags || []);
  const tagCounts = {};
  allTags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
  const trendingTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="forum-page animate-fade-in">
      <div className="forum-layout">
        {/* Left Sidebar */}
        <aside className="forum-sidebar">
          <div className="sidebar-section">
            <h3>Navigation</h3>
            {categories.map(c => {
              const Icon = c.icon;
              return (
                <button
                  key={c.key}
                  className={`sidebar-item ${category === c.key ? 'active' : ''}`}
                  onClick={() => setCategory(c.key)}
                >
                  <Icon size={16} />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
          <div className="sidebar-section">
            <h3>Sort By</h3>
            <button
              className={`sidebar-item ${sort === 'popular' ? 'active' : ''}`}
              onClick={() => setSort('popular')}
            >
              <TrendingUp size={16} /> Popular
            </button>
            <button
              className={`sidebar-item ${sort === 'recent' ? 'active' : ''}`}
              onClick={() => setSort('recent')}
            >
              <Clock size={16} /> Recent
            </button>
          </div>
        </aside>

        {/* Center Feed */}
        <main className="forum-feed">
          <div className="feed-header">
            <h1><MessageSquare size={26} /> Discussion Forum</h1>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Ask Question
            </button>
          </div>

          {loading ? (
            <div className="feed-list">
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
            </div>
          ) : (
            <div className="feed-list">
              {discussions.map((d, i) => {
                const catColor = getCategoryColor(d.category);
                return (
                  <div key={d.id} className="discussion-card card" style={{ animationDelay: `${i * 0.05}s` }}>
                    {/* Vote Controls */}
                    <div className="vote-controls">
                      <button
                        className={`vote-btn ${d.user_vote === 1 ? 'voted-up' : ''}`}
                        onClick={() => handleVote(d.id, 1)}
                      >
                        <ArrowUp size={18} />
                      </button>
                      <span className="vote-count">{d.upvotes}</span>
                      <button
                        className={`vote-btn ${d.user_vote === -1 ? 'voted-down' : ''}`}
                        onClick={() => handleVote(d.id, -1)}
                      >
                        <ArrowDown size={18} />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="discussion-content">
                      <div className="disc-top">
                        <span className="disc-category" style={{ background: catColor.bg, color: catColor.color }}>
                          {d.category}
                        </span>
                        <span className="disc-time">{formatDate(d.created_at)}</span>
                      </div>
                      <Link to={`/forum/${d.id}`} className="disc-title">
                        <h3>{d.title}</h3>
                      </Link>
                      <p className="disc-preview">{truncate(d.content, 150)}</p>
                      <div className="disc-footer">
                        <span className="disc-author">
                          <div className="mini-avatar">{getInitials(d.author_name)}</div>
                          {d.author_name}
                        </span>
                        <Link to={`/forum/${d.id}`} className="disc-replies">
                          <MessageCircle size={14} /> {d.comment_count} replies
                        </Link>
                        <div className="disc-tags">
                          {(d.tags || []).slice(0, 3).map(tag => (
                            <span key={tag} className="disc-tag"><Tag size={10} /> {tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && discussions.length === 0 && (
            <div className="empty-state">
              <MessageSquare size={48} />
              <h3>No discussions yet</h3>
              <p>Start the first conversation!</p>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="forum-right-sidebar">
          <div className="sidebar-card card">
            <h3><TrendingUp size={16} /> Trending Tags</h3>
            <div className="trending-tags">
              {trendingTags.map(([tag, count]) => (
                <span key={tag} className="trending-tag">
                  <Tag size={12} /> {tag}
                  <span className="tag-count">{count}</span>
                </span>
              ))}
              {trendingTags.length === 0 && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No tags yet</p>}
            </div>
          </div>

          <div className="sidebar-card card karma-card">
            <div className="karma-header">
              <Award size={20} className="karma-icon" />
              <h3>Campus Karma</h3>
            </div>
            <p className="karma-desc">Earn points by sharing notes, helping others, and being active!</p>
            <div className="karma-levels">
              <div className="karma-level">🌱 Newcomer</div>
              <div className="karma-level">⭐ Contributor</div>
              <div className="karma-level active">🔥 Rising Star</div>
              <div className="karma-level">💎 Legend</div>
            </div>
          </div>
        </aside>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ask a Question</h3>
              <button className="btn btn-icon" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label>Title</label>
                  <input name="title" className="input" placeholder="What's your question?" required />
                </div>
                <div className="input-group">
                  <label>Content</label>
                  <textarea name="content" className="textarea" placeholder="Provide details..." rows={4} />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Category</label>
                    <select name="category" className="input">
                      <option value="academic">Academic</option>
                      <option value="clubs">Clubs</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Tags (comma-separated)</label>
                    <input name="tags" className="input" placeholder="CS, Advice" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><MessageSquare size={16} /> Post</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
