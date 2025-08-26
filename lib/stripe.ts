import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const STRIPE_PRICE_ID = 'price_1S0EkdL3kpViUrWe4kLBnk04' // You'll need to create this in Stripe
export const STRIPE_PRODUCT_ID = 'prod_Sw6yjXdAIgBHrm' // You'll need to create this in Stripe
