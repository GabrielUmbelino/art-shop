import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeftIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { NftImage } from '@/components/nft-image'
import { QuantityStepper } from '@/components/quantity-stepper'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { applyCouponBody, type CartItem, type Quote } from '@/contracts/cart'
import { NftRow } from '@/features/catalog/nft-row'
import { applyApiError } from '@/lib/form'
import { formatEth } from '@/lib/money'
import { CartNotices } from './cart-notices'
import {
  useApplyCoupon,
  useCart,
  useQuote,
  useRemoveCoupon,
  useRemoveItem,
  useSetQuantity,
} from './use-cart'

function CouponForm({ couponCode }: { couponCode: string | null }) {
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const form = useForm<{ code: string }>({
    resolver: zodResolver(applyCouponBody),
    defaultValues: { code: '' },
  })
  const error = form.formState.errors.code
  const submit = form.handleSubmit(async ({ code }) => {
    try {
      await apply.mutateAsync(code)
      form.reset()
    } catch (e) {
      applyApiError(e, form.setError)
    }
  })

  if (couponCode)
    return (
      <p className="flex items-center justify-between gap-2 text-sm">
        <span>
          Cupom <strong className="text-highlight">{couponCode}</strong> aplicado
        </span>
        <button
          type="button"
          onClick={() => remove.mutate()}
          className="text-highlight underline-offset-4 hover:underline"
        >
          Remover cupom
        </button>
      </p>
    )

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      <label htmlFor="coupon" className="text-sm font-bold">
        Código promocional
      </label>
      <div className="flex">
        <input
          id="coupon"
          {...form.register('code')}
          aria-invalid={!!error}
          aria-describedby={error ? 'coupon-error' : undefined}
          placeholder="Digite o código promocional..."
          className="h-10 min-w-0 flex-1 rounded-l-[2.5px] border border-primary bg-background px-3 text-xs uppercase placeholder:normal-case placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-ring max-md:rounded-l-full max-md:border-0 max-md:bg-card"
        />
        <Button
          type="submit"
          className="rounded-l-none max-md:rounded-r-full"
          disabled={apply.isPending}
        >
          Aplicar
        </Button>
      </div>
      <FieldError id="coupon-error" errors={[error]} />
    </form>
  )
}

function Summary({
  quote,
  couponCode,
  empty,
}: {
  quote: Quote | undefined
  couponCode: string | null
  empty: boolean
}) {
  const navigate = useNavigate()
  const row = 'flex items-center justify-between gap-4 tracking-wide'
  const value = (amount: string | undefined) =>
    amount === undefined ? <Skeleton className="h-6 w-24" /> : formatEth(amount)
  return (
    <section aria-labelledby="summary-title" className="flex flex-col gap-5">
      <h2
        id="summary-title"
        className="border-b border-border pb-3 text-lg font-bold tracking-wide max-md:sr-only"
      >
        Resumo da carteira
      </h2>
      <CouponForm couponCode={couponCode} />
      <dl className="flex flex-col gap-3 text-[15px]" aria-live="polite" aria-busy={!quote}>
        <div className={row}>
          <dt>Subtotal</dt>
          <dd className="text-lg">{value(quote?.subtotal)}</dd>
        </div>
        <div className={row}>
          <dt>Desconto do lançamento</dt>
          <dd>{quote ? `(-) ${formatEth(quote.discount)}` : value(undefined)}</dd>
        </div>
        <div className={row}>
          <dt>Taxa de rede</dt>
          <dd className="text-lg">{value(quote?.networkFee)}</dd>
        </div>
        <p className="-mt-2 text-right text-xs text-highlight">Taxa estimada</p>
        <div className={`${row} border-t border-border pt-4 font-bold`}>
          <dt>Total</dt>
          <dd className="text-lg text-highlight">{value(quote?.total)}</dd>
        </div>
      </dl>
      <Button
        size="lg"
        className="w-full max-md:h-12 max-md:rounded-full"
        disabled={empty || !quote?.valid}
        onClick={() => void navigate({ to: '/checkout' })}
      >
        Conectar e finalizar
      </Button>
      {quote && !quote.valid && !empty && (
        <p role="alert" className="text-sm text-destructive">
          Ajuste os itens indisponíveis para continuar.
        </p>
      )}
      <Link
        to="/"
        hash="mercado"
        className="text-center text-[15px] text-highlight hover:underline max-md:hidden"
      >
        Continuar explorando
      </Link>
    </section>
  )
}

function ItemRow({ item, line }: { item: CartItem; line: Quote['lines'][number] | undefined }) {
  const setQuantity = useSetQuantity()
  const remove = useRemoveItem()
  const issue =
    line?.issue === 'sold-out'
      ? 'Esgotado. Remova este item para continuar.'
      : line?.issue === 'insufficient-stock'
        ? `Apenas ${line.available} disponíveis. Reduza a quantidade.`
        : null
  const cell = 'md:py-3 md:pr-4'
  return (
    <tr className="grid grid-cols-[100px_1fr_auto] gap-x-3 rounded-xl bg-card max-md:overflow-hidden md:table-row md:rounded-none">
      <td className="row-span-3 md:w-[70px] md:p-0">
        <NftImage src={item.image} alt="" sizes="100px" className="h-full md:size-[70px]" />
      </td>
      <th scope="row" className={`${cell} pt-3 text-left font-normal md:pl-4`}>
        <Link
          to="/nft/$id"
          params={{ id: item.nftId }}
          className="font-bold hover:text-highlight max-md:text-sm"
        >
          {item.name}
        </Link>
        <span className="block text-sm text-subtle max-md:hidden">ID do token: {item.tokenId}</span>
        <span className="block text-sm text-subtle md:hidden">Edição: {item.editionName}</span>
        {issue && (
          <span role="alert" className="block text-sm text-destructive">
            {issue}
          </span>
        )}
      </th>
      <td className={`${cell} font-bold text-highlight max-md:col-start-2 max-md:text-lg`}>
        <span className="sr-only">Preço: </span>
        {formatEth(line?.unitPrice ?? item.unitPrice)}
        <span className="text-xs font-normal text-subtle max-md:hidden"> · {item.editionName}</span>
      </td>
      <td className={`${cell} max-md:col-start-3 max-md:row-start-3 max-md:pr-3 max-md:pb-3`}>
        <QuantityStepper
          variant="square"
          value={item.quantity}
          max={Math.max(item.maxQuantity, item.quantity)}
          label={`Quantidade de ${item.name}`}
          disabled={setQuantity.isPending}
          onChange={(quantity) => setQuantity.mutate({ itemId: item.id, quantity })}
        />
      </td>
      <td className={`${cell} font-bold text-highlight max-md:hidden`}>
        <span className="sr-only">Total: </span>
        {line ? formatEth(line.lineTotal) : <Skeleton className="h-6 w-20" />}
      </td>
      <td className="max-md:col-start-3 max-md:row-start-1 max-md:pt-2 max-md:pr-2 max-md:text-right md:pr-4">
        <button
          type="button"
          onClick={() => remove.mutate(item.id)}
          disabled={remove.isPending}
          aria-label={`Remover ${item.name} do carrinho`}
          className="p-1 text-subtle hover:text-highlight focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Trash2Icon className="size-5" />
        </button>
      </td>
    </tr>
  )
}

export function CartPage() {
  const cart = useCart()
  const quote = useQuote()
  const router = useRouter()
  const items = cart.data?.items
  const empty = items?.length === 0

  return (
    <div className="page-container flex flex-col gap-16 py-6 md:gap-24">
      <div className="flex flex-col gap-4">
        <div className="relative flex items-center justify-center md:hidden">
          <button
            type="button"
            onClick={() => router.history.back()}
            aria-label="Voltar"
            className="absolute left-0 flex size-10 items-center justify-center rounded-full bg-card"
          >
            <ChevronLeftIcon className="size-5 text-highlight" />
          </button>
          <h1 className="text-lg font-bold">Carrinho de NFTs</h1>
        </div>
        <nav aria-label="Trilha" className="text-sm font-bold tracking-wide max-md:hidden">
          <ol className="flex gap-2">
            <li>
              <Link to="/">Início</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/" hash="mercado">
                Mercado
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Carrinho</li>
          </ol>
        </nav>
        <h1 className="sr-only max-md:hidden">Carrinho</h1>

        <CartNotices />

        {cart.isError && !cart.data ? (
          <div role="alert" className="flex flex-col items-center gap-4 bg-card py-16 text-center">
            <p className="font-bold">Não foi possível carregar seu carrinho.</p>
            <Button onClick={() => cart.refetch()}>Tentar novamente</Button>
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center gap-4 bg-card py-16 text-center">
            <p className="font-bold">Seu carrinho está vazio.</p>
            <p className="text-sm text-muted-foreground">
              Explore o mercado e adicione NFTs para continuar.
            </p>
            <Button asChild>
              <Link to="/" hash="mercado">
                Explorar o mercado
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-[1fr_332px] md:gap-[86px]">
            <table className="block w-full md:table">
              <caption className="sr-only">Itens no carrinho</caption>
              <thead className="max-md:sr-only">
                <tr className="border-b border-border text-left text-[15px] font-bold tracking-wide">
                  <th scope="col" colSpan={2} className="pb-3">
                    NFTs
                  </th>
                  <th scope="col" className="pb-3">
                    Preço
                  </th>
                  <th scope="col" className="pb-3">
                    Edições
                  </th>
                  <th scope="col" className="pb-3">
                    Total
                  </th>
                  <th scope="col" className="pb-3">
                    <span className="sr-only">Remover</span>
                  </th>
                </tr>
              </thead>
              <tbody className="flex flex-col gap-3 md:table-row-group [&>tr]:md:border-t-[12px] [&>tr]:md:border-background">
                {items
                  ? items.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        line={quote.data?.lines.find((l) => l.itemId === item.id)}
                      />
                    ))
                  : [0, 1, 2].map((i) => (
                      <tr key={i} className="block md:table-row">
                        <td colSpan={6}>
                          <Skeleton className="h-[70px] w-full" />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            <Summary
              quote={quote.data}
              couponCode={cart.data?.couponCode ?? null}
              empty={!items?.length}
            />
          </div>
        )}
      </div>
      <NftRow title="Colecionadores também viram" query={{ tab: 'trending' }} />
    </div>
  )
}
