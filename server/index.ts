import express from 'express'
import cors from 'cors'
import path from 'path'
import { getDb, all, first, run } from './database'

const app = express()
app.use(cors()); app.use(express.json()); app.use(express.static(path.join(process.cwd(), 'dist')))

// TODOS
app.get('/api/todos', async (_req, res) => { await getDb(); res.json(all('SELECT * FROM todos ORDER BY date, createdAt')) })
app.get('/api/todos/important', async (_req, res) => { await getDb(); res.json(all('SELECT * FROM todos WHERE isImportant=1 ORDER BY date')) })
app.post('/api/todos', async (req, res) => {
  await getDb(); const { title, priority, date, dueDate, isImportant } = req.body; const now = Date.now()
  run('INSERT INTO todos (title,completed,priority,category,date,dueDate,isImportant,createdAt,updatedAt) VALUES (?,0,?,?,?,?,?,?,?)', [title, priority||'medium', 'other', date, dueDate||null, isImportant?1:0, now, now])
  res.status(201).json(first('SELECT * FROM todos ORDER BY id DESC LIMIT 1'))
})
app.patch('/api/todos/:id/toggle', async (req, res) => {
  await getDb(); const t = first('SELECT * FROM todos WHERE id=?', [req.params.id]) as any
  if (!t) return res.status(404).json({ error: 'Not found' })
  run('UPDATE todos SET completed=?,updatedAt=? WHERE id=?', [t.completed?0:1, Date.now(), req.params.id])
  res.json(first('SELECT * FROM todos WHERE id=?', [req.params.id]))
})
app.patch('/api/todos/:id', async (req, res) => {
  await getDb(); const { title, priority, date, dueDate, isImportant, completed } = req.body
  const f: string[] = []; const v: any[] = []
  if (title !== undefined) { f.push('title=?'); v.push(title) }
  if (priority !== undefined) { f.push('priority=?'); v.push(priority) }
  if (date !== undefined) { f.push('date=?'); v.push(date) }
  if (dueDate !== undefined) { f.push('dueDate=?'); v.push(dueDate) }
  if (isImportant !== undefined) { f.push('isImportant=?'); v.push(isImportant?1:0) }
  if (completed !== undefined) { f.push('completed=?'); v.push(completed?1:0) }
  if (!f.length) return res.json(first('SELECT * FROM todos WHERE id=?', [req.params.id]))
  f.push('updatedAt=?'); v.push(Date.now()); v.push(req.params.id)
  run(`UPDATE todos SET ${f.join(',')} WHERE id=?`, v)
  res.json(first('SELECT * FROM todos WHERE id=?', [req.params.id]))
})
app.delete('/api/todos/:id', async (req, res) => { await getDb(); run('DELETE FROM todos WHERE id=?', [req.params.id]); res.json({ ok: true }) })

// PROJECTS
app.get('/api/projects', async (_req, res) => { await getDb(); res.json(all('SELECT * FROM projects ORDER BY startDate')) })
app.post('/api/projects', async (req, res) => {
  await getDb(); const { name, parentId, startDate, endDate, type, target } = req.body
  run('INSERT INTO projects (name,parentId,startDate,endDate,type,target,isArchived) VALUES (?,?,?,?,?,?,0)', [name, parentId||null, startDate, endDate, type||'personal', target||null])
  res.status(201).json(first('SELECT * FROM projects ORDER BY id DESC LIMIT 1'))
})
app.patch('/api/projects/:id', async (req, res) => {
  await getDb(); const { name, target, startDate, endDate } = req.body
  const f: string[] = []; const v: any[] = []
  if (name !== undefined) { f.push('name=?'); v.push(name) }
  if (target !== undefined) { f.push('target=?'); v.push(target) }
  if (startDate !== undefined) { f.push('startDate=?'); v.push(startDate) }
  if (endDate !== undefined) { f.push('endDate=?'); v.push(endDate) }
  if (!f.length) return res.json(first('SELECT * FROM projects WHERE id=?', [req.params.id]))
  v.push(req.params.id); run(`UPDATE projects SET ${f.join(',')} WHERE id=?`, v)
  res.json(first('SELECT * FROM projects WHERE id=?', [req.params.id]))
})
app.delete('/api/projects/:id', async (req, res) => { await getDb(); run('DELETE FROM projects WHERE id=?', [req.params.id]); res.json({ ok: true }) })
app.patch('/api/projects/:id/archive', async (req, res) => {
  await getDb(); const p = first('SELECT * FROM projects WHERE id=?', [req.params.id]) as any
  if (!p) return res.status(404).json({ error: 'Not found' })
  run('UPDATE projects SET isArchived=? WHERE id=?', [p.isArchived?0:1, req.params.id])
  res.json(first('SELECT * FROM projects WHERE id=?', [req.params.id]))
})

// EXECUTIONS
app.get('/api/executions', async (_req, res) => { await getDb(); res.json(all('SELECT * FROM executions ORDER BY date DESC')) })
app.post('/api/executions', async (req, res) => {
  await getDb(); run('INSERT INTO executions (subProjectId,parentId,name,target,date,notes) VALUES (?,?,?,?,?,?)', [req.body.subProjectId, req.body.parentId, req.body.name, req.body.target, req.body.date, req.body.notes||''])
  res.status(201).json(first('SELECT * FROM executions ORDER BY id DESC LIMIT 1'))
})
app.delete('/api/executions/:id', async (req, res) => { await getDb(); run('DELETE FROM executions WHERE id=?', [req.params.id]); res.json({ ok: true }) })

// HABITS
app.get('/api/habits', async (_req, res) => { await getDb(); res.json(all('SELECT * FROM habits')) })
app.post('/api/habits', async (req, res) => {
  await getDb(); run('INSERT INTO habits (name,type) VALUES (?,?)', [req.body.name, req.body.type||'positive'])
  res.status(201).json(first('SELECT * FROM habits ORDER BY id DESC LIMIT 1'))
})
app.patch('/api/habits/:id', async (req, res) => {
  await getDb(); run('UPDATE habits SET name=?, type=? WHERE id=?', [req.body.name, req.body.type, req.params.id])
  res.json(first('SELECT * FROM habits WHERE id=?', [req.params.id]))
})
app.delete('/api/habits/:id', async (req, res) => { await getDb(); run('DELETE FROM habits WHERE id=?', [req.params.id]); res.json({ ok: true }) })

// HABIT RECORDS
app.get('/api/habit-records', async (req, res) => {
  await getDb(); const { year, month } = req.query
  if (year && month) {
    const prefix = `${year}-${String(Number(month)+1).padStart(2,'0')}`
    return res.json(all('SELECT * FROM habit_records WHERE date LIKE ?', [`${prefix}%`]))
  }
  res.json(all('SELECT * FROM habit_records'))
})
app.get('/api/habit-records/today', async (_req, res) => {
  await getDb(); const today = new Date().toISOString().slice(0,10)
  res.json(all('SELECT * FROM habit_records WHERE date=?', [today]))
})
app.patch('/api/habit-records/:habitId/toggle', async (req, res) => {
  await getDb(); const today = new Date().toISOString().slice(0,10)
  const rec = first('SELECT * FROM habit_records WHERE habitId=? AND date=?', [req.params.habitId, today]) as any
  if (rec) { run('DELETE FROM habit_records WHERE id=?', [rec.id]); res.json({ toggled: false }) }
  else { run('INSERT INTO habit_records (habitId,date,status) VALUES (?,?,?)', [req.params.habitId, today, 'completed']); res.json({ toggled: true, record: first('SELECT * FROM habit_records ORDER BY id DESC LIMIT 1') }) }
})

// JOURNAL
app.get('/api/journal/:date', async (req, res) => {
  await getDb(); const note = first('SELECT * FROM daily_notes WHERE date=?', [req.params.date])
  res.json({ content: (note as any)?.content || '' })
})
app.put('/api/journal/:date', async (req, res) => {
  await getDb(); run('INSERT OR REPLACE INTO daily_notes (date, content) VALUES (?, ?)', [req.params.date, req.body.content||''])
  res.json({ ok: true })
})

// SPA fallback
app.get('/{*splat}', (_req, res) => res.sendFile(path.join(process.cwd(), 'dist', 'index.html')))

getDb().then(() => {
  app.listen(process.env.PORT || 3000, () => console.log('🚀 LifeOS on :' + (process.env.PORT || 3000)))
})
