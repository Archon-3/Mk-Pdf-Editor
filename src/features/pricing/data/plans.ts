import type { Plan } from '../../../shared/types'

export type BillingPeriod = 'monthly' | 'annual'

export const pricingFaqs = [
  {
    question: 'Can I switch plans later?',
    answer: 'Yes. You can move between Free, Pro Monthly, and Pro Annual at any time. Pro billing updates on your next renewal cycle.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'Checkout is handled securely through PayPal, including PayPal balance, linked cards, and instant invoices.',
  },
  {
    question: 'Is there a free trial for Pro?',
    answer: 'The Free plan includes all core tools with standard limits. Upgrade to Pro Monthly or Pro Annual when you need larger files and priority processing.',
  },
]

/** Pricing page always shows Free + Monthly + Annual together. */
export const pricingPagePlans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/ forever',
    details: 'Basic features included',
    features: [
      'All tools access',
      'Up to 50MB per file',
      '15 tool runs per day',
      'Merge up to 3 PDFs',
      'Standard processing',
    ],
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
    features: [
      'All tools access',
      'Files up to 200MB',
      '500 tool runs per day',
      'Merge up to 30 PDFs',
      'Priority support',
    ],
    cta: 'Upgrade Monthly',
    featured: true,
    checkout: 'paypal',
  },
  {
    id: 'pro_annual',
    name: 'Pro Annual',
    price: '$59.99',
    period: '/ year',
    badge: 'Best Value',
    details: 'Billed annually via PayPal · save ~50%',
    features: [
      'All tools access',
      'Files up to 200MB',
      '500 tool runs per day',
      'Merge up to 30 PDFs',
      'Priority support',
    ],
    cta: 'Upgrade Annual',
    checkout: 'paypal',
  },
]

export const monthlyPlans: Plan[] = [
  pricingPagePlans[0],
  pricingPagePlans[1],
]

export const annualPlans: Plan[] = [
  pricingPagePlans[0],
  pricingPagePlans[2],
]

/** Home page keeps three static cards for the marketing layout. */
export const homePlans: Plan[] = [...pricingPagePlans]

export function getPlansForPeriod(period: BillingPeriod): Plan[] {
  return period === 'annual' ? annualPlans : monthlyPlans
}
