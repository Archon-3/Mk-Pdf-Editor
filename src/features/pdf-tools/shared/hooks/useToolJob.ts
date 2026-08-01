import { useState } from 'react'
import type { ToolJob, ToolJobStatus } from '../types'

const initialJob: ToolJob = {
  id: '',
  toolId: 'merge',
  status: 'idle',
}

export function useToolJob() {
  const [job, setJob] = useState<ToolJob>(initialJob)

  function setStatus(status: ToolJobStatus, patch?: Partial<ToolJob>) {
    setJob((current) => ({ ...current, status, ...patch }))
  }

  function reset() {
    setJob(initialJob)
  }

  return { job, setJob, setStatus, reset }
}
