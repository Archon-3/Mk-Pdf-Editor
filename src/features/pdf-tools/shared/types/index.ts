export type ToolCategory = 'transform' | 'convert' | 'extract' | 'edit'

export type ToolId =
  | 'merge'
  | 'split'
  | 'compress'
  | 'rotate'
  | 'delete-pages'
  | 'page-rearrangement'
  | 'pdf-to-word'
  | 'pdf-to-excel'
  | 'pdf-to-powerpoint'
  | 'word-to-pdf'
  | 'excel-to-pdf'
  | 'powerpoint-to-pdf'
  | 'image-to-pdf'
  | 'pdf-to-image'
  | 'extract-images'
  | 'extract-text'
  | 'extract-tables'
  | 'watermark'
  | 'redaction'
  | 'annotation'
  | 'signature'

export type ToolDefinition = {
  id: ToolId
  name: string
  description: string
  category: ToolCategory
  endpoint: string
  tag?: 'Popular' | 'Pro'
}

export type ToolJobStatus = 'idle' | 'uploading' | 'processing' | 'ready' | 'error'

export type ToolJob = {
  id: string
  toolId: ToolId
  status: ToolJobStatus
  fileName?: string
  error?: string
}
