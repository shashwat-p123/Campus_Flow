import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, BookOpen, Calendar, MessageSquare, User } from 'lucide-react';
import './BottomNav.css';

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const links = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/notes', label: 'Notes', icon: BookOpen },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/forum', label: 'Forum', icon: MessageSquare },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="bottom-nav">
      {links.map(link => {
        const isActive = link.to === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(link.to);
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <link.icon size={22} fill={isActive ? 'currentColor' : 'none'} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
