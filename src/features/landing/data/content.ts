import type { Plan, WhyItem } from '../../../shared/types'
import { PDF_TOOLS } from '../../pdf-tools'

export const tools = PDF_TOOLS.map((tool) => ({
  id: tool.id,
  name: tool.name,
  tag: tool.tag,
}))

export const whyItems: WhyItem[] = [
  {
    title: 'Easy to Use',
    text: 'Simple interface for everyone with no technical setup.',
  },
  {
    title: 'Secure and Private',
    text: 'Your files are protected with encrypted processing.',
  },
  {
    title: 'Cloud-Based Access',
    text: 'Use your tools anytime, anywhere from any device.',
  },
  {
    title: 'Lightning Fast',
    text: 'Optimized engine saves time on daily document workflows.',
  },
]

export const plans: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/ forever',
    details: 'Basic features included',
    features: ['All tools access', 'Up to 50MB per file', 'Standard processing speed', 'Web-based access'],
    cta: 'Get Started',
  },
  {
    name: 'Pro Monthly',
    price: '$9.99',
    period: '/ month',
    badge: 'Most Popular',
    details: 'Billed monthly',
    features: ['All tools access', 'No file size limit', 'High-speed processing', 'Priority support'],
    cta: 'Get Started',
    featured: true,
  },
  {
    name: 'Pro Annual',
    price: '$59.99',
    period: '/ year',
    details: 'Billed annually',
    features: ['All tools access', 'No file size limit', 'High-speed processing', 'Priority support'],
    cta: 'Get Started',
  },
]
