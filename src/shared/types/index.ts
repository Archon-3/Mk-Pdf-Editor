export type ToolItem = {
  id?: string
  name: string
  tag?: 'Popular' | 'Pro'
}

export type PlanId = 'free' | 'pro_monthly' | 'pro_annual'

export type Plan = {
  id: PlanId
  name: string
  price: string
  period: string
  badge?: string
  details: string
  features: string[]
  cta: string
  featured?: boolean
  checkout: 'free' | 'paypal'
}

export type WhyItem = {
  title: string
  text: string
}
