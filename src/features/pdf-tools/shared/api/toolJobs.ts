import { uploadFile, downloadFile } from '../../../../shared/api/client'
import type { ToolId } from '../types'

export async function startToolJob(toolId: ToolId, files: File[], options: Record<string, unknown> = {}) {
  return uploadFile(files, toolId, options)
}

export async function fetchToolResult(jobId: string) {
  return downloadFile(jobId)
}
