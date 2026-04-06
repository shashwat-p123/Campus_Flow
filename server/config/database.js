const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'campusflow.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      branch TEXT,
      semester INTEGER,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      branch TEXT,
      semester INTEGER,
      file_url TEXT,
      file_type TEXT,
      description TEXT,
      summary TEXT,
      uploaded_by INTEGER REFERENCES users(id),
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      date DATETIME NOT NULL,
      end_date DATETIME,
      location TEXT,
      image_url TEXT,
      category TEXT DEFAULT 'workshop',
      is_featured BOOLEAN DEFAULT 0,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS event_rsvps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER REFERENCES events(id),
      user_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'interested',
      UNIQUE(event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS lost_found (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      location TEXT,
      status TEXT DEFAULT 'active',
      posted_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS discussions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT DEFAULT 'general',
      tags TEXT,
      image_url TEXT,
      upvotes INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      posted_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discussion_id INTEGER REFERENCES discussions(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      upvotes INTEGER DEFAULT 0,
      posted_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      target_type TEXT,
      target_id INTEGER,
      value INTEGER,
      UNIQUE(user_id, target_type, target_id)
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      target_type TEXT,
      target_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, target_type, target_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      type TEXT,
      title TEXT,
      message TEXT,
      link TEXT,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed data if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  const hashedPassword = bcrypt.hashSync('password123', 10);

  // Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, branch, semester, avatar) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('Alex Rivera', 'alex@university.edu', hashedPassword, 'student', 'Computer Science', 5, null);
  insertUser.run('Sarah Chen', 'sarah@university.edu', hashedPassword, 'student', 'Physics', 3, null);
  insertUser.run('Marcus Johnson', 'marcus@university.edu', hashedPassword, 'admin', 'Mathematics', 7, null);
  insertUser.run('Priya Sharma', 'priya@university.edu', hashedPassword, 'student', 'Literature', 4, null);
  insertUser.run('James Wilson', 'james@university.edu', hashedPassword, 'student', 'System Design', 6, null);

  // Notes
  const insertNote = db.prepare(`
    INSERT INTO notes (title, subject, branch, semester, file_type, description, summary, uploaded_by, views, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertNote.run(
    'Quantum Mechanics: Foundations & Logic', 'Physics', 'Physics', 3, 'pdf',
    'Comprehensive notes covering Schrödinger\'s equation, particle duality, and the uncertainty principle with detailed mathematical derivations.',
    'Key Topics:\n• Wave-particle duality and de Broglie wavelength\n• Schrödinger equation (time-dependent & independent)\n• Heisenberg uncertainty principle\n• Quantum superposition and measurement\n• Simple harmonic oscillator in QM',
    2, 342, '2023-10-12T10:00:00'
  );

  insertNote.run(
    'Linear Algebra: Eigenvectors', 'Mathematics', 'Mathematics', 3, 'pdf',
    'Finding eigenvalues and eigenvectors for 3×3 matrices with practical applications in ML.',
    null, 3, 189, '2023-10-10T14:00:00'
  );

  insertNote.run(
    'Microservices Architecture', 'System Design', 'Computer Science', 5, 'pdf',
    'Service discovery, API Gateway, and inter-service communication patterns.',
    null, 5, 256, '2023-10-08T09:00:00'
  );

  insertNote.run(
    'Post-Modernist Critique', 'Literature', 'Literature', 4, 'pdf',
    'Exploring the fragmented narratives in late 20th-century American novels and their impact...',
    null, 4, 98, '2023-10-05T16:00:00'
  );

  insertNote.run(
    'Data Structures & Algorithms', 'Computer Science', 'Computer Science', 3, 'pdf',
    'Complete guide to trees, graphs, dynamic programming, and greedy algorithms with code examples.',
    null, 1, 412, '2023-10-03T11:00:00'
  );

  insertNote.run(
    'Organic Chemistry Reactions', 'Chemistry', 'Chemistry', 4, 'pdf',
    'Summary of all major organic reaction mechanisms including SN1, SN2, E1, E2 with practice problems.',
    null, 2, 167, '2023-10-01T08:00:00'
  );

  // Events
  const insertEvent = db.prepare(`
    INSERT INTO events (title, description, date, location, category, is_featured, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEvent.run(
    'Annual Tech & Innovation Summit 2024',
    'Engage with industry leaders and explore the future of AI, robotics, and sustainable engineering. Keynote speakers from Google, Tesla, and MIT.',
    '2024-10-12T18:00:00', 'Main Auditorium', 'conference', 1, 3, '2023-09-15T10:00:00'
  );

  insertEvent.run(
    'Tech Career Fair 2023',
    'Meet recruiters from top tech companies. Bring your resume and portfolio.',
    '2023-09-21T09:00:00', 'Main Hall', 'career', 0, 3, '2023-09-01T10:00:00'
  );

  insertEvent.run(
    'Hackathon Prep Talk',
    'Learn tips and strategies for upcoming hackathons. Team formation and ideation workshop.',
    '2023-09-24T14:00:00', 'Zoom Online', 'workshop', 0, 1, '2023-09-10T10:00:00'
  );

  insertEvent.run(
    'Ethics in AI Seminar',
    'Discussion on responsible AI development, bias in algorithms, and the future of AI governance.',
    '2023-10-02T10:00:00', 'Lab 402', 'seminar', 0, 3, '2023-09-20T10:00:00'
  );

  insertEvent.run(
    'Sustainable Fashion Show',
    'Student-designed sustainable fashion showcase. Support eco-friendly campus initiatives.',
    '2023-10-14T17:00:00', 'Main Quad', 'social', 0, 4, '2023-09-25T10:00:00'
  );

  insertEvent.run(
    'Career Networking Mixer',
    'Network with alumni and industry professionals. Limited spots available.',
    '2023-10-15T18:00:00', 'Student Union 204', 'career', 0, 3, '2023-09-28T10:00:00'
  );

  insertEvent.run(
    'UX Design Workshop',
    'Hands-on workshop on user research, wireframing, and prototyping with Figma.',
    '2023-10-18T14:00:00', 'Design Lab B', 'workshop', 0, 1, '2023-10-01T10:00:00'
  );

  insertEvent.run(
    'Creative Writing Circle',
    'Weekly creative writing meetup. Share your work and get constructive feedback.',
    '2023-10-21T16:00:00', 'Library Hall', 'social', 0, 4, '2023-10-05T10:00:00'
  );

  insertEvent.run(
    'Friday Night Social',
    'Unwind after a long week of classes. Games, music, and free pizza!',
    '2023-10-25T19:00:00', 'The Commons', 'social', 0, 1, '2023-10-10T10:00:00'
  );

  // Lost & Found
  const insertLF = db.prepare(`
    INSERT INTO lost_found (type, title, description, location, status, posted_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertLF.run('lost', 'Blue Hydroflask Water Bottle', 'Navy blue 32oz Hydroflask with stickers. Lost somewhere between the library and science building.', 'Library / Science Building', 'active', 1, '2023-10-11T14:00:00');
  insertLF.run('found', 'AirPods Pro Case', 'Found a white AirPods Pro case near the cafeteria entrance. Has a small scratch on the back.', 'Cafeteria Entrance', 'active', 2, '2023-10-10T09:00:00');
  insertLF.run('lost', 'TI-84 Calculator', 'Black TI-84 Plus CE calculator. Has my name "Marcus J" etched on the back. Desperately need for midterms!', 'Math Building Room 201', 'active', 3, '2023-10-09T16:00:00');
  insertLF.run('found', 'Student ID Card', 'Found a student ID card for someone in the CS department near the parking lot.', 'Parking Lot B', 'claimed', 5, '2023-10-08T11:00:00');
  insertLF.run('lost', 'Black Northface Backpack', 'Contains my laptop, charger, and notebook. Last seen in the common area of Building C.', 'Building C Common Area', 'active', 4, '2023-10-07T15:00:00');

  // Discussions
  const insertDiscussion = db.prepare(`
    INSERT INTO discussions (title, content, category, tags, upvotes, comment_count, posted_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDiscussion.run(
    'Best resources for learning Distributed Systems in 2024?',
    'I\'m struggling with consensus algorithms and vector clocks. Does anyone have a "ELI5" recommendation for the Paxos algorithm or good resources for learning distributed systems from scratch?',
    'academic', '["DistributedSystems","CS","Resources"]', 242, 48, 1, '2023-10-12T08:00:00'
  );

  insertDiscussion.run(
    'Best study spots with late-night coffee on campus?',
    'Looking for places that are open past 10 PM where I can study and grab a decent coffee. The main library closes too early for my taste.',
    'general', '["CampusLife","Study","Coffee"]', 89, 12, 4, '2023-10-12T04:00:00'
  );

  insertDiscussion.run(
    'Should the library be open 24/7 during finals?',
    'The Student Council is proposing a vote for 24-hour access during the two-week finals window. What are your thoughts on safety and staffing?',
    'general', '["FinalsWeek","Library","StudentCouncil"]', 356, 124, 3, '2023-10-11T12:00:00'
  );

  insertDiscussion.run(
    'Off-campus roommate finder for Spring',
    'Anyone looking for a roommate near campus for the spring semester? I have a 2BR apartment and need someone to split rent.',
    'general', '["Housing","Roommate","Spring"]', 45, 89, 2, '2023-10-10T18:00:00'
  );

  insertDiscussion.run(
    'Hardest courses in the Computer Science major?',
    'Rising juniors — what CS courses should I be most prepared for? I\'ve heard Operating Systems and Compilers are brutal.',
    'academic', '["CS","CourseAdvice","Academic"]', 178, 210, 5, '2023-10-09T22:00:00'
  );

  // Replies for first discussion
  const insertReply = db.prepare(`
    INSERT INTO replies (discussion_id, content, upvotes, posted_by, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertReply.run(1, 'Check out "Distributed Systems for Fun and Profit". It\'s a free online book that breaks down Paxos beautifully compared to the original whitepaper.', 12, 5, '2023-10-12T10:00:00');
  insertReply.run(1, 'Martin Kleppmann\'s "Designing Data-Intensive Applications" is the gold standard. Start with chapters 5-9 for consensus and replication.', 28, 3, '2023-10-12T10:30:00');
  insertReply.run(1, 'MIT 6.824 lecture videos are free on YouTube. They walk through Raft which is much easier to understand than Paxos.', 19, 2, '2023-10-12T11:00:00');

  // Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run(1, 'new_note', 'New Notes Available', '2 new notes shared in Advanced Economics', '/notes', 0, '2023-10-12T08:00:00');
  insertNotif.run(1, 'reply', 'New Reply', 'u/tech_wiz replied to your discussion about Distributed Systems', '/forum/1', 0, '2023-10-12T10:00:00');
  insertNotif.run(1, 'event_reminder', 'Event Tomorrow', 'Tech Career Fair 2023 is happening tomorrow at Main Hall', '/events', 1, '2023-10-11T18:00:00');
  insertNotif.run(1, 'reply', 'New Reply', 'Marcus commented on "Should the library be open 24/7?"', '/forum/3', 0, '2023-10-11T13:00:00');
}

initializeDatabase();

module.exports = db;
