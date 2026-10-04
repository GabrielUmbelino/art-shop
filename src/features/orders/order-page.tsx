import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { LoaderCircleIcon, XCircleIcon, XIcon } from 'lucide-react'
import { useEffect } from 'react'
import { ApiError } from '@/api/http'
import { orderQuery } from '@/api/orders'
import { ThankYouIllustration } from '@/components/brand-icons'
import { NftImage } from '@/components/nft-image'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Order } from '@/contracts/order'
import { clearDraft } from '@/features/checkout/draft'
import { providerLabels } from '@/features/checkout/schema'
import { useUserId } from '@/features/checkout/use-checkout'
import { formatDate, networkLabels, shortHash } from '@/lib/format'
import { formatEth } from '@/lib/money'

const explorerNames = { ethereum: 'Etherscan', polygon: 'Polygonscan', solana: 'Solscan' } as const

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative mx-auto flex w-full max-w-[578px] flex-col bg-card md:border-b-8 md:border-primary">
      <Link
        to="/"
        aria-label="Fechar e voltar ao início"
        className="absolute top-4 right-4 text-highlight hover:text-foreground"
      >
        <XIcon className="size-5" />
      </Link>
      {children}
    </section>
  )
}

/** Receipt: rendered only from the order snapshot, never from current catalog data. */
function Receipt({ order }: { order: Order }) {
  const info = 'flex flex-col px-4 py-3 text-sm'
  return (
    <Card>
      <div className="flex flex-col items-center gap-4 px-6 pt-6 pb-5">
        <ThankYouIllustration className="h-20 w-16 text-primary" />
        <h1 className="text-center font-bold tracking-wide text-muted-foreground">
          Seus NFTs agora estão na sua carteira
        </h1>
      </div>
      <dl className="grid grid-cols-2 border-y border-primary sm:grid-cols-4 sm:divide-x sm:divide-primary">
        <div className={info}>
          <dt className="font-bold text-muted-foreground">ID da transação</dt>
          <dd className="text-muted-foreground">{shortHash(order.txHash!)}</dd>
        </div>
        <div className={info}>
          <dt className="text-subtle">Data</dt>
          <dd className="text-muted-foreground">{formatDate(order.updatedAt)}</dd>
        </div>
        <div className={info}>
          <dt className="text-subtle">Total</dt>
          <dd className="text-muted-foreground">{formatEth(order.total)}</dd>
        </div>
        <div className={info}>
          <dt className="font-bold text-muted-foreground">Carteira</dt>
          <dd className="text-muted-foreground">{providerLabels[order.wallet.provider]}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-4 px-6 py-6 md:px-11">
        <table className="w-full text-sm">
          <caption className="mb-2 text-left font-bold">Detalhes da transação</caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="pb-2 font-bold">
                NFTs
              </th>
              <th scope="col" className="pb-2 text-center font-bold">
                Edições
              </th>
              <th scope="col" className="pb-2 text-right font-bold">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={line.editionId}>
                <td className="py-2">
                  <div className="flex items-center gap-3">
                    <NftImage
                      src={line.image}
                      alt=""
                      sizes="65px"
                      className="size-[65px] rounded-sm"
                    />
                    <div>
                      <p className="font-bold">{line.name}</p>
                      <p className="text-subtle">ID do token: {line.tokenId}</p>
                      <p className="text-subtle">Edição {line.editionName}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2 text-center text-muted-foreground">(x {line.quantity})</td>
                <td className="py-2 text-right font-bold text-highlight">
                  {formatEth(line.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="ml-auto grid w-full max-w-[320px] grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-[15px]">
          {order.coupon && (
            <>
              <dt>Desconto ({order.coupon.code})</dt>
              <dd className="text-right">(-) {formatEth(order.discount)}</dd>
            </>
          )}
          <dt>Taxa de rede</dt>
          <dd className="text-right">{formatEth(order.networkFee)}</dd>
          <dt className="font-bold">Total</dt>
          <dd className="text-right font-bold text-highlight">{formatEth(order.total)}</dd>
        </dl>
        <p className="border-t border-border pt-4 text-center text-sm text-muted-foreground">
          Transação confirmada na {networkLabels[order.network]}. A propriedade foi transferida para
          sua carteira conectada e registrada na rede.
        </p>
        <Button asChild className="mx-auto">
          <a href={order.explorerUrl!} target="_blank" rel="noopener noreferrer">
            Ver no {explorerNames[order.network]}
            <span className="sr-only"> (abre em nova aba, transação simulada)</span>
          </a>
        </Button>
      </div>
    </Card>
  )
}

function Pending({ order }: { order: Order }) {
  return (
    <Card>
      <div className="flex flex-col items-center gap-4 px-6 py-12 text-center" aria-live="polite">
        <LoaderCircleIcon
          className="size-12 animate-spin text-primary motion-reduce:animate-none"
          aria-hidden="true"
        />
        <h1 className="text-lg font-bold">Aguardando a confirmação do pagamento</h1>
        <p className="text-sm text-muted-foreground">
          Pedido {order.id} · {formatEth(order.total)} na {networkLabels[order.network]}
        </p>
        <p className="text-sm text-muted-foreground">
          Você pode recarregar ou sair desta página: o status é atualizado automaticamente e nenhuma
          compra nova é criada.
        </p>
      </div>
    </Card>
  )
}

function Refused({ order }: { order: Order }) {
  return (
    <Card>
      <div role="alert" className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <XCircleIcon className="size-12 text-destructive" aria-hidden="true" />
        <h1 className="text-lg font-bold">Pagamento recusado</h1>
        <p className="text-sm text-muted-foreground">{order.refusalReason}</p>
        <p className="text-sm text-muted-foreground">Seus itens continuam no carrinho.</p>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link to="/cart">Ver carrinho</Link>
          </Button>
          <Button asChild>
            <Link to="/checkout">Tentar novamente</Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function OrderPage({ id }: { id: string }) {
  const userId = useUserId()
  const queryClient = useQueryClient()
  const query = useQuery({
    ...orderQuery(userId, id),
    enabled: !!userId,
    // Realtime is the main channel; polling covers a socket that cannot reconnect.
    refetchInterval: (q) => (q.state.data?.status === 'pending' ? 15_000 : false),
  })
  const status = query.data?.status

  useEffect(() => {
    if (status !== 'confirmed') return
    clearDraft(userId)
    // The API removed the bought units from the cart.
    void queryClient.invalidateQueries({ queryKey: ['private', userId, 'cart'] })
  }, [status, userId, queryClient])

  const missing =
    query.error instanceof ApiError && ['NOT_FOUND', 'FORBIDDEN'].includes(query.error.code)

  return (
    <div className="page-container py-12 md:py-24">
      {missing ? (
        <section className="flex flex-col items-center gap-4 py-12 text-center">
          <h1 className="text-xl font-bold">Pedido não encontrado</h1>
          <Button asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
        </section>
      ) : query.isError && !query.data ? (
        <div role="alert" className="flex flex-col items-center gap-4 bg-card py-16 text-center">
          <p className="font-bold">Não foi possível carregar o pedido.</p>
          <Button onClick={() => query.refetch()}>Tentar novamente</Button>
        </div>
      ) : !query.data ? (
        <Skeleton className="mx-auto h-[520px] w-full max-w-[578px]" />
      ) : query.data.status === 'confirmed' ? (
        <Receipt order={query.data} />
      ) : query.data.status === 'refused' ? (
        <Refused order={query.data} />
      ) : (
        <Pending order={query.data} />
      )}
    </div>
  )
}
