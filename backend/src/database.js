
const Database = require("better-sqlite3");
const path = require("path");

// Create or connect to the SQLite database
const db = new Database(
  path.join(__dirname, "../quiz.db")
);

// Enable foreign key relationships
db.pragma("foreign_keys = ON");

// Create the database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    participant_name TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    selected_answer TEXT NOT NULL,
    FOREIGN KEY (participant_id) REFERENCES participants(id)
      ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id)
      ON DELETE CASCADE
  );
`);

console.log("Database connected successfully!");
console.log("Database tables created successfully!");

module.exports = db;
