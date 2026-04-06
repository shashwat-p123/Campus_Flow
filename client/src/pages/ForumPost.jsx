import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { forumAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, getInitials, getCategoryColor } from '../utils/helpers';
import {
  ArrowLeft, ArrowUp, ArrowDown, MessageCircle, Tag,
  Send, Sparkles, Clock
} from 'lucide-react';
import './ForumPost.css';

export default function ForumPost() {
  const { id } = useParams();
  const { user } = useAuth();
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [explaining, setExplaining] = useState(null);
  const [explanation, setExplanation] = useState({});

  useEffect(() => {
    fetchDiscussion();
  }, [id]);

  const fetchDiscussion = async () => {
    setLoading(true);
    try {
      const data = await forumAPI.getOne(id);
      setDiscussion(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (targetId, targetType, value) => {
    try {
      const { vote } = await forumAPI.vote(targetId, targetType, value);
      if (targetType === 'discussion') {
        setDiscussion(prev => {
          const diff = vote - (prev.user_vote || 0);
          return { ...prev, upvotes: prev.upvotes + diff, user_vote: vote };
        });
      } else {
        setDiscussion(prev => ({
          ...prev,
          replies: prev.replies.map(r => {
            if (r.id !== targetId) return r;
            const diff = vote - (r.user_vote || 0);
            return { ...r, upvotes: r.upvotes + diff, user_vote: vote };
          }),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const reply = await forumAPI.reply(id, replyText);
      setDiscussion(prev => ({
        ...prev,
        replies: [...prev.replies, reply],
        comment_count: prev.comment_count + 1,
      }));
      setReplyText('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExplain = async (replyId, content) => {
    setExplaining(replyId);
    try {
      const { explanation: exp } = await forumAPI.explain(discussion.title, content);
      setExplanation(prev => ({ ...prev, [replyId]: exp }));
    } catch (err) {
      alert(err.message);
    } finally {
      setExplaining(null);
    }
  };

  if (loading) {
    return (
      <div className="forum-post-page">
        <div className="skeleton" style={{ height: 200, borderRadius: 16, marginBottom: 16 }} />
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16, marginBottom: 12 }} />)}
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="forum-post-page">
        <div className="empty-state">
          <h3>Discussion not found</h3>
          <Link to="/forum" className="btn btn-primary">Back to Forum</Link>
        </div>
      </div>
    );
  }

  const catColor = getCategoryColor(discussion.category);

  return (
    <div className="forum-post-page animate-fade-in">
      <Link to="/forum" className="back-link">
        <ArrowLeft size={16} /> Back to Forum
      </Link>

      {/* Main Discussion */}
      <div className="fp-main card">
        <div className="fp-vote">
          <button
            className={`vote-btn ${discussion.user_vote === 1 ? 'voted-up' : ''}`}
            onClick={() => handleVote(discussion.id, 'discussion', 1)}
          >
            <ArrowUp size={20} />
          </button>
          <span className="vote-count">{discussion.upvotes}</span>
          <button
            className={`vote-btn ${discussion.user_vote === -1 ? 'voted-down' : ''}`}
            onClick={() => handleVote(discussion.id, 'discussion', -1)}
          >
            <ArrowDown size={20} />
          </button>
        </div>
        <div className="fp-content">
          <div className="fp-meta">
            <span className="disc-category" style={{ background: catColor.bg, color: catColor.color }}>
              {discussion.category}
            </span>
            <span className="fp-author">
              <div className="mini-avatar">{getInitials(discussion.author_name)}</div>
              {discussion.author_name}
            </span>
            <span className="fp-time"><Clock size={12} /> {formatDate(discussion.created_at)}</span>
          </div>
          <h1>{discussion.title}</h1>
          <div className="fp-body">
            {discussion.content?.split('\n').map((line, i) => <p key={i}>{line}</p>)}
          </div>
          {discussion.tags?.length > 0 && (
            <div className="fp-tags">
              {discussion.tags.map(tag => (
                <span key={tag} className="disc-tag"><Tag size={10} /> {tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      <div className="fp-replies-section">
        <h2><MessageCircle size={20} /> {discussion.replies?.length || 0} Replies</h2>

        <div className="replies-list">
          {discussion.replies?.map(reply => (
            <div key={reply.id} className="reply-card card">
              <div className="reply-vote">
                <button
                  className={`vote-btn ${reply.user_vote === 1 ? 'voted-up' : ''}`}
                  onClick={() => handleVote(reply.id, 'reply', 1)}
                >
                  <ArrowUp size={16} />
                </button>
                <span className="vote-count-sm">{reply.upvotes}</span>
                <button
                  className={`vote-btn ${reply.user_vote === -1 ? 'voted-down' : ''}`}
                  onClick={() => handleVote(reply.id, 'reply', -1)}
                >
                  <ArrowDown size={16} />
                </button>
              </div>
              <div className="reply-content">
                <div className="reply-meta">
                  <span className="reply-author">
                    <div className="mini-avatar">{getInitials(reply.author_name)}</div>
                    {reply.author_name}
                  </span>
                  <span className="reply-time">{formatDate(reply.created_at)}</span>
                </div>
                <div className="reply-body">
                  {reply.content.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>

                {/* AI Explain */}
                {!explanation[reply.id] ? (
                  <button
                    className="btn btn-ghost btn-sm explain-btn"
                    onClick={() => handleExplain(reply.id, reply.content)}
                    disabled={explaining === reply.id}
                  >
                    {explaining === reply.id ? (
                      <><div className="spinner" style={{ width: 14, height: 14 }} /> Explaining...</>
                    ) : (
                      <><Sparkles size={14} /> Explain this answer</>
                    )}
                  </button>
                ) : (
                  <div className="ai-explanation">
                    <div className="ai-header">
                      <Sparkles size={14} className="ai-icon" />
                      <span>AI Explanation</span>
                    </div>
                    <div className="ai-text">
                      {explanation[reply.id].split('\n').map((line, i) => <p key={i}>{line}</p>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Reply Form */}
        <form className="reply-form card" onSubmit={handleReply}>
          <div className="reply-form-inner">
            <div className="mini-avatar">{getInitials(user?.name)}</div>
            <textarea
              className="textarea"
              placeholder="Write your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
            />
          </div>
          <div className="reply-form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting || !replyText.trim()}>
              {submitting ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <><Send size={14} /> Reply</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
