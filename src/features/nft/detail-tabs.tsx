import { Stars } from '@/components/stars'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Nft } from '@/contracts/nft'
import { formatDate, networkLabels, shortHash } from '@/lib/format'

const trigger =
  'h-auto flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 text-base tracking-wide text-foreground data-active:border-highlight data-active:bg-transparent data-active:font-bold data-active:text-highlight data-active:shadow-none'

export function DetailTabs({ nft }: { nft: Nft }) {
  const network = networkLabels[nft.network]
  return (
    <Tabs defaultValue="details" className="gap-4">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-x-8 gap-y-2 rounded-none border-b border-border bg-transparent p-0">
        <TabsTrigger value="details" className={trigger}>
          Detalhes do NFT
        </TabsTrigger>
        <TabsTrigger value="reviews" className={trigger}>
          <span className="md:hidden">Avaliações ({nft.rating.count})</span>
          <span className="max-md:hidden">Avaliações de colecionadores ({nft.rating.count})</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="details"
        className="flex flex-col gap-4 text-sm leading-relaxed tracking-wide text-muted-foreground"
      >
        <p>
          {nft.name} é uma obra digital finalizada à mão da coleção {nft.collection}. Cada atributo
          fica armazenado nos metadados do token e verificado na {network}. A obra explora
          identidade, movimento e luz em um mundo digital sem fronteiras.
        </p>
        <p>
          A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores
          e um registro permanente de procedência registrada na rede. {nft.creator.name} recebe{' '}
          {nft.royaltyPercent}% de direitos autorais nas vendas secundárias, apoiando novos
          trabalhos e lançamentos da comunidade.
        </p>
        <dl className="flex flex-col gap-3">
          <div>
            <dt className="font-bold text-foreground">Rede:</dt>
            <dd>Cunhado na {network} com procedência imutável e metadados armazenados no IPFS.</dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Contrato:</dt>
            <dd>{shortHash(nft.contractAddress)} · Contrato inteligente ERC-721 verificado.</dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Direitos autorais:</dt>
            <dd>
              Direitos autorais do criador: {nft.royaltyPercent}% nas vendas secundárias, pagos
              automaticamente pelos mercados compatíveis.
            </dd>
          </div>
        </dl>
      </TabsContent>
      <TabsContent value="reviews">
        <ul className="flex flex-col divide-y divide-border">
          {nft.reviews.map((review) => (
            <li key={review.id} className="flex flex-col gap-1 py-4 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold">{review.author}</span>
                <Stars rating={review.rating} />
                <span className="text-subtle">{formatDate(review.createdAt)}</span>
              </div>
              <p className="tracking-wide text-muted-foreground">{review.comment}</p>
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  )
}
