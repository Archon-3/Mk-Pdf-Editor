import type { Plan } from '../../../shared/types'

export type BillingPeriod = 'monthly' | 'annual'

export const pricingFaqs = [
  {
    question: 'Can I switch plans later?',
    answer: 'Yes. You can move between Free and Pro at any time. Pro billing updates on your next renewal cycle.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'Checkout is handled securely through PayPal, including PayPal balance, linked cards, and instant invoices.',
  },
  {
    question: 'Is there a free trial for Pro?',
    answer: 'The Free plan includes all core tools with standard limits. Upgrade to Pro when you need larger files and priority processing.',
  },
]

export const monthlyPlans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/ forever',
    details: 'Basic features included',
    features: ['All tools access', 'Up to 50MB per file', 'Standard processing speed', 'Web-based access'],
    cta: 'Get Started',
    checkout: 'free',
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    price: '$9.99',
    period: '/ month',
    badge: 'Most Popular',
    details: 'Billed monthly via PayPal',
    features: ['All tools access', 'No file size limit', 'High-speed processing', 'Priority support'],
    cta: 'Upgrade to Pro',
    featured: true,
    checkout: 'paypal',
  },
]

export const annualPlans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/ forever',
    details: 'Basic features included',
    features: ['All tools access', 'Up to 50MB per file', 'Standard processing speed', 'Web-based access'],
    cta: 'Get Started',
    checkout: 'free',
  },
  {
    id: 'pro_annual',
    name: 'Pro',
    price: '$59.99',
    period: '/ year',
    badge: 'Best Value',
    details: 'Billed annually via PayPal · save ~50%',
    features: ['All tools access', 'No file size limit', 'High-speed processing', 'Priority support'],
    cta: 'Upgrade to Pro',
    featured: true,
    checkout: 'paypal',
  },
]

/** Home page keeps three static cards for the marketing layout. */
export const homePlans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/ forever',
    details: 'Basic features included',
    features: ['All tools access', 'Up to 50MB per file', 'Standard processing speed', 'Web-based access'],
    cta: 'Get Started',
    checkout: 'free',
  },
  {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    price: '$9.99',
    period: '/ month',
    badge: 'Most Popular',
    details: 'Billed monthly via PayPal',
    features: ['All tools access', 'No file size limit', 'High-speed processing', 'Priority support'],
    cta: 'Upgrade to Pro',
    featured: true,
    checkout: 'paypal',
  },
  {
    id: 'pro_annual',
    name: 'Pro Annual',
    price: '$59.99',
    period: '/ year',
    details: 'Billed annually via PayPal',
    features: ['All tools access', 'No file size limit', 'High-speed processing', 'Priority support'],
    cta: 'Upgrade to Pro',
    checkout: 'paypal',
  },
]

export function getPlansForPeriod(period: BillingPeriod): Plan[] {
  return period === 'annual' ? annualPlans : monthlyPlans
}
