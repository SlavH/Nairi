export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
}

export const SUBSCRIPTION_PLANS: Product[] = [
  {
    id: "starter",
    name: "Starter Plan",
    description: "500 tokens per month, 3 premium agents",
    priceInCents: 999,
  },
  {
    id: "pro",
    name: "Pro Plan",
    description: "2000 tokens per month, all agents, priority support",
    priceInCents: 2999,
  },
  {
    id: "enterprise",
    name: "Enterprise Plan",
    description: "Unlimited tokens, all agents, dedicated support, API access",
    priceInCents: 9999,
  },
]

export function getProduct(productId: string): Product | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.id === productId)
}
