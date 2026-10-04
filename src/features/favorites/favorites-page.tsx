import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { NftCard, NftCardSkeleton } from '@/features/catalog/nft-card'
import { useFavorites } from './use-favorites'

export function FavoritesPage() {
  const favorites = useFavorites()
  return (
    <section className="page-container flex flex-col gap-6 py-8">
      <h1 className="text-lg font-bold tracking-wide">Lista de interesse</h1>
      {favorites.isError ? (
        <div role="alert" className="flex flex-col items-center gap-4 bg-card py-16 text-center">
          <p className="font-bold">Não foi possível carregar sua lista.</p>
          <Button onClick={() => favorites.refetch()}>Tentar novamente</Button>
        </div>
      ) : favorites.data?.items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 bg-card py-16 text-center">
          <p className="font-bold">Sua lista de interesse está vazia.</p>
          <p className="text-sm text-muted-foreground">
            Toque no coração de um NFT para guardá-lo aqui.
          </p>
          <Button asChild>
            <Link to="/" hash="mercado">
              Explorar o mercado
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <h2 className="sr-only">NFTs salvos</h2>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-6 lg:grid-cols-4">
            {favorites.data
              ? favorites.data.items.map((nft) => (
                  <li key={nft.id}>
                    <NftCard nft={nft} />
                  </li>
                ))
              : Array.from({ length: 4 }, (_, i) => (
                  <li key={i}>
                    <NftCardSkeleton />
                  </li>
                ))}
          </ul>
        </>
      )}
    </section>
  )
}
