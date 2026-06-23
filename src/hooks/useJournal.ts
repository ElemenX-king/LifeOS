import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'

export function useJournal() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  const loadNote = useCallback(async () => {
    try {
      const result = await api.getJournal()
      setContent(result.content || '')
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { loadNote() }, [loadNote])

  const saveNote = useCallback(async (text: string) => {
    await api.saveJournal(text)
    setContent(text)
  }, [])

  return { content, loading, saveNote, refresh: loadNote }
}
