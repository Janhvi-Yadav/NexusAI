const BASE = ''  // proxied via vite to http://localhost:8000

export async function sendChat({ messages, mode, pdfText, pdfName, imageBase64, imageType }) {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      mode,
      pdf_text: pdfText || null,
      pdf_name: pdfName || null,
      image_base64: imageBase64 || null,
      image_type: imageType || null,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Server error')
  }
  return res.json()
}

export async function uploadPDF(file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${BASE}/upload-pdf`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}
