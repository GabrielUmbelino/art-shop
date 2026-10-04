import { SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { NftImage } from '@/components/nft-image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from 'cn'

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [current, setCurrent] = useState(0)
  return (
    <div className="flex gap-6 max-md:flex-col-reverse">
      <ul
        className="flex shrink-0 gap-3 max-md:hidden md:w-[89px] md:flex-col"
        aria-label="Imagens"
      >
        {images.map((image, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Imagem ${i + 1} de ${images.length}`}
              aria-current={i === current}
              className={cn(
                'block w-full ring-primary focus-visible:outline-2 focus-visible:outline-ring',
                i === current && 'ring-2',
              )}
            >
              <NftImage src={image} alt="" sizes="89px" />
            </button>
          </li>
        ))}
      </ul>
      <div className="relative flex-1 self-start bg-card p-5 max-md:p-0">
        <NftImage
          src={images[current]}
          alt={name}
          priority
          sizes="(min-width: 768px) 400px, 100vw"
          className="rounded-2xl"
        />
        <Dialog>
          <DialogTrigger
            className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-background/80 hover:text-highlight focus-visible:outline-2 focus-visible:outline-ring max-md:hidden"
            aria-label="Ampliar imagem"
          >
            <SearchIcon className="size-5" />
          </DialogTrigger>
          <DialogContent className="bg-card p-2 sm:max-w-[min(90vw,900px)]">
            <DialogTitle className="sr-only">{name}</DialogTitle>
            <DialogDescription className="sr-only">Imagem ampliada</DialogDescription>
            <img
              src={images[current]}
              alt={name}
              width={960}
              height={960}
              className="h-auto w-full"
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
