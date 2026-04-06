import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { notificationsAPI } from '../../services/api';
import { getInitials } from '../../utils/helpers';
import {
  Home, BookOpen, Calendar, MessageSquare, Search,
  Bell, Moon, Sun, LogOut, User, Menu, X, Sparkles
} from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (user) {
      notificationsAPI.getAll()
        .then(setNotifications)
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/notes', label: 'Notes', icon: BookOpen },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/forum', label: 'Forum', icon: MessageSquare },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/notes?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) { /* ignore */ }
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Sparkles size={20} />
          </div>
          <span className="logo-text">CampusFlow</span>
        </Link>

        {/* Nav Links — Desktop */}
        <div className="navbar-links">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Search */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search notes, events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Right Actions */}
        <div className="navbar-actions">
          <button className="action-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <div className="notif-wrapper" ref={notifRef}>
            <button className="action-btn" onClick={() => setShowNotifs(!showNotifs)}>
              <Bell size={20} />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>
            {showNotifs && (
              <div className="notif-dropdown animate-fade-in-down">
                <div className="notif-header">
                  <h4>Notifications</h4>
                  {unreadCount > 0 && (
                    <button className="mark-all-btn" onClick={handleMarkAllRead}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <p className="notif-empty">No notifications yet</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                        onClick={() => {
                          notificationsAPI.markRead(n.id);
                          setNotifications(prev =>
                            prev.map(x => x.id === n.id ? { ...x, is_read: 1 } : x)
                          );
                          if (n.link) navigate(n.link);
                          setShowNotifs(false);
                        }}
                      >
                        <div className="notif-dot" />
                        <div>
                          <p className="notif-title">{n.title}</p>
                          <p className="notif-msg">{n.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="profile-wrapper" ref={profileRef}>
            <button className="avatar-btn" onClick={() => setShowProfile(!showProfile)}>
              <div className="avatar-circle">
                {getInitials(user.name)}
              </div>
            </button>
            {showProfile && (
              <div className="profile-dropdown animate-fade-in-down">
                <div className="profile-header">
                  <div className="avatar-circle large">{getInitials(user.name)}</div>
                  <div>
                    <p className="profile-name">{user.name}</p>
                    <p className="profile-email">{user.email}</p>
                  </div>
                </div>
                <div className="profile-menu">
                  <Link to="/profile" className="profile-menu-item" onClick={() => setShowProfile(false)}>
                    <User size={16} /> My Profile
                  </Link>
                  <button className="profile-menu-item" onClick={() => { logout(); navigate('/login'); setShowProfile(false); }}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-btn" onClick={() => setShowMobile(!showMobile)}>
            {showMobile ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobile && (
        <div className="mobile-menu animate-fade-in-down">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`mobile-nav-link ${location.pathname === link.to ? 'active' : ''}`}
              onClick={() => setShowMobile(false)}
            >
              <link.icon size={20} />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
