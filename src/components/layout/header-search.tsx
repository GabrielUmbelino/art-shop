import { useNavigate } from '@tanstack/react-router'
import { SearchIcon, XIcon } from 'lucide-react'
import { useRef, useState } from 'react'

/** The desktop design has a search icon but no field: the icon opens one inline. */
export function HeaderSearch() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  if (!open)
    return (
      <button
        type="button"
        aria-label="Buscar NFTs"
        aria-expanded={false}
        onClick={() => {
          setOpen(true)
          requestAnimationFrame(() => input.current?.focus())
        }}
        className="hover:text-highlight focus-visible:outline-2 focus-visible:outline-ring"
      >
        <SearchIcon className="size-6" />
      </button>
    )

  return (
    <search>
      <form
        className="flex items-center gap-2 border-b border-primary"
        onSubmit={(e) => {
          e.preventDefault()
          void navigate({ to: '/', search: { q: text.trim() || undefined }, hash: 'mercado' })
          setOpen(false)
        }}
      >
        <SearchIcon className="size-5 text-subtle" aria-hidden="true" />
        <label htmlFor="header-search" className="sr-only">
          Buscar NFTs
        </label>
        <input
          id="header-search"
          ref={input}
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          placeholder="Buscar NFTs, coleções, criadores"
          className="h-8 w-56 bg-transparent text-sm placeholder:text-subtle focus-visible:outline-none"
        />
        <button
          type="button"
          aria-label="Fechar busca"
          onClick={() => setOpen(false)}
          className="text-subtle hover:text-highlight"
        >
          <XIcon className="size-4" />
        </button>
      </form>
    </search>
  )
}
