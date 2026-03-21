import React, { useState } from 'react'

function renderMd(t) {
  if (!t) return ''
  return t
    .replace(/```([\s\S]*?)```/g, (_, c) => `<pre style="background:rgba(0,0,0,.35);border-radius:7px;padding:10px;overflow-x:auto;font-size:12px;margin:6px 0"><code>${c.replace(/</g, '&lt;')}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code style="background:rgba(99,102,241,.2);border-radius:3px;padding:1px 5px;font-size:12.5px">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[-*] (.+)$/gm, '<li style="margin-left:16px;margin-bottom:2px">$1</li>')
    .replace(/(<li[\s\S]+?<\/li>)/g, '<ul style="margin:4px 0">$1</ul>')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

export default function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  const [copied, setCopied] = useState(false)

  const bubStyle = isUser ? {
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    borderRadius: '14px 14px 3px 14px',
    color: '#fff',
  } : {
    background: 'var(--bg2)',
    border: '1px solid var(--bdr)',
    borderRadius: '14px 14px 14px 3px',
    color: 'var(--t1)',
  }

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: 8, marginBottom: 14, alignItems: 'flex-end' }}>
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>✦</div>
      )}
      <div style={{ maxWidth: '74%', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {msg.imgUrl && <img src={msg.imgUrl} alt="" style={{ maxWidth: 200, borderRadius: 9, marginBottom: 3, border: '2px solid #6366f1' }} />}
        {msg.content && (
          <div style={{ ...bubStyle, padding: '10px 14px', fontSize: 13.5, lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: isUser ? msg.content.replace(/</g, '&lt;').replace(/\n/g, '<br/>') : renderMd(msg.content) }}
          />
        )}
        {!isUser && msg.content && (
          <button onClick={() => { navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: copied ? '#6366f1' : 'var(--t3)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        )}
      </div>
      {isUser && (
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>👤</div>
      )}
    </div>
  )
}
