import React, { useState, useRef, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar.jsx'
import MessageBubble from './components/MessageBubble.jsx'
import { useHistory } from './useHistory.js'
import { sendChat, uploadPDF } from './api.js'

const MODES = {
  chat:  { label: '💬 Chat',     sys: 'chat' },
  study: { label: '📚 Study',    sys: 'study' },
  web:   { label: '🌐 Research', sys: 'web' },
  doc:   { label: '📄 Docs',     sys: 'doc' },
}
const SUGGS = {
  chat:  ['Tell me something fascinating', 'Explain quantum computing', 'Write a short poem', "What's the meaning of life?"],
  study: ["Explain Newton's laws", 'What is photosynthesis?', 'Teach me Pythagoras', 'How does DNA replicate?'],
  web:   ['Latest AI breakthroughs', 'Best languages in 2025', 'How does climate change work?', 'Top tech trends'],
  doc:   ['Summarize the document', 'List all key points', 'What are the main arguments?', 'Find important dates'],
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 14 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✦</div>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: '14px 14px 14px 3px', padding: '12px 16px', display: 'flex', gap: 5 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: 'pulse 1.2s infinite', animationDelay: `${i * .2}s` }} />
        ))}
      </div>
      <style>{`@keyframes pulse{0%,80%,100%{transform:translateY(0);opacity:.3}40%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  )
}

export default function App() {
  const hist = useHistory()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mode, setMode] = useState('chat')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pdfText, setPdfText] = useState('')
  const [pdfName, setPdfName] = useState('')
  const [pendingImg, setPendingImg] = useState(null)
  const [listening, setListening] = useState(false)

  const bottomRef = useRef(null)
  const textRef   = useRef(null)
  const pdfRef    = useRef(null)
  const imgRef    = useRef(null)
  const recognRef = useRef(null)

  const curSession = hist.curSession

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [curSession?.messages, loading])
  useEffect(() => { if (curSession) setMode(curSession.mode || 'chat') }, [curSession?.id])

  // Close sidebar on mobile when session switches
  useEffect(() => {
    if (window.innerWidth < 600) setSidebarOpen(false)
  }, [curSession?.id])

  const switchMode = (m) => {
    setMode(m)
    if (hist.curId) hist.updateSession(hist.curId, { mode: m })
  }

  const ensureSession = () => {
    if (!hist.curId) return hist.newSession()
    return hist.curId
  }

  const handlePDF = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    try {
      const data = await uploadPDF(file)
      setPdfText(data.text); setPdfName(data.name); switchMode('doc')
    } catch { setPdfText('[Upload failed]'); setPdfName(file.name); switchMode('doc') }
    e.target.value = ''
  }

  const handleImg = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const b64 = ev.target.result.split(',')[1]
      const url = URL.createObjectURL(file)
      setPendingImg({ base64: b64, url, type: file.type })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Speech recognition not supported.'); return }
    if (listening) { recognRef.current?.stop(); setListening(false); return }
    const r = new SR(); r.lang = 'en-US'; r.interimResults = false
    r.onresult = ev => setInput(ev.results[0][0].transcript)
    r.onend = () => setListening(false)
    r.start(); recognRef.current = r; setListening(true)
  }

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if ((!text && !pendingImg) || loading) return

    const sessId = ensureSession()
    const savedImg = pendingImg

    hist.addMessage(sessId, { role: 'user', content: text, imgUrl: savedImg?.url })
    setInput(''); setPendingImg(null); setLoading(true); setError(null)
    textRef.current?.focus()

    try {
      const sess = hist.sessions.find(s => s.id === sessId)
      const prevMsgs = (sess?.messages || []).map(m => ({ role: m.role, content: m.content || '' }))
      const allMsgs = [...prevMsgs, { role: 'user', content: text }]

      const data = await sendChat({
        messages: allMsgs, mode,
        pdfText: mode === 'doc' ? pdfText : null,
        pdfName: mode === 'doc' ? pdfName : null,
        imageBase64: savedImg?.base64 || null,
        imageType: savedImg?.type || null,
      })
      hist.addMessage(sessId, { role: 'assistant', content: data.reply })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [input, pendingImg, loading, mode, pdfText, pdfName, hist])

  const messages = curSession?.messages || []

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--bg0)' }}>
      <Sidebar
        open={sidebarOpen}
        sessions={hist.sessions}
        curId={hist.curId}
        onNew={hist.newSession}
        onSwitch={hist.switchSession}
        onDelete={hist.deleteSession}
      />

      {/* Main — takes all remaining space */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--bg1)', borderBottom: '1px solid var(--bdr)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer', fontSize: 18, padding: '3px 6px', borderRadius: 6 }}>☰</button>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✦</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.3px' }}>NexusAI</div>
              <div style={{ fontSize: 11, color: '#6366f1', letterSpacing: '.3px' }}>● {MODES[mode].label}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {messages.length > 0 && (
              <button onClick={() => hist.curId && hist.clearSession(hist.curId)}
                style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', color: 'var(--t2)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Clear</button>
            )}
          </div>
        </div>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', gap: 5, padding: '9px 16px 7px', background: 'var(--bg1)', borderBottom: '1px solid var(--bdr)', flexShrink: 0, flexWrap: 'wrap' }}>
          {Object.entries(MODES).map(([k, m]) => (
            <button key={k} onClick={() => switchMode(k)} style={{
              padding: '5px 13px', borderRadius: 20,
              border: mode === k ? 'none' : '1px solid var(--bdr)',
              background: mode === k ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
              color: mode === k ? '#fff' : 'var(--t3)',
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, transition: 'all .2s'
            }}>{m.label}</button>
          ))}
        </div>

        {/* Badges */}
        <div style={{ padding: '0 16px' }}>
          {pdfName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 8, padding: '6px 12px', marginTop: 8, fontSize: 12, color: '#f59e0b' }}>
              <span>📄</span><span style={{ flex: 1 }}>{pdfName}</span>
              <button onClick={() => { setPdfText(''); setPdfName('') }} style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: 15 }}>×</button>
            </div>
          )}
          {pendingImg && (
            <div style={{ position: 'relative', display: 'inline-block', marginTop: 8 }}>
              <img src={pendingImg.url} alt="" style={{ maxHeight: 80, borderRadius: 8, border: '2px solid #6366f1' }} />
              <button onClick={() => setPendingImg(null)} style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', border: 'none', color: '#fff', borderRadius: '50%', width: 17, height: 17, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
          )}
        </div>

        {/* Chat Area — fills remaining space */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', minHeight: 0 }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: 20 }}>
              <div style={{ width: 58, height: 58, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 14 }}>✦</div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>Ask me anything</h2>
              <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20, maxWidth: 320, lineHeight: 1.6 }}>
                {mode === 'study' ? 'Tutor mode — ask any academic question'
                  : mode === 'web' ? 'Research mode — get detailed answers'
                  : mode === 'doc' ? 'Upload a PDF or TXT file then ask questions'
                  : 'Your personal AI assistant, ready to help'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', maxWidth: 460 }}>
                {SUGGS[mode].map(s => (
                  <button key={s} onClick={() => setInput(s)}
                    style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', color: 'var(--t2)', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
              {loading && <TypingDots />}
              {error && (
                <div style={{ color: '#f87171', fontSize: 12, background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 8, padding: '7px 12px', marginBottom: 10, textAlign: 'center' }}>{error}</div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '10px 16px 14px', background: 'var(--bg1)', borderTop: '1px solid var(--bdr)', flexShrink: 0 }}>
          <div style={{ background: 'var(--bg2)', border: `1px solid ${input || pendingImg ? 'rgba(99,102,241,.5)' : 'var(--bdr)'}`, borderRadius: 12, padding: '10px 10px 8px 14px', transition: 'border-color .2s' }}>
            <textarea
              ref={textRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder={`Message NexusAI… (${MODES[mode].label})`}
              rows={1}
              style={{ width: '100%', background: 'none', border: 'none', outline: 'none', color: 'var(--t1)', fontSize: 14, lineHeight: 1.6, resize: 'none', fontFamily: 'inherit', maxHeight: 100, overflowY: 'auto' }}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 7, gap: 6, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <input type="file" ref={pdfRef} accept=".pdf,.txt,.md" onChange={handlePDF} style={{ display: 'none' }} />
                <input type="file" ref={imgRef} accept="image/*" onChange={handleImg} style={{ display: 'none' }} />
                {[
                  { label: '📄 PDF', onClick: () => pdfRef.current?.click(), active: false },
                  { label: '🖼 Image', onClick: () => imgRef.current?.click(), active: false },
                  { label: listening ? '⏹ Stop' : '🎤 Voice', onClick: toggleVoice, active: listening },
                ].map(b => (
                  <button key={b.label} onClick={b.onClick} style={{ background: 'transparent', border: `1px solid ${b.active ? '#ef4444' : 'var(--bdr)'}`, color: b.active ? '#ef4444' : 'var(--t3)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>{b.label}</button>
                ))}
              </div>
              <button onClick={handleSend} disabled={(!input.trim() && !pendingImg) || loading}
                style={{ width: 36, height: 36, borderRadius: 9, border: 'none', background: (input.trim() || pendingImg) && !loading ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--bg3)', color: '#fff', cursor: (input.trim() || pendingImg) && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0, opacity: (input.trim() || pendingImg) && !loading ? 1 : .35, transition: 'all .2s' }}>↑</button>
            </div>
          </div>
          <div style={{ textAlign: 'center', color: 'var(--t3)', fontSize: 11, marginTop: 7 }}>Enter to send · Shift+Enter for new line · Powered by Groq</div>
        </div>
      </div>
    </div>
  )
}
