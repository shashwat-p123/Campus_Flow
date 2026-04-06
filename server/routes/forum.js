const express = require('express');
const db = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { explainAnswer } = require('../services/gemini');

const router = express.Router();

// GET /api/forum — List discussions
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, sort, search } = req.query;
    let query = `
      SELECT d.*, u.name as author_name, u.avatar as author_avatar
      FROM discussions d
      JOIN users u ON d.posted_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'all') {
      query += ' AND d.category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (d.title LIKE ? OR d.content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (sort === 'popular') {
      query += ' ORDER BY d.upvotes DESC';
    } else {
      query += ' ORDER BY d.created_at DESC';
    }

    const discussions = db.prepare(query).all(...params);

    // Parse tags JSON
    discussions.forEach(d => {
      try { d.tags = JSON.parse(d.tags || '[]'); } catch { d.tags = []; }
    });

    // Get user votes if authenticated
    if (req.user) {
      const votes = db.prepare("SELECT target_id, value FROM votes WHERE user_id = ? AND target_type = 'discussion'").all(req.user.id);
      const voteMap = {};
      votes.forEach(v => voteMap[v.target_id] = v.value);
      discussions.forEach(d => d.user_vote = voteMap[d.id] || 0);
    }

    res.json(discussions);
  } catch (err) {
    console.error('Get discussions error:', err);
    res.status(500).json({ error: 'Failed to fetch discussions' });
  }
});

// GET /api/forum/:id — Single discussion with replies
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const discussion = db.prepare(`
      SELECT d.*, u.name as author_name, u.avatar as author_avatar
      FROM discussions d
      JOIN users u ON d.posted_by = u.id
      WHERE d.id = ?
    `).get(req.params.id);

    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    try { discussion.tags = JSON.parse(discussion.tags || '[]'); } catch { discussion.tags = []; }

    const replies = db.prepare(`
      SELECT r.*, u.name as author_name, u.avatar as author_avatar
      FROM replies r
      JOIN users u ON r.posted_by = u.id
      WHERE r.discussion_id = ?
      ORDER BY r.upvotes DESC, r.created_at ASC
    `).all(req.params.id);

    if (req.user) {
      const dVote = db.prepare("SELECT value FROM votes WHERE user_id = ? AND target_type = 'discussion' AND target_id = ?").get(req.user.id, discussion.id);
      discussion.user_vote = dVote?.value || 0;

      const rVotes = db.prepare("SELECT target_id, value FROM votes WHERE user_id = ? AND target_type = 'reply'").all(req.user.id);
      const rVoteMap = {};
      rVotes.forEach(v => rVoteMap[v.target_id] = v.value);
      replies.forEach(r => r.user_vote = rVoteMap[r.id] || 0);
    }

    res.json({ ...discussion, replies });
  } catch (err) {
    console.error('Get discussion error:', err);
    res.status(500).json({ error: 'Failed to fetch discussion' });
  }
});

// POST /api/forum — Create discussion
router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const tagsJson = JSON.stringify(tags || []);

    const result = db.prepare(`
      INSERT INTO discussions (title, content, category, tags, posted_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(title, content, category || 'general', tagsJson, req.user.id);

    const discussion = db.prepare(`
      SELECT d.*, u.name as author_name
      FROM discussions d JOIN users u ON d.posted_by = u.id
      WHERE d.id = ?
    `).get(result.lastInsertRowid);
    try { discussion.tags = JSON.parse(discussion.tags || '[]'); } catch { discussion.tags = []; }

    res.status(201).json(discussion);
  } catch (err) {
    console.error('Create discussion error:', err);
    res.status(500).json({ error: 'Failed to create discussion' });
  }
});

// POST /api/forum/:id/reply
router.post('/:id/reply', authenticateToken, (req, res) => {
  try {
    const { content } = req.body;
    const discussionId = parseInt(req.params.id);

    const result = db.prepare('INSERT INTO replies (discussion_id, content, posted_by) VALUES (?, ?, ?)').run(discussionId, content, req.user.id);

    db.prepare('UPDATE discussions SET comment_count = comment_count + 1 WHERE id = ?').run(discussionId);

    const reply = db.prepare(`
      SELECT r.*, u.name as author_name, u.avatar as author_avatar
      FROM replies r JOIN users u ON r.posted_by = u.id
      WHERE r.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(reply);
  } catch (err) {
    console.error('Create reply error:', err);
    res.status(500).json({ error: 'Failed to create reply' });
  }
});

// POST /api/forum/:id/vote
router.post('/:id/vote', authenticateToken, (req, res) => {
  try {
    const { target_type, value } = req.body; // target_type: 'discussion' | 'reply', value: 1 | -1
    const targetId = parseInt(req.params.id);

    const existing = db.prepare('SELECT * FROM votes WHERE user_id = ? AND target_type = ? AND target_id = ?').get(req.user.id, target_type, targetId);

    if (existing) {
      if (existing.value === value) {
        // Remove vote
        db.prepare('DELETE FROM votes WHERE id = ?').run(existing.id);
        const col = target_type === 'discussion' ? 'discussions' : 'replies';
        db.prepare(`UPDATE ${col} SET upvotes = upvotes - ? WHERE id = ?`).run(value, targetId);
        return res.json({ vote: 0 });
      } else {
        // Change vote
        db.prepare('UPDATE votes SET value = ? WHERE id = ?').run(value, existing.id);
        const col = target_type === 'discussion' ? 'discussions' : 'replies';
        db.prepare(`UPDATE ${col} SET upvotes = upvotes + ? WHERE id = ?`).run(value * 2, targetId);
        return res.json({ vote: value });
      }
    } else {
      db.prepare('INSERT INTO votes (user_id, target_type, target_id, value) VALUES (?, ?, ?, ?)').run(req.user.id, target_type, targetId, value);
      const col = target_type === 'discussion' ? 'discussions' : 'replies';
      db.prepare(`UPDATE ${col} SET upvotes = upvotes + ? WHERE id = ?`).run(value, targetId);
      return res.json({ vote: value });
    }
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// POST /api/forum/explain
router.post('/explain', authenticateToken, async (req, res) => {
  try {
    const { question, answer } = req.body;
    const explanation = await explainAnswer(question, answer);
    res.json({ explanation });
  } catch (err) {
    console.error('Explain error:', err);
    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(400).json({ error: 'Gemini API key not configured' });
    }
    res.status(500).json({ error: 'Failed to explain' });
  }
});

module.exports = router;
