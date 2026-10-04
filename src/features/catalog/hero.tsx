import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'
import { useState } from 'react'
import { NftImage } from '@/components/nft-image'
import { Button } from '@/components/ui/button'
import { cn } from 'cn'

/** Static marketing slides: no API dependency, so the hero image can be the fast LCP element. */
const slides = [
  { image: '/assets/nfts/ape-emerald-960.jpg', alt: 'Macaco com óculos escuros e jaqueta verde' },
  { image: '/assets/nfts/ape-nomad-960.jpg', alt: 'Macaco com chapéu e moletom roxo' },
  { image: '/assets/nfts/ape-golden-960.jpg', alt: 'Macaco dourado com fones de ouvido' },
]

export function Hero() {
  const [current, setCurrent] = useState(0)
  const slide = slides[current]

  return (
    <section aria-labelledby="hero-title" className="page-container pt-4 md:pt-10">
      <div className="grid items-center gap-6 max-md:grid-cols-[1fr_120px] max-md:rounded-2xl max-md:bg-card max-md:p-4 md:grid-cols-[1fr_450px] md:gap-12">
        <div className="flex flex-col gap-3 md:gap-5 md:pl-10">
          <p className="text-xs tracking-[0.12em] md:text-sm">Bem-vindo à Kurio</p>
          <h1
            id="hero-title"
            className="text-base leading-snug font-bold tracking-[0.06em] uppercase md:text-[40px] md:leading-[1.75]"
          >
            <span className="md:hidden">Seja dono da cultura digital</span>
            <span className="max-md:hidden">
              Seja dono do futuro <br />
              da arte digital
            </span>
          </h1>
          <p className="max-w-[560px] text-[10px] leading-relaxed tracking-wide text-muted-foreground md:text-sm md:leading-6">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
            rara, apoie artistas e tenha uma parte da cultura da internet.
          </p>
          <Button
            asChild
            className="w-fit px-7 uppercase max-md:h-auto max-md:bg-transparent max-md:p-0 max-md:text-xs max-md:text-highlight md:mt-5"
          >
            <Link to="/" hash="mercado">
              Explorar <ArrowRightIcon className="md:hidden" />
            </Link>
          </Button>
          <div className="flex justify-center gap-2 md:mt-10 md:justify-end md:pr-16">
            {slides.map((s, i) => (
              <button
                key={s.image}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Destaque ${i + 1} de ${slides.length}`}
                aria-current={i === current}
                className={cn(
                  'size-2 rounded-full bg-primary/50 focus-visible:outline-2 focus-visible:outline-ring',
                  i === current && 'bg-primary',
                )}
              />
            ))}
          </div>
        </div>
        <NftImage
          src={slide.image}
          alt={slide.alt}
          priority
          sizes="(min-width: 768px) 450px, 120px"
          className="rounded-3xl max-md:rounded-xl"
        />
      </div>
    </section>
  )
}
