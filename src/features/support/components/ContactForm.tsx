import { useState, type FormEvent } from 'react'
import { SUPPORT_EMAIL, supportTopics } from '../data/content'

type FormState = {
  name: string
  email: string
  topic: string
  message: string
}

const initialState: FormState = {
  name: '',
  email: '',
  topic: supportTopics[0]?.id ?? 'tools',
  message: '',
}

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const topicLabel = supportTopics.find((topic) => topic.id === form.topic)?.label ?? form.topic
    const subject = encodeURIComponent(`[MK PDF Editor] ${topicLabel}`)
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nTopic: ${topicLabel}\n\n${form.message}`,
    )
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
    setSubmitted(true)
    setForm(initialState)
  }

  return (
    <section className="support-contact" aria-labelledby="support-contact-heading">
      <h2 id="support-contact-heading">Contact support</h2>
      <p className="support-contact-lead">
        Prefer email? Reach us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      {submitted ? (
        <div className="support-form-success" role="status">
          Your mail client should open shortly. If it does not, email us directly and we will follow up.
        </div>
      ) : null}

      <form className="support-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            required
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </label>
        <label>
          Email
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>
        <label>
          Topic
          <select
            name="topic"
            value={form.topic}
            onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))}
          >
            {supportTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Message
          <textarea
            required
            name="message"
            rows={5}
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
          />
        </label>
        <button type="submit">Send message</button>
      </form>
    </section>
  )
}
