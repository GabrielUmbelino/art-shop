import { z } from 'zod'
import { isoDate } from './common'

export const user = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  email: z.email(),
  bio: z.string(),
  avatarUrl: z.string().nullable(),
  createdAt: isoDate,
})
export type User = z.infer<typeof user>

const password = z
  .string()
  .min(8, 'Use pelo menos 8 caracteres')
  .regex(/[A-Za-z]/, 'Inclua uma letra')
  .regex(/\d/, 'Inclua um número')

const name = z.string().trim().min(2, 'Informe seu nome de exibição')
const username = z
  .string()
  .trim()
  .regex(/^[a-z0-9_]{3,20}$/, 'Use de 3 a 20 letras minúsculas, números ou _')
const email = z.email('Informe um e-mail válido')

/** The display name starts as the username; it can be changed in the profile. */
export const signupBody = z.object({ username, email, password })
export type SignupBody = z.infer<typeof signupBody>

export const loginBody = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha'),
})
export type LoginBody = z.infer<typeof loginBody>

export const session = z.object({
  token: z.string(),
  expiresAt: isoDate,
  user,
})
export type Session = z.infer<typeof session>

export const profileUpdateBody = z
  .object({
    name,
    username,
    email,
    bio: z.string().max(280, 'Use no máximo 280 caracteres'),
    /** data: URL of the new avatar, or null to remove it. */
    avatarUrl: z
      .string()
      .regex(/^data:image\/(png|jpeg|webp|gif);base64,/, 'Use uma imagem PNG, JPEG, WebP ou GIF')
      .max(1_400_000, 'Use uma imagem de até 1 MB')
      .nullable()
      .optional(),
  })
  .partial()
export type ProfileUpdateBody = z.infer<typeof profileUpdateBody>

export const passwordChangeBody = z.object({
  currentPassword: z.string().min(1, 'Informe sua senha atual'),
  newPassword: password,
})
export type PasswordChangeBody = z.infer<typeof passwordChangeBody>
