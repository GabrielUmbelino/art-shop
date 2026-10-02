import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
})

function CheckoutPage() {
  return <h1>Payment</h1>
}
