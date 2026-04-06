import { useState, useEffect } from 'react';
import { eventsAPI } from '../services/api';
import { formatEventDate, truncate, getInitials, getCategoryColor } from '../utils/helpers';
import {
  Calendar, MapPin, Clock, Users, Plus, X, Sparkles,
  ChevronRight, Star
} from 'lucide-react';
import './Events.css';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [showCreate, setShowCreate] = useState(false);

  const categories = ['all', 'workshop', 'conference', 'seminar', 'career', 'social'];

  useEffect(() => {
    fetchEvents();
  }, [category]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await eventsAPI.getAll({ category });
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      const result = await eventsAPI.rsvp(eventId, status);
      setEvents(prev => prev.map(e =>
        e.id === eventId ? { ...e, user_rsvp: result.status === 'none' ? null : result.status, rsvp_count: result.rsvp_count } : e
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      title: form.title.value,
      description: form.description.value,
      date: form.date.value,
      location: form.location.value,
      category: form.category.value,
    };
    try {
      await eventsAPI.create(data);
      setShowCreate(false);
      fetchEvents();
    } catch (err) {
      alert(err.message);
    }
  };

  const featured = events.find(e => e.is_featured) || events[0];
  const upcoming = events.filter(e => e.id !== featured?.id);

  return (
    <div className="events-page animate-fade-in">
      <div className="events-header">
        <div>
          <h1><Calendar size={28} /> Discover Events</h1>
          <p>Find what's happening on campus</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Create Event
        </button>
      </div>

      {/* Category Filters */}
      <div className="category-filters">
        {categories.map(c => (
          <button
            key={c}
            className={`chip ${category === c ? 'active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c === 'all' ? 'All Events' : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="events-skeleton">
          <div className="skeleton" style={{ height: 300, borderRadius: 24 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16 }} />)}
          </div>
        </div>
      ) : (
        <>
          {/* Featured Event */}
          {featured && (
            <div className="featured-event card">
              <div className="fe-gradient" />
              <div className="fe-content">
                <div className="fe-badge">
                  <Star size={12} /> Featured Event
                </div>
                <h2>{featured.title}</h2>
                <p>{truncate(featured.description, 180)}</p>
                <div className="fe-meta">
                  <span><Calendar size={14} /> {formatEventDate(featured.date).full}</span>
                  <span><Clock size={14} /> {formatEventDate(featured.date).time}</span>
                  <span><MapPin size={14} /> {featured.location}</span>
                  <span><Users size={14} /> {featured.rsvp_count || 0} attending</span>
                </div>
                <div className="fe-actions">
                  <button
                    className={`btn ${featured.user_rsvp === 'going' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handleRSVP(featured.id, featured.user_rsvp === 'going' ? 'none' : 'going')}
                  >
                    {featured.user_rsvp === 'going' ? '✓ Going' : 'Join Event'}
                  </button>
                  <button
                    className={`btn ${featured.user_rsvp === 'interested' ? 'btn-secondary' : 'btn-ghost'}`}
                    onClick={() => handleRSVP(featured.id, featured.user_rsvp === 'interested' ? 'none' : 'interested')}
                  >
                    {featured.user_rsvp === 'interested' ? '★ Interested' : '☆ Interested'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Events Grid */}
          <div className="events-grid">
            {upcoming.map((event, i) => {
              const d = formatEventDate(event.date);
              const catColor = getCategoryColor(event.category);
              return (
                <div key={event.id} className="event-card card card-interactive" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="ec-top">
                    <div className="ec-date">
                      <span className="ec-month">{d.month}</span>
                      <span className="ec-day">{d.day}</span>
                      <span className="ec-weekday">{d.weekday}</span>
                    </div>
                    <span className="ec-category" style={{ background: catColor.bg, color: catColor.color }}>
                      {event.category}
                    </span>
                  </div>
                  <h3>{truncate(event.title, 50)}</h3>
                  <p>{truncate(event.description, 100)}</p>
                  <div className="ec-meta">
                    <span><Clock size={12} /> {d.time}</span>
                    <span><MapPin size={12} /> {event.location}</span>
                  </div>
                  <div className="ec-footer">
                    <span className="ec-attendees"><Users size={14} /> {event.rsvp_count || 0}</span>
                    <div className="ec-btns">
                      <button
                        className={`btn btn-sm ${event.user_rsvp === 'going' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleRSVP(event.id, event.user_rsvp === 'going' ? 'none' : 'going')}
                      >
                        {event.user_rsvp === 'going' ? '✓ Going' : 'Join'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {events.length === 0 && (
            <div className="empty-state">
              <Calendar size={48} />
              <h3>No events found</h3>
              <p>Create the first event for your campus!</p>
            </div>
          )}
        </>
      )}

      {/* Create Event Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Event</h3>
              <button className="btn btn-icon" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label>Title</label>
                  <input name="title" className="input" placeholder="Event title" required />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea name="description" className="textarea" placeholder="What's this event about?" />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Date & Time</label>
                    <input name="date" type="datetime-local" className="input" required />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Category</label>
                    <select name="category" className="input">
                      {categories.filter(c => c !== 'all').map(c => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label>Location</label>
                  <input name="location" className="input" placeholder="Where is it happening?" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Calendar size={16} /> Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
