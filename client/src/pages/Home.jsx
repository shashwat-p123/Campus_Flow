import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notesAPI, eventsAPI, forumAPI } from '../services/api';
import { formatDate, formatEventDate, getSubjectColor, truncate, getInitials } from '../utils/helpers';
import {
  BookOpen, Calendar, MessageSquare, Search, ArrowRight,
  Eye, ChevronRight, MapPin, TrendingUp, Clock, Sparkles
} from 'lucide-react';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [events, setEvents] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      notesAPI.getAll({ sort: 'popular' }).catch(() => []),
      eventsAPI.getAll().catch(() => []),
      forumAPI.getAll({ sort: 'popular' }).catch(() => []),
    ]).then(([n, e, d]) => {
      setNotes(n.slice(0, 4));
      setEvents(e.slice(0, 5));
      setDiscussions(d.slice(0, 3));
      setLoading(false);
    });
  }, []);

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="home-page">
        <div className="welcome-banner skeleton" style={{ height: 220, borderRadius: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="home-page animate-fade-in">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="banner-content">
          <div className="banner-badge">
            <Sparkles size={14} /> AI-Powered Campus
          </div>
          <h1>{greeting}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p>
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <div className="quick-actions">
            <Link to="/notes" className="quick-btn">
              <BookOpen size={16} /> Browse Notes
            </Link>
            <Link to="/events" className="quick-btn">
              <Calendar size={16} /> View Events
            </Link>
            <Link to="/forum" className="quick-btn">
              <MessageSquare size={16} /> Join Forum
            </Link>
          </div>
        </div>
        <div className="banner-shapes">
          <div className="bshape bshape1"></div>
          <div className="bshape bshape2"></div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="home-grid">
        {/* Latest Notes */}
        <section className="home-section notes-section">
          <div className="section-header">
            <div>
              <h2><BookOpen size={22} /> Latest Notes</h2>
              <p>Recently shared by the community</p>
            </div>
            <Link to="/notes" className="see-all-link">See all <ChevronRight size={16} /></Link>
          </div>
          <div className="notes-grid-home">
            {notes.map((note, i) => (
              <Link to="/notes" key={note.id} className="note-card-home card card-interactive" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="note-subject-bar" style={{ background: getSubjectColor(note.subject) }} />
                <div className="note-card-body">
                  <span className="note-subject-tag" style={{ color: getSubjectColor(note.subject), background: getSubjectColor(note.subject) + '15' }}>
                    {note.subject}
                  </span>
                  <h4>{truncate(note.title, 50)}</h4>
                  <p>{truncate(note.description, 80)}</p>
                  <div className="note-card-footer">
                    <span className="note-uploader">
                      <div className="mini-avatar">{getInitials(note.uploader_name)}</div>
                      {note.uploader_name}
                    </span>
                    <span className="note-views"><Eye size={14} /> {note.views}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Events Sidebar */}
        <section className="home-section events-section">
          <div className="section-header">
            <div>
              <h2><Calendar size={22} /> Upcoming Events</h2>
              <p>Don't miss out</p>
            </div>
            <Link to="/events" className="see-all-link">See all <ChevronRight size={16} /></Link>
          </div>
          <div className="events-list-home">
            {events.map(event => {
              const d = formatEventDate(event.date);
              return (
                <Link to="/events" key={event.id} className="event-item-home card">
                  <div className="event-date-badge">
                    <span className="edb-month">{d.month}</span>
                    <span className="edb-day">{d.day}</span>
                  </div>
                  <div className="event-item-info">
                    <h4>{truncate(event.title, 40)}</h4>
                    <div className="event-meta-home">
                      <span><Clock size={12} /> {d.time}</span>
                      <span><MapPin size={12} /> {event.location}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="event-arrow" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Trending Forum */}
        <section className="home-section forum-section">
          <div className="section-header">
            <div>
              <h2><TrendingUp size={22} /> Trending in Forum</h2>
              <p>Popular discussions right now</p>
            </div>
            <Link to="/forum" className="see-all-link">See all <ChevronRight size={16} /></Link>
          </div>
          <div className="forum-list-home">
            {discussions.map(d => (
              <Link to={`/forum/${d.id}`} key={d.id} className="forum-item-home card card-interactive">
                <div className="forum-votes-home">
                  <TrendingUp size={14} />
                  <span>{d.upvotes}</span>
                </div>
                <div className="forum-item-content">
                  <h4>{truncate(d.title, 60)}</h4>
                  <p>{truncate(d.content, 100)}</p>
                  <div className="forum-item-meta">
                    <span className="forum-author">
                      <div className="mini-avatar">{getInitials(d.author_name)}</div>
                      {d.author_name}
                    </span>
                    <span><MessageSquare size={12} /> {d.comment_count} replies</span>
                    <span><Clock size={12} /> {formatDate(d.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
