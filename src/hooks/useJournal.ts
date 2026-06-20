import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function useJournal() {
  const todayStr = getTodayStr()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  const loadNote = useCallback(async () => {
    try {
      const result = await api.getJournal(todayStr)
      setContent(result.content || '')
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [todayStr])

  useEffect(() => { loadNote() }, [loadNote])

  const saveNote = useCallback(async (text: string) => {
    await api.saveJournal(todayStr, text)
    setContent(text)
  }, [todayStr])

  return { content, loading, saveNote, refresh: loadNote }
}
