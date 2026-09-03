import type { WhyItem } from '../../../shared/types'
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
