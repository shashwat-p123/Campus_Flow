import { useState, useEffect } from 'react';
import { lostFoundAPI } from '../services/api';
import { formatDate, truncate, getInitials } from '../utils/helpers';
import { Search as SearchIcon, MapPin, Plus, X, Sparkles, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import './LostFound.css';

export default function LostFound() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [aiDesc, setAiDesc] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const filters = [
    { key: 'all', label: 'All Items' },
    { key: 'lost', label: '🔴 Lost' },
    { key: 'found', label: '🟢 Found' },
    { key: 'claimed', label: '✅ Claimed' },
  ];

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') {
        if (filter === 'claimed') {
          params.status = 'claimed';
        } else {
          params.type = filter;
        }
      }
      const data = await lostFoundAPI.getAll(params);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      await lostFoundAPI.create({
        type: form.type.value,
        title: form.title.value,
        description: form.description.value || aiDesc,
        location: form.location.value,
      });
      setShowCreate(false);
      setAiDesc('');
      fetchItems();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGenerateDesc = async (roughInput) => {
    if (!roughInput) return;
    setAiLoading(true);
    try {
      const { description } = await lostFoundAPI.generateDescription(roughInput);
      setAiDesc(description);
    } catch (err) {
      alert(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const getStatusColor = (type, status) => {
    if (status === 'claimed') return { bg: 'rgba(34,197,94,0.1)', color: '#16A34A', label: 'Claimed', icon: CheckCircle };
    if (type === 'lost') return { bg: 'rgba(239,68,68,0.1)', color: '#EF4444', label: 'Lost', icon: AlertTriangle };
    return { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6', label: 'Found', icon: SearchIcon };
  };

  return (
    <div className="lostfound-page animate-fade-in">
      <div className="lf-header">
        <div>
          <h1><SearchIcon size={28} /> Lost & Found</h1>
          <p>Help your campus community find their belongings</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Report Item
        </button>
      </div>

      <div className="lf-filters">
        {filters.map(f => (
          <button
            key={f.key}
            className={`chip ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="lf-grid">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />
          ))}
        </div>
      ) : (
        <div className="lf-grid">
          {items.map((item, i) => {
            const s = getStatusColor(item.type, item.status);
            const StatusIcon = s.icon;
            return (
              <div key={item.id} className="lf-card card card-interactive" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="lf-card-top">
                  <span className="lf-status" style={{ background: s.bg, color: s.color }}>
                    <StatusIcon size={12} /> {s.label}
                  </span>
                  <span className="lf-time"><Clock size={12} /> {formatDate(item.created_at)}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{truncate(item.description, 120)}</p>
                <div className="lf-card-footer">
                  <span className="lf-location"><MapPin size={12} /> {item.location || 'Unknown'}</span>
                  <span className="lf-poster">
                    <div className="mini-avatar">{getInitials(item.poster_name)}</div>
                    {item.poster_name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="empty-state">
          <SearchIcon size={48} />
          <h3>No items found</h3>
          <p>No lost or found items yet. Report one if needed!</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report Lost/Found Item</h3>
              <button className="btn btn-icon" onClick={() => { setShowCreate(false); setAiDesc(''); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Type</label>
                    <select name="type" className="input" required>
                      <option value="lost">Lost</option>
                      <option value="found">Found</option>
                    </select>
                  </div>
                  <div className="input-group" style={{ flex: 2 }}>
                    <label>Item Name</label>
                    <input name="title" className="input" placeholder="e.g. Blue Hydroflask" required />
                  </div>
                </div>
                <div className="input-group">
                  <label>Location</label>
                  <input name="location" className="input" placeholder="Where was it lost/found?" />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    className="textarea"
                    placeholder="Describe the item..."
                    value={aiDesc}
                    onChange={(e) => setAiDesc(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm ai-gen-btn"
                    onClick={() => {
                      const title = document.querySelector('input[name="title"]')?.value;
                      handleGenerateDesc(title || 'item');
                    }}
                    disabled={aiLoading}
                  >
                    {aiLoading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Generating...</> : <><Sparkles size={14} /> Generate with AI</>}
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setAiDesc(''); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Report Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
