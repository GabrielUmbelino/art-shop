/**
 * Private data is cached under ['private', userId, ...], so one user's data can never be
 * served to another and everything private is dropped with a single removeQueries call.
 */
export const privateKey = (userId: string, ...parts: unknown[]) =>
  ['private', userId, ...parts] as const

export const privateRoot = ['private'] as const
