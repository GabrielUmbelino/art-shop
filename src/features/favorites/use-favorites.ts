import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { favoritesApi, favoritesKey, favoritesQuery } from '@/api/favorites'
import type { Favorites, NftSummary } from '@/contracts/nft'
import { useSession } from '@/features/auth/use-auth'
import { announce } from '@/lib/announce'

export function useFavorites() {
  const session = useSession()
  return useQuery({ ...favoritesQuery(session?.user.id ?? ''), enabled: !!session })
}

export function useIsFavorite(nftId: string) {
  return useFavorites().data?.items.some((item) => item.id === nftId) ?? false
}

/**
 * Optimistic toggle: the heart changes immediately, the list is restored if the API fails.
 * Signed-out users are sent to login and brought back to the same page.
 */
export function useToggleFavorite() {
  const session = useSession()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { href } = useLocation()

  const mutation = useMutation({
    mutationFn: ({ nft, add }: { nft: NftSummary; add: boolean }) =>
      add ? favoritesApi.add(nft.id) : favoritesApi.remove(nft.id),
    onMutate: async ({ nft, add }) => {
      const key = favoritesKey(session!.user.id)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Favorites>(key)
      queryClient.setQueryData<Favorites>(key, (current) => {
        const items = (current?.items ?? []).filter((item) => item.id !== nft.id)
        return { items: add ? [...items, nft] : items }
      })
      announce(
        add
          ? `${nft.name} adicionado à lista de interesse`
          : `${nft.name} removido da lista de interesse`,
      )
      return { key, previous }
    },
    onError: (_error, { nft, add }, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous)
      toast.error(
        add
          ? `Não foi possível favoritar ${nft.name}. Tente novamente.`
          : `Não foi possível remover ${nft.name} da lista. Tente novamente.`,
      )
    },
    onSettled: (_data, _error, _vars, context) => {
      if (context) void queryClient.invalidateQueries({ queryKey: context.key })
    },
  })

  return (nft: NftSummary, add: boolean) => {
    if (!session) {
      void navigate({ to: '/login', search: { redirect: href } })
      return
    }
    mutation.mutate({ nft, add })
  }
}
