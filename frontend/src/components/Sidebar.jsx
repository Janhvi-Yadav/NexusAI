import React from 'react'

const s = {
  sidebar: { width: 230, minWidth: 230, background: 'var(--bg1)', borderRight: '1px solid var(--bdr)', display: 'flex', flexDirection: 'column', transition: 'width .25s, min-width .25s', overflow: 'hidden' },
  collapsed: { width: 0, minWidth: 0 },
  header: { padding: '14px 14px 10px', borderBottom: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', gap: 8 },
  icon: { fontSize: 16 },
  title: { fontSize: 13, fontWeight: 600, color: 'var(--t1)', letterSpacing: '.3px' },
  newBtn: { margin: '10px 10px 6px', padding: '9px 12px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', width: 'calc(100% - 20px)' },
  list: { flex: 1, overflowY: 'auto', padding: '0 8px 8px' },
  item: { padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 3, position: 'relative', transition: 'background .15s' },
  itemActive: { background: 'var(--bg3)' },
  itemHover: { background: 'var(--bg2)' },
  name: { fontSize: 12.5, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 },
  meta: { fontSize: 11, color: 'var(--t3)', marginTop: 2 },
  del: { position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 15, padding: '2px 5px', borderRadius: 4, opacity: 0 },
  empty: { textAlign: 'center', color: 'var(--t3)', fontSize: 12, padding: '20px 10px' },
}

export default function Sidebar({ open, sessions, curId, onNew, onSwitch, onDelete }) {
  const [hovered, setHovered] = React.useState(null)

  return (
    <div style={{ ...s.sidebar, ...(open ? {} : s.collapsed) }}>
      <div style={s.header}>
        <span style={s.icon}>🕐</span>
        <span style={s.title}>Chat History</span>
      </div>
      <button style={s.newBtn} onClick={onNew}>＋ New Chat</button>
      <div style={s.list}>
        {sessions.length === 0
          ? <div style={s.empty}>No history yet</div>
          : sessions.map(sess => (
            <div
              key={sess.id}
              style={{ ...s.item, ...(sess.id === curId ? s.itemActive : hovered === sess.id ? s.itemHover : {}) }}
              onClick={() => onSwitch(sess.id)}
              onMouseEnter={() => setHovered(sess.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={s.name}>{sess.name}</div>
              <div style={s.meta}>{new Date(sess.ts).toLocaleDateString()} · {sess.messages.length} msg{sess.messages.length !== 1 ? 's' : ''}</div>
              <button
                style={{ ...s.del, opacity: hovered === sess.id ? 1 : 0 }}
                onClick={e => { e.stopPropagation(); onDelete(sess.id) }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
              >×</button>
            </div>
          ))}
      </div>
    </div>
  )
}
