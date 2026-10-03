import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/favorites')({
  component: FavoritesPage,
})

function FavoritesPage() {
  return <h1>Lista de interesse</h1>
}
