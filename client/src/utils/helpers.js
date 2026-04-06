export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatEventDate(dateStr) {
  const date = new Date(dateStr);
  return {
    day: date.getDate(),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    full: date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
  };
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function getSubjectColor(subject) {
  const colors = {
    'Physics': '#8B5CF6',
    'Mathematics': '#3B82F6',
    'Computer Science': '#10B981',
    'Literature': '#F59E0B',
    'Chemistry': '#EF4444',
    'System Design': '#EC4899',
  };
  return colors[subject] || '#6B7280';
}

export function getCategoryColor(category) {
  const colors = {
    'academic': { bg: 'rgba(91,79,230,0.1)', color: '#5B4FE6' },
    'clubs': { bg: 'rgba(45,212,168,0.1)', color: '#2DD4A8' },
    'general': { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
    'career': { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6' },
    'social': { bg: 'rgba(236,72,153,0.1)', color: '#EC4899' },
    'workshop': { bg: 'rgba(139,92,246,0.1)', color: '#8B5CF6' },
    'conference': { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' },
    'seminar': { bg: 'rgba(20,184,166,0.1)', color: '#14B8A6' },
  };
  return colors[category] || colors['general'];
}

export function truncate(str, length = 100) {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '...' : str;
}
