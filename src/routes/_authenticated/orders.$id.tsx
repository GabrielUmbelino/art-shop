import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/orders/$id')({
  component: OrderPage,
})

function OrderPage() {
  return <h1>Order confirmation</h1>
}
