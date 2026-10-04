import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cartApi, cartKey, cartQuery, quoteQuery } from '@/api/cart'
import { ApiError } from '@/api/http'
import type { AddCartItemBody, Cart } from '@/contracts/cart'
import type { Network } from '@/contracts/common'
import { useSession } from '@/features/auth/use-auth'

const useCartUser = () => useSession()?.user.id ?? null

export const useCart = () => useQuery(cartQuery(useCartUser()))

/** The quote is the source of truth for totals; it is refetched after every cart change. */
export const useQuote = (network: Network = 'ethereum') =>
  useQuery(quoteQuery(useCartUser(), network))

/** Shared plumbing: store the returned cart, refresh the quote, explain stock errors. */
function useCartMutation<T>(
  fn: (input: T) => Promise<Cart>,
  options: { silentErrors?: boolean } = {},
) {
  const queryClient = useQueryClient()
  const key = cartKey(useCartUser())
  return useMutation({
    mutationFn: fn,
    onSuccess: (cart) => {
      queryClient.setQueryData(key, cart)
      void queryClient.invalidateQueries({ queryKey: [...key, 'quote'] })
    },
    onError: (error) => {
      if (options.silentErrors) return
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível atualizar o carrinho.',
      )
      // Stock may have changed: show the cart as the API sees it now.
      void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

export const useAddToCart = () => useCartMutation((body: AddCartItemBody) => cartApi.add(body))
export const useSetQuantity = () =>
  useCartMutation(({ itemId, quantity }: { itemId: string; quantity: number }) =>
    cartApi.setQuantity(itemId, quantity),
  )
export const useRemoveItem = () => useCartMutation((itemId: string) => cartApi.remove(itemId))
/** Coupon errors are shown on the field, not as a toast. */
export const useApplyCoupon = () =>
  useCartMutation((code: string) => cartApi.applyCoupon(code), { silentErrors: true })
export const useRemoveCoupon = () => useCartMutation(() => cartApi.removeCoupon())
