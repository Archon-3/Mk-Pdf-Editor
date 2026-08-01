import { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import * as mammoth from 'mammoth/mammoth.browser'

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

type PreviewState =
  | { kind: 'empty' }
  | { kind: 'pdf'; url: string; text?: string }
  | { kind: 'image'; url: string }
  | { kind: 'document'; html: string }
  | { kind: 'text'; text: string }
  | { kind: 'unsupported' }

type ToolbarTool = 'select' | 'text' | 'textbox' | 'draw' | 'image' | 'undo' | 'crop' | 'split' | 'page' | 'link' | 'signature'

type EditorCanvasProps = {
  zoom: number
  file: File | null
  fileName: string | null
  onUpload: (file: File) => void
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
  fileName,
  onUpload,
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

    const selectedFile = file
    let cancelled = false
    let objectUrl: string | undefined

    async function loadPreview(currentFile: File) {
      const lowerName = currentFile.name.toLowerCase()

      if (currentFile.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
        objectUrl = URL.createObjectURL(currentFile)
        try {
          const text = await extractPdfText(currentFile)
          if (!cancelled) {
            setPreview({ kind: 'pdf', url: objectUrl, text })
            setEditableText(text)
          }
        } catch {
          if (!cancelled) {
            setPreview({ kind: 'pdf', url: objectUrl, text: '' })
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
  }, [file])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
    e.target.value = ''
  }

  const renderViewer = () => {
    if (!file || !fileName) {
      return (
        <label className="page-upload">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt,.rtf,.md,.csv,image/*"
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

    return (
      <div className="document-viewer" data-testid="document-viewer">
        <div className="viewer-meta">
          <span className="viewer-type-badge">{file.type || 'document'}</span>
          <span className="viewer-file-name">{file.name}</span>
          <span className="viewer-editing-indicator">Editable mode • {currentToolLabel}</span>
        </div>

        {(preview.kind === 'pdf' || preview.kind === 'document' || preview.kind === 'text') && (
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
            <img className="image-preview" src={preview.url} alt={file.name} />
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
