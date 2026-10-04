import { createFileRoute } from '@tanstack/react-router'
import { OrderPage } from '@/features/orders/order-page'

export const Route = createFileRoute('/_authenticated/orders/$id')({
  component: Order,
})

function Order() {
  return <OrderPage id={Route.useParams().id} />
}
