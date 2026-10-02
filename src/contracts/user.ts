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
  .min(8, 'Use at least 8 characters')
  .regex(/[A-Za-z]/, 'Include a letter')
  .regex(/\d/, 'Include a number')

export const signupBody = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  username: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{3,20}$/, 'Use 3-20 lowercase letters, numbers or _'),
  email: z.email('Enter a valid email'),
  password,
})
export type SignupBody = z.infer<typeof signupBody>

export const loginBody = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})
export type LoginBody = z.infer<typeof loginBody>

export const session = z.object({
  token: z.string(),
  expiresAt: isoDate,
  user,
})
export type Session = z.infer<typeof session>

export const profileUpdateBody = signupBody
  .pick({ name: true, username: true, email: true })
  .extend({
    bio: z.string().max(280, 'Keep it under 280 characters'),
    /** data: URL of the new avatar, or null to remove it. */
    avatarUrl: z
      .string()
      .regex(/^data:image\/(png|jpeg|webp|gif);base64,/, 'Use a PNG, JPEG, WebP or GIF image')
      .max(1_400_000, 'Use an image under 1 MB')
      .nullable()
      .optional(),
  })
  .partial()
export type ProfileUpdateBody = z.infer<typeof profileUpdateBody>

export const passwordChangeBody = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: password,
})
export type PasswordChangeBody = z.infer<typeof passwordChangeBody>
