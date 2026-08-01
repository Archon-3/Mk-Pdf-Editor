export type ToolItem = {
  id?: string
  name: string
  tag?: 'Popular' | 'Pro'
}

export type Plan = {
  name: string
  price: string
  period: string
  badge?: string
  details: string
  features: string[]
  cta: string
  featured?: boolean
}

export type WhyItem = {
  title: string
  text: string
}
