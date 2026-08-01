import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { EditorCanvas } from './EditorCanvas'

describe('EditorCanvas', () => {
  it('renders a PDF viewer after a PDF file is selected and keeps it editable', async () => {
    const file = new File(['pdf-content'], 'sample.pdf', { type: 'application/pdf' })

    function Wrapper() {
      const [selectedFile, setSelectedFile] = useState<File | null>(null)

      return (
        <EditorCanvas
          zoom={100}
          file={selectedFile}
          fileName={selectedFile ? selectedFile.name : null}
          onUpload={setSelectedFile}
          activeSidebarTool="merge"
          activeToolbarTool="text"
        />
      )
    }

    render(<Wrapper />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByTestId('document-viewer')).toBeInTheDocument()
      expect(screen.getByText(/editable mode/i)).toBeInTheDocument()
    })
  })
})
