import { API_BASE_URL } from '../constants/branding'

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

export async function uploadFile(file: File, toolId: string): Promise<{ jobId: string; downloadUrl: string; filename: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('toolId', toolId)

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Upload failed')
  }

  return {
    jobId: data.job_id || data.jobId,
    downloadUrl: data.download_url || data.downloadUrl,
    filename: data.filename || file.name,
  }
}

export async function downloadFile(jobId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/download`)

  if (!response.ok) {
    throw new Error('Download failed')
  }

  return response.blob()
}
