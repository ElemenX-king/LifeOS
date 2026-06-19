import { useState, useEffect, useCallback } from 'react'
import { db } from '../db/db'

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function useJournal() {
  const todayStr = getTodayStr()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  const loadNote = useCallback(async () => {
    const note = await db.table('daily_notes').get(todayStr)
    setContent(note?.content || '')
    setLoading(false)
  }, [todayStr])

  useEffect(() => { loadNote() }, [loadNote])

  const saveNote = useCallback(async (text: string) => {
    await db.table('daily_notes').put({ date: todayStr, content: text })
    setContent(text)
  }, [todayStr])

  return { content, loading, saveNote, refresh: loadNote }
}
