import type { ReactNode } from 'react'

type ToolWorkspaceProps = {
  title: string
  description: string
  children?: ReactNode
}

/** Common layout wrapper for every PDF tool page. */
export function ToolWorkspace({ title, description, children }: ToolWorkspaceProps) {
  return (
    <section className="tool-workspace">
      <header className="tool-workspace-header">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <div className="tool-workspace-body">{children}</div>
    </section>
  )
}
