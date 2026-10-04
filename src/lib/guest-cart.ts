/** Id of the anonymous cart, kept so a guest's cart survives refresh until it is merged on login. */
const KEY = 'kurio:cart'

export const getGuestCartId = () => localStorage.getItem(KEY)
export const setGuestCartId = (id: string) => localStorage.setItem(KEY, id)
export const clearGuestCartId = () => localStorage.removeItem(KEY)
