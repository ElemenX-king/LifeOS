import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'lifeos.db')
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'medium',
    category TEXT NOT NULL DEFAULT 'other',
    date TEXT NOT NULL,
    dueDate TEXT,
    isImportant INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parentId INTEGER, startDate TEXT NOT NULL, endDate TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'personal', target REAL, isArchived INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (parentId) REFERENCES projects(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subProjectId INTEGER NOT NULL, parentId INTEGER NOT NULL,
    name TEXT NOT NULL, target INTEGER NOT NULL, date TEXT NOT NULL, notes TEXT DEFAULT '',
    FOREIGN KEY (subProjectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parentId) REFERENCES projects(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'positive'
  );
  CREATE TABLE IF NOT EXISTS habit_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habitId INTEGER NOT NULL, date TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'completed',
    FOREIGN KEY (habitId) REFERENCES habits(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS daily_notes (
    date TEXT PRIMARY KEY,
    content TEXT NOT NULL DEFAULT ''
  );
`)

export default db
