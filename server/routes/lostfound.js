const express = require('express');
const db = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { generateDescription } = require('../services/gemini');

const router = express.Router();

// GET /api/lostfound
router.get('/', optionalAuth, (req, res) => {
  try {
    const { type, status, search } = req.query;
    let query = `
      SELECT lf.*, u.name as poster_name, u.avatar as poster_avatar
      FROM lost_found lf
      JOIN users u ON lf.posted_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (type && type !== 'all') {
      query += ' AND lf.type = ?';
      params.push(type);
    }
    if (status && status !== 'all') {
      query += ' AND lf.status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (lf.title LIKE ? OR lf.description LIKE ? OR lf.location LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY lf.created_at DESC';
    const items = db.prepare(query).all(...params);
    res.json(items);
  } catch (err) {
    console.error('Get lost/found error:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// POST /api/lostfound
router.post('/', authenticateToken, (req, res) => {
  try {
    const { type, title, description, image_url, location } = req.body;
    const result = db.prepare(`
      INSERT INTO lost_found (type, title, description, image_url, location, posted_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(type, title, description, image_url || null, location || null, req.user.id);

    const item = db.prepare(`
      SELECT lf.*, u.name as poster_name
      FROM lost_found lf JOIN users u ON lf.posted_by = u.id
      WHERE lf.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(item);
  } catch (err) {
    console.error('Create lost/found error:', err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PATCH /api/lostfound/:id/status
router.patch('/:id/status', authenticateToken, (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE lost_found SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: 'Status updated', status });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/lostfound/generate-description
router.post('/generate-description', authenticateToken, async (req, res) => {
  try {
    const { rough_input } = req.body;
    const description = await generateDescription(rough_input);
    res.json({ description });
  } catch (err) {
    console.error('Generate description error:', err);
    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(400).json({ error: 'Gemini API key not configured' });
    }
    res.status(500).json({ error: 'Failed to generate description' });
  }
});

module.exports = router;
