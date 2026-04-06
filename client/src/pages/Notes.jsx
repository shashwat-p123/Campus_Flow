import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { notesAPI } from '../services/api';
import { formatDate, getSubjectColor, truncate, getInitials } from '../utils/helpers';
import {
  BookOpen, Search, Upload, Eye, FileText, Sparkles,
  X, Download, Clock, Filter
} from 'lucide-react';
import './Notes.css';

export default function Notes() {
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showUpload, setShowUpload] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [summarizing, setSummarizing] = useState(false);

  const subjects = ['All', 'Computer Science', 'Physics', 'Mathematics', 'Chemistry', 'Literature', 'System Design'];

  useEffect(() => {
    fetchNotes();
  }, [selectedSubject, searchQuery]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSubject !== 'All') params.subject = selectedSubject;
      if (searchQuery) params.search = searchQuery;
      const data = await notesAPI.getAll(params);
      setNotes(data);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async (noteId) => {
    setSummarizing(true);
    try {
      const { summary } = await notesAPI.summarize(noteId);
      setShowDetail(prev => prev ? { ...prev, summary } : prev);
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, summary } : n));
    } catch (err) {
      alert(err.message || 'Summarization failed');
    } finally {
      setSummarizing(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    try {
      await notesAPI.create(formData);
      setShowUpload(false);
      fetchNotes();
    } catch (err) {
      alert(err.message || 'Upload failed');
    }
  };

  const featured = notes[0];

  return (
    <div className="notes-page animate-fade-in">
      {/* Header */}
      <div className="notes-header">
        <div>
          <h1><BookOpen size={28} /> Intellectual Repository</h1>
          <p>Discover, share, and AI-summarize academic notes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
          <Upload size={16} /> Upload Note
        </button>
      </div>

      {/* Filters */}
      <div className="notes-filters">
        <div className="filter-chips">
          {subjects.map(s => (
            <button
              key={s}
              className={`chip ${selectedSubject === s ? 'active' : ''}`}
              onClick={() => setSelectedSubject(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="notes-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Featured Note */}
      {featured && (
        <div className="featured-note card" onClick={() => setShowDetail(featured)}>
          <div className="featured-accent" style={{ background: getSubjectColor(featured.subject) }} />
          <div className="featured-body">
            <span className="badge badge-primary">⭐ Featured</span>
            <h2>{featured.title}</h2>
            <p>{truncate(featured.description, 200)}</p>
            <div className="featured-meta">
              <span className="note-uploader">
                <div className="mini-avatar">{getInitials(featured.uploader_name)}</div>
                {featured.uploader_name}
              </span>
              <span><Eye size={14} /> {featured.views} views</span>
              <span><Clock size={14} /> {formatDate(featured.created_at)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notes Grid */}
      {loading ? (
        <div className="notes-grid">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />
          ))}
        </div>
      ) : (
        <div className="notes-grid">
          {notes.slice(1).map((note, i) => (
            <div
              key={note.id}
              className="note-card card card-interactive"
              onClick={() => setShowDetail(note)}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="note-color-bar" style={{ background: getSubjectColor(note.subject) }} />
              <div className="note-body">
                <span className="note-subject" style={{ color: getSubjectColor(note.subject), background: getSubjectColor(note.subject) + '15' }}>
                  {note.subject}
                </span>
                <h3>{truncate(note.title, 60)}</h3>
                <p>{truncate(note.description, 100)}</p>
                <div className="note-footer">
                  <span className="note-uploader">
                    <div className="mini-avatar">{getInitials(note.uploader_name)}</div>
                    {note.uploader_name}
                  </span>
                  <span className="note-views"><Eye size={14} /> {note.views}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && notes.length === 0 && (
        <div className="empty-state">
          <BookOpen size={48} />
          <h3>No notes found</h3>
          <p>Try changing the filter or upload the first note!</p>
        </div>
      )}

      {/* Note Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content note-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{showDetail.title}</h3>
              <button className="btn btn-icon" onClick={() => setShowDetail(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-meta">
                <span className="note-subject" style={{ color: getSubjectColor(showDetail.subject), background: getSubjectColor(showDetail.subject) + '15' }}>
                  {showDetail.subject}
                </span>
                <span className="note-uploader">
                  <div className="mini-avatar">{getInitials(showDetail.uploader_name)}</div>
                  {showDetail.uploader_name}
                </span>
                <span><Eye size={14} /> {showDetail.views} views</span>
                <span><Clock size={14} /> {formatDate(showDetail.created_at)}</span>
              </div>

              <div className="detail-description">
                <h4>Description</h4>
                <p>{showDetail.description || 'No description provided.'}</p>
              </div>

              {/* AI Summary */}
              <div className="ai-summary-section">
                <div className="ai-header">
                  <Sparkles size={18} className="ai-icon" />
                  <h4>AI Summary</h4>
                </div>
                {showDetail.summary ? (
                  <div className="ai-result">
                    {showDetail.summary.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                ) : (
                  <button
                    className="btn btn-outline ai-btn"
                    onClick={() => handleSummarize(showDetail.id)}
                    disabled={summarizing}
                  >
                    {summarizing ? (
                      <><div className="spinner" style={{ width: 16, height: 16 }} /> Summarizing...</>
                    ) : (
                      <><Sparkles size={16} /> Summarize with AI</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Note</h3>
              <button className="btn btn-icon" onClick={() => setShowUpload(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label>Title</label>
                  <input name="title" className="input" placeholder="Note title" required />
                </div>
                <div className="input-group">
                  <label>Subject</label>
                  <select name="subject" className="input" required>
                    {subjects.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Branch</label>
                    <input name="branch" className="input" placeholder="e.g. CS" />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Semester</label>
                    <input name="semester" className="input" type="number" min="1" max="8" />
                  </div>
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea name="description" className="textarea" placeholder="What's in these notes?" />
                </div>
                <div className="input-group">
                  <label>File (PDF/Image)</label>
                  <input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg" className="input" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Upload size={16} /> Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
