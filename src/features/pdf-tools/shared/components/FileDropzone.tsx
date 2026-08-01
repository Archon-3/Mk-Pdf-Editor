type FileDropzoneProps = {
  accept?: string
  multiple?: boolean
  onFilesSelected?: (files: File[]) => void
}

/** Shared upload shell — wire handlers when building each tool UI. */
export function FileDropzone({
  accept = 'application/pdf',
  multiple = false,
  onFilesSelected,
}: FileDropzoneProps) {
  return (
    <label className="file-dropzone">
      <span>Drop files here or click to browse</span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          if (files.length > 0) onFilesSelected?.(files)
        }}
      />
    </label>
  )
}
