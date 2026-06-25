import type { Attachment } from '~/types'

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

// Uploads receipts/attachments. In demo (mock) mode the file is kept as a local
// data URL (persisted in localStorage with the row). In live mode it is sent to
// the Apps Script `upload` endpoint, which stores it in Google Drive and returns
// a shareable link.
export function useUploads() {
  const api = useApi()

  async function upload(file: File): Promise<Attachment> {
    const dataUrl = await readAsDataURL(file)
    if (api.isMock) {
      return {
        id: `att_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        url: dataUrl,
        mime: file.type || 'application/octet-stream',
        size: file.size,
      }
    }
    const base64 = dataUrl.includes(',') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : dataUrl
    const res = await api.post<{ id: string; name: string; url: string }>('upload', {
      name: file.name,
      mime: file.type,
      data: base64,
    })
    return { id: res.id, name: res.name || file.name, url: res.url, mime: file.type, size: file.size }
  }

  return { upload }
}
