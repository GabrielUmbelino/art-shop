import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from 'cn'

const cell =
  'flex size-8 items-center justify-center rounded-sm border border-border text-sm hover:border-primary focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40'

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Paginação" className="flex justify-end gap-2">
      <button
        type="button"
        className={cell}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Página anterior"
      >
        <ChevronLeftIcon className="size-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          aria-label={`Página ${n}`}
          className={cn(
            cell,
            n === page && 'border-primary bg-primary font-bold text-primary-foreground',
          )}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        className={cell}
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Próxima página"
      >
        <ChevronRightIcon className="size-4" />
      </button>
    </nav>
  )
}
