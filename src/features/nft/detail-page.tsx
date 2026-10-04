import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeftIcon, MailIcon, ShoppingCartIcon, StarIcon } from 'lucide-react'
import { useState } from 'react'
import { nftQuery } from '@/api/nfts'
import { ApiError } from '@/api/http'
import { LinkedinIcon, TwitterIcon } from '@/components/brand-icons'
import { Price } from '@/components/price'
import { QuantityStepper } from '@/components/quantity-stepper'
import { Stars } from '@/components/stars'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Nft } from '@/contracts/nft'
import { NftRow } from '@/features/catalog/nft-row'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { useAddToCart } from '@/features/cart/use-cart'
import { useAddWithToast } from '@/features/cart/use-quick-add'
import { DetailTabs } from './detail-tabs'
import { EditionPicker } from './edition-picker'
import { defaultEdition } from './editions'
import { Gallery } from './gallery'

function Breadcrumb() {
  return (
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
      </ol>
    </nav>
  )
}

function ShareLinks({ nft }: { nft: Nft }) {
  const url = encodeURIComponent(location.href)
  const text = encodeURIComponent(`${nft.name} na Kurio`)
  const link = 'hover:text-highlight focus-visible:outline-2 focus-visible:outline-ring'
  return (
    <p className="flex items-center gap-3 font-bold">
      Compartilhar este NFT:
      <a
        className={link}
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no LinkedIn (abre em nova aba)"
      >
        <LinkedinIcon className="size-4" />
      </a>
      <a
        className={link}
        href={`mailto:?subject=${text}&body=${url}`}
        aria-label="Compartilhar por e-mail"
      >
        <MailIcon className="size-4" />
      </a>
      <a
        className={link}
        href={`https://twitter.com/intent/tweet?text=${text}&url=${url}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no Twitter (abre em nova aba)"
      >
        <TwitterIcon className="size-4" />
      </a>
    </p>
  )
}

/** The edition in the URL, or the default one. Prices on the page follow the selected edition. */
const selectedEdition = (nft: Nft, editionId: string | undefined) =>
  nft.editions.find((e) => e.id === editionId) ?? defaultEdition(nft)

function Purchase({ nft, editionId }: { nft: Nft; editionId: string | undefined }) {
  const navigate = useNavigate()
  const edition = selectedEdition(nft, editionId)
  const [quantity, setQuantity] = useState(1)
  const max = Math.min(edition.available, nft.maxPerOrder)
  const soldOut = edition.available === 0
  const add = useAddToCart()
  const addWithToast = useAddWithToast()
  const item = { nftId: nft.id, editionId: edition.id, quantity }
  const buy = () => add.mutate(item, { onSuccess: () => void navigate({ to: '/cart' }) })
  const selectEdition = (id: string) => {
    setQuantity(1)
    void navigate({ to: '.', search: { edition: id }, replace: true, resetScroll: false })
  }

  return (
    <>
      <EditionPicker editions={nft.editions} value={edition.id} onChange={selectEdition} />
      {soldOut ? (
        <p role="alert" className="text-sm text-destructive">
          A edição {edition.name} está esgotada. Escolha outra edição.
        </p>
      ) : (
        <p className="text-xs text-subtle">
          {edition.supply === null
            ? 'Edição aberta'
            : `${edition.available} de ${edition.supply} disponíveis`}{' '}
          · limite de {max} por pedido
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 max-md:hidden">
        <QuantityStepper value={quantity} max={max} label="Quantidade" onChange={setQuantity} />
        <div className="flex gap-3">
          <Button className="w-[115px] uppercase" disabled={soldOut || add.isPending} onClick={buy}>
            Comprar
          </Button>
          <FavoriteButton
            nft={nft}
            label
            className="flex h-10 items-center gap-2 rounded-sm border border-primary px-3 text-sm font-bold text-highlight hover:bg-muted"
          />
        </div>
      </div>

      {/* Mobile purchase panel, fixed to the bottom as designed (replaces the tab bar on this page). */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-4 rounded-t-3xl bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm">Qtd.</span>
            <QuantityStepper value={quantity} max={max} label="Quantidade" onChange={setQuantity} />
          </div>
          <Price amount={edition.price} className="text-lg" />
        </div>
        <div className="flex gap-3">
          <Button
            size="lg"
            className="h-12 flex-1 rounded-full"
            disabled={soldOut || add.isPending}
            onClick={buy}
          >
            Comprar NFT
          </Button>
          <Button
            size="lg"
            className="size-12 rounded-full p-0"
            disabled={soldOut || add.isPending}
            onClick={() => addWithToast(item, nft.name)}
            aria-label="Adicionar ao carrinho"
          >
            <ShoppingCartIcon />
          </Button>
        </div>
      </div>
    </>
  )
}

function DetailSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,500px)_1fr]" aria-busy="true">
      <span className="sr-only">Carregando NFT...</span>
      <div className="flex gap-6">
        <div className="flex w-[89px] flex-col gap-3 max-md:hidden">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
        <Skeleton className="aspect-square flex-1 rounded-2xl" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-7 w-1/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

export function NftDetailPage({ id, edition }: { id: string; edition?: string }) {
  const query = useQuery(nftQuery(id))
  const router = useRouter()

  if (query.error instanceof ApiError && query.error.code === 'NOT_FOUND')
    return (
      <section className="page-container flex flex-col items-center gap-6 py-24 text-center">
        <h1 className="text-2xl font-bold">NFT não encontrado</h1>
        <p className="text-muted-foreground">Este NFT não existe ou foi removido do mercado.</p>
        <Button asChild>
          <Link to="/" hash="mercado">
            Explorar o mercado
          </Link>
        </Button>
      </section>
    )

  const nft = query.data
  return (
    <div className="page-container flex flex-col gap-16 py-6 pb-40 md:gap-24 md:pb-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between md:hidden">
          <button
            type="button"
            onClick={() => router.history.back()}
            aria-label="Voltar"
            className="flex size-10 items-center justify-center rounded-full bg-card"
          >
            <ChevronLeftIcon className="size-5 text-highlight" />
          </button>
          {nft && (
            <FavoriteButton
              nft={nft}
              className="flex size-10 items-center justify-center rounded-full bg-card text-highlight"
            />
          )}
        </div>
        <Breadcrumb />

        {query.isError && !nft ? (
          <div role="alert" className="flex flex-col items-center gap-4 bg-card py-16 text-center">
            <p className="font-bold">Não foi possível carregar este NFT.</p>
            <p className="text-sm text-muted-foreground">{query.error.message}</p>
            <Button onClick={() => query.refetch()} disabled={query.isFetching}>
              Tentar novamente
            </Button>
          </div>
        ) : !nft ? (
          <DetailSkeleton />
        ) : (
          <div className="grid gap-8 md:grid-cols-[minmax(0,500px)_1fr] md:gap-8">
            <Gallery images={nft.images} name={nft.name} />
            <div className="flex flex-col gap-4 tracking-wide">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h1 className="text-xl font-bold md:text-[28px]">{nft.name}</h1>
                <span className="flex items-center gap-1 rounded-full border border-primary px-2 text-sm md:hidden">
                  <StarIcon className="size-3 fill-primary text-primary" aria-hidden="true" />
                  {nft.rating.average.toLocaleString('pt-BR')} ({nft.rating.count})
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 max-md:hidden">
                <Price
                  amount={selectedEdition(nft, edition).price}
                  compareAt={
                    selectedEdition(nft, edition).price === nft.price ? nft.compareAtPrice : null
                  }
                  className="text-xl"
                />
                <p className="flex items-center gap-2 text-sm">
                  <Stars rating={nft.rating.average} /> {nft.rating.count} avaliações de
                  colecionadores
                </p>
              </div>
              <h2 className="font-bold max-md:sr-only">Sobre este NFT:</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{nft.description}</p>
              <Purchase key={nft.id} nft={nft} editionId={edition} />
              <dl className="flex flex-col gap-2 text-sm text-subtle">
                <div className="flex gap-1">
                  <dt>ID do token:</dt>
                  <dd>{nft.tokenId}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>Coleção:</dt>
                  <dd>{nft.collection}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>Atributos:</dt>
                  <dd>{nft.attributes.join(', ')}</dd>
                </div>
              </dl>
              <ShareLinks nft={nft} />
            </div>
          </div>
        )}
      </div>

      {nft ? (
        <>
          <DetailTabs nft={nft} />
          <NftRow
            title="Mais desta coleção"
            query={{ collection: nft.collection }}
            excludeId={nft.id}
          />
        </>
      ) : (
        !query.isError && (
          // Reserves the space of the tabs and related NFTs, so the footer does not jump when they load.
          <div aria-hidden="true" className="flex flex-col gap-16 md:gap-24">
            <Skeleton className="h-[280px] w-full" />
            <Skeleton className="h-[380px] w-full" />
          </div>
        )
      )}
    </div>
  )
}
