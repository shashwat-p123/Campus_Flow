const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { summarizeNotes } = require('../services/gemini');

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/notes — List notes with filters
router.get('/', optionalAuth, (req, res) => {
  try {
    const { subject, branch, semester, search, sort } = req.query;
    let query = `
      SELECT n.*, u.name as uploader_name, u.avatar as uploader_avatar
      FROM notes n
      JOIN users u ON n.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (subject && subject !== 'All') {
      query += ' AND n.subject = ?';
      params.push(subject);
    }
    if (branch) {
      query += ' AND n.branch = ?';
      params.push(branch);
    }
    if (semester) {
      query += ' AND n.semester = ?';
      params.push(parseInt(semester));
    }
    if (search) {
      query += ' AND (n.title LIKE ? OR n.description LIKE ? OR n.subject LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (sort === 'popular') {
      query += ' ORDER BY n.views DESC';
    } else {
      query += ' ORDER BY n.created_at DESC';
    }

    const notes = db.prepare(query).all(...params);
    res.json(notes);
  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET /api/notes/:id — Single note
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const note = db.prepare(`
      SELECT n.*, u.name as uploader_name, u.avatar as uploader_avatar
      FROM notes n
      JOIN users u ON n.uploaded_by = u.id
      WHERE n.id = ?
    `).get(req.params.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Increment views
    db.prepare('UPDATE notes SET views = views + 1 WHERE id = ?').run(req.params.id);

    res.json(note);
  } catch (err) {
    console.error('Get note error:', err);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// POST /api/notes — Upload note
router.post('/', authenticateToken, upload.single('file'), (req, res) => {
  try {
    const { title, subject, branch, semester, description, file_type } = req.body;
    const file_url = req.file ? `/uploads/${req.file.filename}` : null;

    const result = db.prepare(`
      INSERT INTO notes (title, subject, branch, semester, file_url, file_type, description, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, subject, branch || null, semester ? parseInt(semester) : null, file_url, file_type || 'pdf', description || null, req.user.id);

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(note);
  } catch (err) {
    console.error('Upload note error:', err);
    res.status(500).json({ error: 'Failed to upload note' });
  }
});

// POST /api/notes/:id/summarize — AI summarization
router.post('/:id/summarize', authenticateToken, async (req, res) => {
  try {
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const content = note.description || note.title;
    const summary = await summarizeNotes(content);

    db.prepare('UPDATE notes SET summary = ? WHERE id = ?').run(summary, req.params.id);

    res.json({ summary });
  } catch (err) {
    console.error('Summarize error:', err);
    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(400).json({ error: 'Gemini API key not configured. Add it in server/.env' });
    }
    res.status(500).json({ error: 'Failed to summarize' });
  }
});

// DELETE /api/notes/:id
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    if (note.uploaded_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;
