import { uploadFile, downloadFile } from '../../../../shared/api/client'
import type { ToolId } from '../types'

export async function startToolJob(toolId: ToolId, file: File) {
  return uploadFile(file, toolId)
}

export async function fetchToolResult(jobId: string) {
  return downloadFile(jobId)
}
