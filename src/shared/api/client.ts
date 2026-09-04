import { API_BASE_URL } from '../constants/branding'
import { getStoredPlan } from '../plan'

function clientId() {
  if (typeof window === 'undefined') return 'server'
  const key = 'mkpdf.client'
  const existing = window.localStorage.getItem(key)
  if (existing) return existing
  const created = `web-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
  window.localStorage.setItem(key, created)
  return created
}

export async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

export async function uploadFile(
  files: File[],
  toolId: string,
  options: Record<string, unknown> = {},
): Promise<{ jobId: string; downloadUrl: string; filename: string }> {
  const planId = getStoredPlan()
  const formData = new FormData()
  files.forEach((file) => formData.append('file', file))
  formData.append('toolId', toolId)
  formData.append('planId', planId)
  formData.append('options', JSON.stringify(options))

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    headers: {
      'X-MK-Plan': planId,
      'X-MK-Client': clientId(),
    },
    body: formData,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Upload failed')
  }

  return {
    jobId: data.job_id || data.jobId,
    downloadUrl: data.download_url || data.downloadUrl,
    filename: data.filename || files[0]?.name || 'document',
  }
}

export async function downloadFile(jobId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/download`)

  if (!response.ok) {
    throw new Error('Download failed')
  }

  return response.blob()
}

export async function previewOfficeFile(file: File): Promise<Blob> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(`${API_BASE_URL}/api/preview`, { method: 'POST', body: formData })
  if (!response.ok) throw new Error('Visual preview unavailable')
  return response.blob()
}
