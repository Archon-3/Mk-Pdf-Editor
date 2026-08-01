import type { ToolDefinition } from './shared/types'

import { toolMeta as merge } from './transform/merge'
import { toolMeta as split } from './transform/split'
import { toolMeta as compress } from './transform/compress'
import { toolMeta as rotate } from './transform/rotate'
import { toolMeta as deletePages } from './transform/delete-pages'
import { toolMeta as pageRearrangement } from './transform/page-rearrangement'

import { toolMeta as pdfToWord } from './convert/pdf-to-word'
import { toolMeta as wordToPdf } from './convert/word-to-pdf'
import { toolMeta as excelToPdf } from './convert/excel-to-pdf'
import { toolMeta as powerpointToPdf } from './convert/powerpoint-to-pdf'
import { toolMeta as imageToPdf } from './convert/image-to-pdf'
import { toolMeta as pdfToImage } from './convert/pdf-to-image'

import { toolMeta as extractImages } from './extract/extract-images'
import { toolMeta as extractText } from './extract/extract-text'
import { toolMeta as extractTables } from './extract/extract-tables'

import { toolMeta as watermark } from './edit/watermark'
import { toolMeta as redaction } from './edit/redaction'
import { toolMeta as annotation } from './edit/annotation'
import { toolMeta as signature } from './edit/signature'

export const PDF_TOOLS: ToolDefinition[] = [
  merge,
  split,
  compress,
  rotate,
  deletePages,
  extractImages,
  extractText,
  extractTables,
  pdfToWord,
  wordToPdf,
  excelToPdf,
  powerpointToPdf,
  imageToPdf,
  pdfToImage,
  watermark,
  redaction,
  annotation,
  signature,
  pageRearrangement,
]

export function getToolById(id: string): ToolDefinition | undefined {
  return PDF_TOOLS.find((tool) => tool.id === id)
}

export function getToolsByCategory(category: ToolDefinition['category']): ToolDefinition[] {
  return PDF_TOOLS.filter((tool) => tool.category === category)
}

export type { ToolCategory, ToolDefinition, ToolId, ToolJob, ToolJobStatus } from './shared/types'
export { FileDropzone, ToolWorkspace, useToolJob, startToolJob, fetchToolResult } from './shared'
