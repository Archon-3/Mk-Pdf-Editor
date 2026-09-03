export type SupportTopic = {
  id: string
  label: string
}

export type FaqItem = {
  question: string
  answer: string
}

export const supportTopics: SupportTopic[] = [
  { id: 'tools', label: 'PDF tools & conversion' },
  { id: 'billing', label: 'Billing & plans' },
  { id: 'account', label: 'Account access' },
  { id: 'privacy', label: 'Privacy & security' },
  { id: 'other', label: 'Something else' },
]

export const supportFaqs: FaqItem[] = [
  {
    question: 'How long are my uploaded files stored?',
    answer:
      'Files are processed for your current session and then removed according to our retention policy. We do not keep documents longer than needed to deliver your result.',
  },
  {
    question: 'A tool failed or returned an unexpected file. What should I do?',
    answer:
      'Try a smaller file or a different format first. If it still fails, contact support with the tool name, file type, and a short description of what you expected.',
  },
  {
    question: 'How do I upgrade or cancel Pro?',
    answer:
      'Open Pricing to choose a plan. For billing changes or cancellations, email support with the PayPal receipt or account email used at checkout.',
  },
  {
    question: 'Do you offer a help center or live chat?',
    answer:
      'Email support is available for all users. Pro customers receive priority responses during business hours.',
  },
]

export const SUPPORT_EMAIL = 'support@mkpdfeditor.com'
