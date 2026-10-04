import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'
import { ComingSoon } from '@/components/coming-soon'
import { NftImage } from '@/components/nft-image'
import { Button } from '@/components/ui/button'

const promos = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: '/assets/nfts/ape-emerald-960.jpg',
    search: { tab: 'new' as const },
  },
  {
    title: 'Arte digital selecionada e muito mais',
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: '/assets/nfts/ape-ivory-960.jpg',
    search: { category: ['digital-art' as const] },
  },
]

const posts = [
  {
    date: '12 de setembro',
    read: 6,
    title: 'Como funciona a propriedade de NFTs',
    text: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: 'ape-ivory',
  },
  {
    date: '13 de setembro',
    read: 2,
    title: '10 artistas digitais para acompanhar',
    text: 'Conheça criadores que moldam a cultura digital.',
    image: 'ape-emerald',
  },
  {
    date: '15 de setembro',
    read: 3,
    title: 'Raridade, atributos e procedência',
    text: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: 'ape-nomad',
  },
  {
    date: '15 de setembro',
    read: 2,
    title: 'Como proteger sua carteira',
    text: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: 'ape-golden',
  },
]

export function Promos() {
  return (
    <section
      aria-label="Coleções em destaque"
      className="page-container grid gap-6 py-12 md:grid-cols-2 md:gap-11"
    >
      {promos.map((promo) => (
        <article
          key={promo.title}
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center bg-card"
        >
          <NftImage src={promo.image} alt="" sizes="(min-width: 768px) 290px, 50vw" />
          <div className="flex flex-col items-end gap-3 p-4 text-right">
            <h3 className="text-sm font-bold tracking-wide md:text-base">{promo.title}</h3>
            <p className="text-xs leading-relaxed tracking-wide text-muted-foreground">
              {promo.text}
            </p>
            <Button asChild size="sm" className="px-4">
              <Link to="/" search={promo.search} hash="mercado">
                Explorar <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </section>
  )
}

/** Editorial teaser from the design. Articles are out of scope, so "Ler mais" says so. */
export function Journal() {
  return (
    <section
      aria-labelledby="journal-title"
      className="page-container flex flex-col gap-3 py-12 text-center"
    >
      <h2 id="journal-title" className="text-2xl font-bold tracking-wide">
        Diário da Cunhagem
      </h2>
      <p className="text-sm tracking-wide text-muted-foreground">
        Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
      </p>
      <ul className="mt-6 grid gap-6 text-left sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <li key={post.title} className="flex flex-col bg-card">
            <img
              src={`/assets/nfts/${post.image}-480.avif`}
              alt=""
              width={480}
              height={480}
              loading="lazy"
              className="aspect-[3/2] w-full object-cover object-top"
            />
            <div className="flex flex-1 flex-col gap-2 p-4">
              <p className="text-[10px] tracking-wide text-subtle">
                {post.date} | Leitura de {post.read} min
              </p>
              <h3 className="text-sm font-bold tracking-wide">{post.title}</h3>
              <p className="text-xs tracking-wide text-muted-foreground">{post.text}</p>
              <ComingSoon className="mt-auto w-fit text-xs text-highlight">
                Ler mais <span aria-hidden="true">→</span>
                <span className="sr-only">: {post.title}</span>
              </ComingSoon>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
