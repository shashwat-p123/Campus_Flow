const express = require('express');
const db = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { improveDescription } = require('../services/gemini');

const router = express.Router();

// GET /api/events
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, search } = req.query;
    let query = `
      SELECT e.*, u.name as creator_name,
        (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id) as rsvp_count
      FROM events e
      JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'all') {
      query += ' AND e.category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (e.title LIKE ? OR e.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY e.date DESC';
    const events = db.prepare(query).all(...params);

    // Get user RSVP status if authenticated
    if (req.user) {
      const rsvps = db.prepare('SELECT event_id, status FROM event_rsvps WHERE user_id = ?').all(req.user.id);
      const rsvpMap = {};
      rsvps.forEach(r => rsvpMap[r.event_id] = r.status);
      events.forEach(e => e.user_rsvp = rsvpMap[e.id] || null);
    }

    res.json(events);
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const event = db.prepare(`
      SELECT e.*, u.name as creator_name,
        (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id) as rsvp_count
      FROM events e
      JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `).get(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.user) {
      const rsvp = db.prepare('SELECT status FROM event_rsvps WHERE event_id = ? AND user_id = ?').get(event.id, req.user.id);
      event.user_rsvp = rsvp?.status || null;
    }

    res.json(event);
  } catch (err) {
    console.error('Get event error:', err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST /api/events
router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, description, date, location, category, is_featured } = req.body;
    const result = db.prepare(`
      INSERT INTO events (title, description, date, location, category, is_featured, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, date, location, category || 'workshop', is_featured ? 1 : 0, req.user.id);

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(event);
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// POST /api/events/:id/rsvp
router.post('/:id/rsvp', authenticateToken, (req, res) => {
  try {
    const { status } = req.body; // 'going' | 'interested' | 'none'
    const eventId = parseInt(req.params.id);

    if (status === 'none') {
      db.prepare('DELETE FROM event_rsvps WHERE event_id = ? AND user_id = ?').run(eventId, req.user.id);
    } else {
      db.prepare(`
        INSERT INTO event_rsvps (event_id, user_id, status) VALUES (?, ?, ?)
        ON CONFLICT(event_id, user_id) DO UPDATE SET status = ?
      `).run(eventId, req.user.id, status, status);
    }

    const count = db.prepare('SELECT COUNT(*) as count FROM event_rsvps WHERE event_id = ?').get(eventId);
    res.json({ status, rsvp_count: count.count });
  } catch (err) {
    console.error('RSVP error:', err);
    res.status(500).json({ error: 'Failed to update RSVP' });
  }
});

// POST /api/events/:id/improve
router.post('/:id/improve', authenticateToken, async (req, res) => {
  try {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const improved = await improveDescription(event.description || event.title);
    db.prepare('UPDATE events SET description = ? WHERE id = ?').run(improved, req.params.id);
    res.json({ description: improved });
  } catch (err) {
    console.error('Improve description error:', err);
    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(400).json({ error: 'Gemini API key not configured' });
    }
    res.status(500).json({ error: 'Failed to improve description' });
  }
});

module.exports = router;
