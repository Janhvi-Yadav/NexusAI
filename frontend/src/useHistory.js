import { useState, useEffect, useCallback } from 'react'

const KEY = 'nexusai_sessions'
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}
function save(sessions) {
  try { localStorage.setItem(KEY, JSON.stringify(sessions)) } catch {}
}

export function useHistory() {
  const [sessions, setSessions] = useState(load)
  const [curId, setCurId] = useState(() => load()[0]?.id || null)

  useEffect(() => { save(sessions) }, [sessions])

  const curSession = sessions.find(s => s.id === curId) || null

  const newSession = useCallback(() => {
    const id = uid()
    const sess = { id, name: 'New Chat', mode: 'chat', messages: [], ts: Date.now() }
    setSessions(prev => [sess, ...prev])
    setCurId(id)
    return id
  }, [])

  const switchSession = useCallback((id) => setCurId(id), [])

  const deleteSession = useCallback((id) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      if (id === curId) setCurId(next[0]?.id || null)
      return next
    })
  }, [curId])

  const updateSession = useCallback((id, patch) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }, [])

  const addMessage = useCallback((id, msg) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== id) return s
      const messages = [...s.messages, msg]
      const name = s.name === 'New Chat' && msg.role === 'user' && msg.content
        ? msg.content.slice(0, 34) + (msg.content.length > 34 ? '…' : '')
        : s.name
      return { ...s, messages, name, ts: Date.now() }
    }))
  }, [])

  const clearSession = useCallback((id) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, messages: [], ts: Date.now() } : s))
  }, [])

  return { sessions, curId, curSession, newSession, switchSession, deleteSession, updateSession, addMessage, clearSession }
}
