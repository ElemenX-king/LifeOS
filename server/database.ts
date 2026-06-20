import initSqlJs, { type Database } from 'sql.js'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'lifeos.db')
let db: Database

export async function getDb(): Promise<Database> {
  if (db) return db
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  const SQL = await initSqlJs()
  db = fs.existsSync(DB_PATH) ? new SQL.Database(fs.readFileSync(DB_PATH)) : new SQL.Database()
  db.run('PRAGMA foreign_keys = ON')
  db.run(`CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0, priority TEXT NOT NULL DEFAULT 'medium', category TEXT NOT NULL DEFAULT 'other', date TEXT NOT NULL, dueDate TEXT, isImportant INTEGER NOT NULL DEFAULT 0, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL)`)
  db.run(`CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, parentId INTEGER, startDate TEXT NOT NULL, endDate TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'personal', target REAL, isArchived INTEGER NOT NULL DEFAULT 0, FOREIGN KEY (parentId) REFERENCES projects(id) ON DELETE CASCADE)`)
  db.run(`CREATE TABLE IF NOT EXISTS executions (id INTEGER PRIMARY KEY AUTOINCREMENT, subProjectId INTEGER NOT NULL, parentId INTEGER NOT NULL, name TEXT NOT NULL, target INTEGER NOT NULL, date TEXT NOT NULL, notes TEXT DEFAULT '', FOREIGN KEY (subProjectId) REFERENCES projects(id) ON DELETE CASCADE, FOREIGN KEY (parentId) REFERENCES projects(id) ON DELETE CASCADE)`)
  db.run(`CREATE TABLE IF NOT EXISTS habits (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'positive')`)
  db.run(`CREATE TABLE IF NOT EXISTS habit_records (id INTEGER PRIMARY KEY AUTOINCREMENT, habitId INTEGER NOT NULL, date TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'completed', FOREIGN KEY (habitId) REFERENCES habits(id) ON DELETE CASCADE)`)
  db.run(`CREATE TABLE IF NOT EXISTS daily_notes (date TEXT PRIMARY KEY, content TEXT NOT NULL DEFAULT '')`)
  setInterval(() => { try { fs.writeFileSync(DB_PATH, Buffer.from(db.export())) } catch {} }, 5000)
  return db
}

function save() { if (db) try { fs.writeFileSync(DB_PATH, Buffer.from(db.export())) } catch {} }

export function all(sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql); if (params.length) stmt.bind(params)
  const rows: any[] = []; while (stmt.step()) rows.push(stmt.getAsObject()); stmt.free(); return rows
}
export function first(sql: string, params: any[] = []): any {
  const stmt = db.prepare(sql); if (params.length) stmt.bind(params)
  const row = stmt.step() ? stmt.getAsObject() : null; stmt.free(); return row
}
export function run(sql: string, params: any[] = []) { db.run(sql, params); save() }
