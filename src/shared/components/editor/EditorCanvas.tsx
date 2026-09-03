import { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import * as mammoth from 'mammoth/mammoth.browser'
import { previewOfficeFile } from '../../api/client'

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

type PreviewState =
  | { kind: 'empty' }
  | { kind: 'pdf'; url: string; file: File; text?: string }
  | { kind: 'image'; url: string }
  | { kind: 'document'; html: string }
  | { kind: 'text'; text: string }
  | { kind: 'unsupported' }

function PdfPagesPreview({ file }: { file: File }) {
  const [pageImages, setPageImages] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    async function renderPages() {
      const pdfDocument = await getDocument({ data: await file.arrayBuffer() }).promise
      if (cancelled) return
      const renderedPages: string[] = []
      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
        const page = await pdfDocument.getPage(pageNumber)
        const viewport = page.getViewport({ scale: 1.15 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise
        renderedPages.push(canvas.toDataURL('image/png'))
      }
      if (!cancelled) setPageImages(renderedPages)
    }
    setPageImages([])
    renderPages().catch(() => setPageImages([]))
    return () => { cancelled = true }
  }, [file])

  return (
    <div className="pdf-pages" aria-label="PDF pages">
      {pageImages.map((pageImage, index) => (
        <img key={index} src={pageImage} className="pdf-page-preview" alt={`Page ${index + 1}`} />
      ))}
    </div>
  )
}

type ToolbarTool = 'select' | 'text' | 'textbox' | 'draw' | 'image' | 'undo' | 'crop' | 'split' | 'page' | 'link' | 'signature'

type EditorCanvasProps = {
  zoom: number
  file: File | null
  previewFile?: File | null
  fileName: string | null
  files?: File[]
  onUpload: (file: File) => void
  onUploadMultiple?: (files: File[]) => void
  onOperationOptionsChange?: (options: Record<string, unknown>) => void
  onRunOperation?: () => void
  activeSidebarTool?: string | null
  activeToolbarTool?: ToolbarTool
}

function stripHtmlToText(html: string) {
  if (!html) return ''

  const parser = document.createElement('div')
  parser.innerHTML = html
  return (parser.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function readFileText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}`))
    reader.readAsText(file)
  })
}

async function extractPdfText(file: File) {
  const buffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: buffer }).promise
  const pageTexts: string[] = []

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex)
    const textContent = await page.getTextContent()

    const rows = new Map<number, Array<{ x: number; text: string }>>()
    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue

      const y = Math.round((item.transform?.[5] ?? 0) / 5) * 5
      const x = Number(item.transform?.[4] ?? 0)
      const cell = rows.get(y) ?? []
      cell.push({ x, text: item.str.trim() })
      rows.set(y, cell)
    }

    const pageText = Array.from(rows.entries())
      .sort(([a], [b]) => b - a)
      .map(([, items]) => items
        .sort((a, b) => a.x - b.x)
        .map((cell) => cell.text)
        .join('\t'))
      .join('\n')

    if (pageText.trim()) {
      pageTexts.push(pageText)
    }
  }

  return pageTexts.join('\n\n')
}

export function EditorCanvas({
  zoom,
  file,
  previewFile = null,
  fileName,
  files = file ? [file] : [],
  onUpload,
  onUploadMultiple,
  onOperationOptionsChange,
  onRunOperation,
  activeSidebarTool = null,
  activeToolbarTool = 'select',
}: EditorCanvasProps) {
  const [preview, setPreview] = useState<PreviewState>({ kind: 'empty' })
  const [editableText, setEditableText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!file) return

    const toolMap: Record<string, string> = {
      text: '\n[Added text]\n',
      textbox: '\n[Text box]\n',
      draw: '\n[Drawing mark]\n',
      image: '\n[Image placeholder]\n',
      signature: '\n[Signature]\n',
      annotation: '\n[Annotation]\n',
      watermark: '\n[Watermark]\n',
      redaction: '\n[Redaction]\n',
    }

    const snippet = toolMap[activeToolbarTool] ?? toolMap[String(activeSidebarTool) ?? '']
    if (!snippet) return

    setEditableText((previous) => {
      const next = previous ? `${previous}${snippet}` : snippet
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          const position = next.length
          textareaRef.current.selectionStart = position
          textareaRef.current.selectionEnd = position
        }
      })
      return next
    })
  }, [file, activeSidebarTool, activeToolbarTool])

  useEffect(() => {
    if (!file) {
      setPreview({ kind: 'empty' })
      setEditableText('')
      return
    }

    const selectedFile = previewFile ?? file
    let cancelled = false
    let objectUrl: string | undefined

    async function loadPreview(currentFile: File) {
      const lowerName = currentFile.name.toLowerCase()

      if (currentFile.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
        objectUrl = URL.createObjectURL(currentFile)
        try {
          const text = await extractPdfText(currentFile)
          if (!cancelled) {
            setPreview({ kind: 'pdf', url: objectUrl, file: currentFile, text })
            setEditableText(text)
          }
        } catch {
          if (!cancelled) {
            setPreview({ kind: 'pdf', url: objectUrl, file: currentFile, text: '' })
            setEditableText('')
          }
        }
        return
      }

      if (currentFile.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(lowerName)) {
        objectUrl = URL.createObjectURL(currentFile)
        if (!cancelled) {
          setPreview({ kind: 'image', url: objectUrl })
        }
        return
      }

      if (/\.(docx?|xls|xlsx|ppt|pptx)$/i.test(lowerName)) {
        try {
          const previewBlob = await previewOfficeFile(currentFile)
          const previewFile = new File([previewBlob], `${currentFile.name}.preview.pdf`, { type: 'application/pdf' })
          const previewUrl = URL.createObjectURL(previewFile)
          objectUrl = previewUrl
          if (!cancelled) setPreview({ kind: 'pdf', url: previewUrl, file: previewFile })
          return
        } catch {
          // Fall through to the structural preview when no Office renderer is available.
        }
      }

      if (/\.(docx?|odt|rtf|txt|md|csv)$/i.test(lowerName)) {
        try {
          const transformed = lowerName.endsWith('.docx') || lowerName.endsWith('.doc') || lowerName.endsWith('.odt')

          if (transformed) {
            const arrayBuffer = await currentFile.arrayBuffer()
            const result = await mammoth.convertToHtml({ arrayBuffer })
            const html = result.value || '<p>Document preview is empty.</p>'
            if (!cancelled) {
              setPreview({ kind: 'document', html })
              setEditableText(stripHtmlToText(html))
            }
            return
          }

          const text = await readFileText(currentFile)
          if (!cancelled) {
            setPreview({ kind: 'text', text })
            setEditableText(text)
          }
          return
        } catch {
          const fallbackText = await readFileText(currentFile).catch(() => '')
          if (!cancelled) {
            setPreview({ kind: 'text', text: fallbackText })
            setEditableText(fallbackText)
          }
          return
        }
      }

      if (!cancelled) {
        setPreview({ kind: 'unsupported' })
        setEditableText('')
      }
    }

    loadPreview(selectedFile)

    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [file, previewFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? [])
    if (selectedFiles.length === 1) onUpload(selectedFiles[0])
    else if (selectedFiles.length > 1) onUploadMultiple?.(selectedFiles)
    e.target.value = ''
  }

  const operationControls = () => {
    const tool = String(activeSidebarTool ?? '')
    if (!file) return null
    if (tool === 'merge') {
      return <span className="viewer-editing-indicator">{files.length} PDF file(s) selected</span>
    }
    if (tool === 'split') {
      return (
        <label className="viewer-editing-indicator">
          Split page groups (example: 1-3;4)
          <input type="text" defaultValue="" onChange={(event) => onOperationOptionsChange?.({ pages: event.target.value })} />
        </label>
      )
    }
    if (tool === 'rotate') {
      return (
        <label className="viewer-editing-indicator">
          Rotation
          <select defaultValue="90" onChange={(event) => onOperationOptionsChange?.({ angle: Number(event.target.value) })}>
            <option value="90">90 degrees</option><option value="180">180 degrees</option><option value="270">270 degrees</option>
          </select>
        </label>
      )
    }
    if (tool === 'delete-pages') {
      return (
        <label className="viewer-editing-indicator">
          Delete page number
          <input type="number" min="1" defaultValue="1" onChange={(event) => onOperationOptionsChange?.({ page: Number(event.target.value) })} />
        </label>
      )
    }
    if (tool === 'page-rearrangement') {
      return (
        <label className="viewer-editing-indicator">
          Page order (example: 2,1,3)
          <input type="text" defaultValue="" onChange={(event) => onOperationOptionsChange?.({ order: event.target.value })} />
        </label>
      )
    }
    if (tool === 'watermark') {
      return (
        <label className="viewer-editing-indicator">
          Watermark text
          <input type="text" defaultValue="MK PDF" onChange={(event) => onOperationOptionsChange?.({ text: event.target.value })} />
        </label>
      )
    }
    if (tool === 'annotation' || tool === 'signature') {
      return (
        <label className="viewer-editing-indicator">
          Note text
          <input type="text" defaultValue="MK PDF note" onChange={(event) => onOperationOptionsChange?.({ text: event.target.value })} />
        </label>
      )
    }
    if (tool === 'redaction') {
      return (
        <label className="viewer-editing-indicator">
          Text to redact
          <input type="text" defaultValue="" onChange={(event) => onOperationOptionsChange?.({ text: event.target.value })} />
        </label>
      )
    }
    return null
  }

  const renderViewer = () => {
    if (!file || !fileName) {
      return (
        <label className="page-upload">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.md,image/*"
            multiple={activeSidebarTool === 'merge' || activeSidebarTool === 'image-to-pdf'}
            onChange={handleFileChange}
            hidden
          />
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8H36C38.2 8 40 9.8 40 12V36C40 38.2 38.2 40 36 40H12C9.8 40 8 38.2 8 36V12C8 9.8 9.8 8 12 8Z" />
            <path d="M16 16H32M16 24H32M16 32H24" strokeLinecap="round" />
          </svg>
          <strong>Upload a PDF, Word, or text file</strong>
          <span>Click or drag and drop your document here</span>
        </label>
      )
    }

    const currentToolLabel = activeSidebarTool ?? activeToolbarTool ?? 'select'
    const shownFile = previewFile ?? file
    const isMergeReady = activeSidebarTool !== 'merge' || files.length >= 2

    return (
      <div className="document-viewer" data-testid="document-viewer">
        <div className="viewer-meta">
          <span className="viewer-type-badge">{shownFile.type || 'document'}</span>
          <span className="viewer-file-name">{shownFile.name}</span>
          <span className="viewer-editing-indicator">Editable mode • {currentToolLabel}</span>
          {operationControls()}
          <label className="editor-file-add-btn">
            {activeSidebarTool === 'merge' ? 'Upload another PDF' : 'Replace file'}
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.md,image/*"
              multiple={activeSidebarTool === 'merge' || activeSidebarTool === 'image-to-pdf'}
              onChange={handleFileChange}
              hidden
            />
          </label>
          <button type="button" className="editor-run-btn" onClick={onRunOperation} disabled={!isMergeReady}>
            {isMergeReady ? `Run ${currentToolLabel}` : 'Select 2 PDFs'}
          </button>
        </div>

        {preview.kind === 'pdf' && <PdfPagesPreview file={preview.file} />}

        {(preview.kind === 'document' || preview.kind === 'text') && (
          <label className="editable-panel full-height">
            <span>Edit document</span>
            <textarea
              ref={textareaRef}
              value={editableText}
              onChange={(event) => setEditableText(event.target.value)}
            />
          </label>
        )}

        {preview.kind === 'image' && (
          <div className="image-editor-wrap">
            <img className="image-preview" src={preview.url} alt={shownFile.name} />
            <label className="editable-panel">
              <span>Image content</span>
              <textarea
                ref={textareaRef}
                value={editableText || 'This image is attached to the document and can be edited as an image asset in the next step.'}
                onChange={(event) => setEditableText(event.target.value)}
              />
            </label>
          </div>
        )}

        {preview.kind === 'unsupported' && (
          <div className="unsupported-preview">
            <div className="unsupported-icon">📄</div>
            <h3>{file.name}</h3>
            <p>This file type can be uploaded, but preview support is not enabled yet.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="editor-canvas-wrap">
      <div className="editor-canvas-scroll">
        <div
          className="editor-page"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          {fileName ? (
            <>
              <div className="page-content page-content-viewer">{renderViewer()}</div>
              <p className="page-file-label">{fileName}</p>
            </>
          ) : (
            renderViewer()
          )}
        </div>
      </div>
    </div>
  )
}
