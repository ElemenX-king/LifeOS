import express from 'express'
import cors from 'cors'
import path from 'path'
import db from './database'

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(process.cwd(), 'dist')))

// TODOS
app.get('/api/todos', (_req, res) => res.json(db.prepare('SELECT * FROM todos ORDER BY date, createdAt').all()))
app.get('/api/todos/important', (_req, res) => res.json(db.prepare('SELECT * FROM todos WHERE isImportant=1 ORDER BY date').all()))
app.post('/api/todos', (req, res) => {
  const { title, priority, date, dueDate, isImportant } = req.body
  const now = Date.now()
  const r = db.prepare('INSERT INTO todos (title,completed,priority,category,date,dueDate,isImportant,createdAt,updatedAt) VALUES (?,0,?,?,?,?,?,?,?)').run(title, priority||'medium', 'other', date, dueDate||null, isImportant?1:0, now, now)
  res.status(201).json(db.prepare('SELECT * FROM todos WHERE id=?').get(r.lastInsertRowid))
})
app.patch('/api/todos/:id/toggle', (req, res) => {
  const t = db.prepare('SELECT * FROM todos WHERE id=?').get(req.params.id) as any
  if (!t) return res.status(404).json({ error: 'Not found' })
  db.prepare('UPDATE todos SET completed=?,updatedAt=? WHERE id=?').run(t.completed?0:1, Date.now(), req.params.id)
  res.json(db.prepare('SELECT * FROM todos WHERE id=?').get(req.params.id))
})
app.patch('/api/todos/:id', (req, res) => {
  const { title, priority, date, dueDate, isImportant, completed } = req.body
  const f: string[] = []; const v: any[] = []
  if (title !== undefined) { f.push('title=?'); v.push(title) }
  if (priority !== undefined) { f.push('priority=?'); v.push(priority) }
  if (date !== undefined) { f.push('date=?'); v.push(date) }
  if (dueDate !== undefined) { f.push('dueDate=?'); v.push(dueDate) }
  if (isImportant !== undefined) { f.push('isImportant=?'); v.push(isImportant?1:0) }
  if (completed !== undefined) { f.push('completed=?'); v.push(completed?1:0) }
  if (!f.length) return res.json(db.prepare('SELECT * FROM todos WHERE id=?').get(req.params.id))
  f.push('updatedAt=?'); v.push(Date.now()); v.push(req.params.id)
  db.prepare(`UPDATE todos SET ${f.join(',')} WHERE id=?`).run(...v)
  res.json(db.prepare('SELECT * FROM todos WHERE id=?').get(req.params.id))
})
app.delete('/api/todos/:id', (req, res) => { db.prepare('DELETE FROM todos WHERE id=?').run(req.params.id); res.json({ ok: true }) })

// PROJECTS
app.get('/api/projects', (_req, res) => res.json(db.prepare('SELECT * FROM projects ORDER BY startDate').all()))
app.post('/api/projects', (req, res) => {
  const { name, parentId, startDate, endDate, type, target } = req.body
  const r = db.prepare('INSERT INTO projects (name,parentId,startDate,endDate,type,target,isArchived) VALUES (?,?,?,?,?,?,0)').run(name, parentId||null, startDate, endDate, type||'personal', target||null)
  res.status(201).json(db.prepare('SELECT * FROM projects WHERE id=?').get(r.lastInsertRowid))
})
app.patch('/api/projects/:id', (req, res) => {
  const { name, target, startDate, endDate } = req.body
  const f: string[] = []; const v: any[] = []
  if (name !== undefined) { f.push('name=?'); v.push(name) }
  if (target !== undefined) { f.push('target=?'); v.push(target) }
  if (startDate !== undefined) { f.push('startDate=?'); v.push(startDate) }
  if (endDate !== undefined) { f.push('endDate=?'); v.push(endDate) }
  if (!f.length) return res.json(db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id))
  v.push(req.params.id)
  db.prepare(`UPDATE projects SET ${f.join(',')} WHERE id=?`).run(...v)
  res.json(db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id))
})
app.delete('/api/projects/:id', (req, res) => { db.prepare('DELETE FROM projects WHERE id=?').run(req.params.id); res.json({ ok: true }) })
app.patch('/api/projects/:id/archive', (req, res) => {
  const p = db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id) as any
  if (!p) return res.status(404).json({ error: 'Not found' })
  db.prepare('UPDATE projects SET isArchived=? WHERE id=?').run(p.isArchived?0:1, req.params.id)
  res.json(db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id))
})

// EXECUTIONS
app.get('/api/executions', (_req, res) => res.json(db.prepare('SELECT * FROM executions ORDER BY date DESC').all()))
app.post('/api/executions', (req, res) => {
  const r = db.prepare('INSERT INTO executions (subProjectId,parentId,name,target,date,notes) VALUES (?,?,?,?,?,?)').run(req.body.subProjectId, req.body.parentId, req.body.name, req.body.target, req.body.date, req.body.notes||'')
  res.status(201).json(db.prepare('SELECT * FROM executions WHERE id=?').get(r.lastInsertRowid))
})
app.delete('/api/executions/:id', (req, res) => { db.prepare('DELETE FROM executions WHERE id=?').run(req.params.id); res.json({ ok: true }) })

// HABITS
app.get('/api/habits', (_req, res) => res.json(db.prepare('SELECT * FROM habits').all()))
app.post('/api/habits', (req, res) => {
  const r = db.prepare('INSERT INTO habits (name,type) VALUES (?,?)').run(req.body.name, req.body.type||'positive')
  res.status(201).json(db.prepare('SELECT * FROM habits WHERE id=?').get(r.lastInsertRowid))
})
app.delete('/api/habits/:id', (req, res) => { db.prepare('DELETE FROM habits WHERE id=?').run(req.params.id); res.json({ ok: true }) })

// HABIT RECORDS
app.get('/api/habit-records', (req, res) => {
  const { year, month } = req.query
  if (year && month) {
    const prefix = `${year}-${String(Number(month)+1).padStart(2,'0')}`
    return res.json(db.prepare('SELECT * FROM habit_records WHERE date LIKE ?').all(`${prefix}%`))
  }
  res.json(db.prepare('SELECT * FROM habit_records').all())
})
app.get('/api/habit-records/today', (_req, res) => {
  const today = new Date().toISOString().slice(0,10)
  res.json(db.prepare('SELECT * FROM habit_records WHERE date=?').all(today))
})
app.patch('/api/habit-records/:habitId/toggle', (req, res) => {
  const today = new Date().toISOString().slice(0,10)
  const rec = db.prepare('SELECT * FROM habit_records WHERE habitId=? AND date=?').get(req.params.habitId, today) as any
  if (rec) { db.prepare('DELETE FROM habit_records WHERE id=?').run(rec.id); res.json({ toggled: false }) }
  else {
    const r = db.prepare('INSERT INTO habit_records (habitId,date,status) VALUES (?,?,?)').run(req.params.habitId, today, 'completed')
    res.json({ toggled: true, record: db.prepare('SELECT * FROM habit_records WHERE id=?').get(r.lastInsertRowid) })
  }
})

// JOURNAL
app.get('/api/journal/:date', (req, res) => {
  const note = db.prepare('SELECT * FROM daily_notes WHERE date=?').get(req.params.date) as any
  res.json({ content: note?.content || '' })
})
app.put('/api/journal/:date', (req, res) => {
  db.prepare('INSERT OR REPLACE INTO daily_notes (date, content) VALUES (?, ?)').run(req.params.date, req.body.content || '')
  res.json({ ok: true })
})

// SPA fallback
app.get('/{*splat}', (_req, res) => res.sendFile(path.join(process.cwd(), 'dist', 'index.html')))

// 清理旧种子数据（只运行一次）
const count = db.prepare('SELECT COUNT(*) as c FROM todos').get() as any
if (count.c > 0 && db.prepare("SELECT COUNT(*) as c FROM todos WHERE title='完成 Q2 产品报告'").get() as any) {
  db.exec("DELETE FROM todos; DELETE FROM projects; DELETE FROM executions; VACUUM;")
}

app.listen(process.env.PORT || 3000, () => console.log('🚀 LifeOS on :' + (process.env.PORT || 3000)))
