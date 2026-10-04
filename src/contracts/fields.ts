import { z } from 'zod'

/** Field rules shared by profile, wallets and checkout, so the same value validates the same way everywhere. */

export const ensPattern = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.eth$/
export const addressPattern = /^0x[a-fA-F0-9]{40}$/

export const displayName = z.string().trim().min(2, 'Informe o nome de exibição')
export const username = z
  .string()
  .trim()
  .regex(/^[a-z0-9_]{3,20}$/, 'Use de 3 a 20 letras minúsculas, números ou _')
export const email = z.email('Informe um e-mail válido')
export const ensName = z.string().trim().regex(ensPattern, 'Use um nome ENS válido, como nome.eth')
export const referralCode = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9]{4,12}$/, 'Use de 4 a 12 letras ou números')
export const walletAddress = z
  .string()
  .trim()
  .regex(addressPattern, 'Informe um endereço válido (0x seguido de 40 caracteres hexadecimais)')
/** ENS name or 0x address of a secondary wallet; empty when not informed. */
export const secondaryAddress = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || ensPattern.test(v) || addressPattern.test(v),
    'Use um nome ENS ou um endereço 0x válido',
  )
export const nickname = z
  .string()
  .trim()
  .min(2, 'Informe um apelido')
  .max(40, 'Use no máximo 40 caracteres')
