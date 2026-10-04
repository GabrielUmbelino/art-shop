import { useNavigate } from '@tanstack/react-router'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { ApiError } from '@/api/http'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { CartItem, Quote } from '@/contracts/cart'
import type { CreateOrderBody } from '@/contracts/order'
import { useQuote } from '@/features/cart/use-cart'
import { networkLabels, shortHash } from '@/lib/format'
import { formatEth } from '@/lib/money'
import { OrderSummary } from './order-summary'
import { providerLabels } from './schema'
import { changedQuote, useFreshQuote, useSubmitOrder } from './use-checkout'

type Props = {
  body: Omit<CreateOrderBody, 'quoteId'>
  items: CartItem[]
  walletAddress: string
  onClose: () => void
  onWalletDisconnected: () => void
}

/**
 * Review before paying. The quote shown here is the one sent with the order; if prices,
 * availability, coupon or fees change (realtime event or the API's QUOTE_CHANGED), the new
 * values replace it and the buyer has to confirm again.
 */
export function ReviewDialog({ body, items, walletAddress, onClose, onWalletDisconnected }: Props) {
  const navigate = useNavigate()
  const freshQuote = useFreshQuote()
  const live = useQuote(body.network).data
  const [reviewed, setReviewed] = useState<Quote | null>(null)
  const [previousTotal, setPreviousTotal] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const submitting = useRef(false)
  const submit = useSubmitOrder(() => setRetrying(true))

  // The quote under review is fetched once, when the dialog opens.
  const loadQuote = useEffectEvent(() => void freshQuote(body.network).then(setReviewed))
  useEffect(() => loadQuote(), [])

  const stale = reviewed && live && live.id !== reviewed.id
  const showChange = (next: Quote) => {
    setPreviousTotal(reviewed?.total ?? null)
    setReviewed(next)
  }

  const confirm = async () => {
    if (!reviewed || submitting.current) return
    submitting.current = true
    try {
      const current = await freshQuote(body.network)
      if (current.id !== reviewed.id) return showChange(current)
      if (!current.valid) return
      const order = await submit.mutateAsync({ ...body, quoteId: current.id })
      void navigate({ to: '/orders/$id', params: { id: order.id } })
    } catch (error) {
      const next = changedQuote(error)
      if (next) showChange(next)
      else if (error instanceof ApiError && error.code === 'WALLET_NOT_CONNECTED')
        onWalletDisconnected()
    } finally {
      submitting.current = false
      setRetrying(false)
    }
  }

  const pending = submit.isPending || !reviewed
  const error = submit.error && !changedQuote(submit.error) ? submit.error.message : null

  return (
    <Dialog open onOpenChange={(open) => !open && !submit.isPending && onClose()}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-5 overflow-y-auto bg-card p-6 sm:max-w-[560px] md:rounded-none md:border-b-8 md:border-primary">
        <DialogTitle className="text-lg font-bold">Revisar pedido</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          Confira os dados antes de confirmar. O pagamento usa a cotação abaixo.
        </DialogDescription>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-subtle">Colecionador</dt>
          <dd>
            {body.collector.displayName} ({body.collector.email})
          </dd>
          <dt className="text-subtle">ENS</dt>
          <dd>{body.collector.ensName}</dd>
          <dt className="text-subtle">Carteira</dt>
          <dd>
            {providerLabels[body.provider]} · {shortHash(walletAddress)}
          </dd>
          <dt className="text-subtle">Rede</dt>
          <dd>{networkLabels[body.network]}</dd>
        </dl>

        {(previousTotal || stale) && (
          <p
            role="alert"
            className="rounded-sm border border-primary px-3 py-2 text-sm text-highlight"
          >
            {stale
              ? 'Os valores do seu pedido mudaram. Confirme novamente para ver a cotação atualizada.'
              : `Os valores mudaram: o total foi de ${formatEth(previousTotal!)} para ${formatEth(reviewed!.total)}. Confirme os novos valores para continuar.`}
          </p>
        )}
        {reviewed && !reviewed.valid && (
          <p role="alert" className="text-sm text-destructive">
            Um item ficou indisponível. Volte ao carrinho para ajustar o pedido.
          </p>
        )}

        <OrderSummary items={items} quote={reviewed ?? undefined} title="Itens do pedido" />

        {retrying && (
          <p role="status" className="text-sm text-highlight">
            A confirmação está demorando. Recuperando seu pedido sem criar outra compra...
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={submit.isPending}>
            Voltar
          </Button>
          <Button
            type="button"
            onClick={confirm}
            disabled={pending || (reviewed && !reviewed.valid) || false}
          >
            {submit.isPending
              ? 'Processando...'
              : previousTotal || stale
                ? 'Confirmar novos valores'
                : 'Confirmar e pagar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
