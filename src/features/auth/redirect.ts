import { z } from 'zod'

/** Only same-origin paths, so ?redirect= cannot send users to another site. */
export const safeRedirect = z
  .string()
  .refine((path) => path.startsWith('/') && !path.startsWith('//'))
  .optional()
  .catch(undefined)

export const authSearch = z.object({
  redirect: safeRedirect,
  reason: z.enum(['expired']).optional().catch(undefined),
})
export type AuthSearch = z.infer<typeof authSearch>
