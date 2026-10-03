import { http, HttpResponse } from 'msw'
import { loginBody, signupBody, type Session, type User } from '@/contracts/user'
import { db, nextId, now, save, type UserRecord } from '../db/store'
import { body, fail, hashPassword, requireUser } from '../lib'

export const toUser = ({ passwordSalt: _s, passwordHash: _h, ...user }: UserRecord): User => user

function startSession(user: UserRecord): Session {
  const session = {
    token: crypto.randomUUID(),
    userId: user.id,
    expiresAt: new Date(Date.now() + db.config.sessionTtlMs).toISOString(),
  }
  db.sessions.push(session)
  save()
  return { token: session.token, expiresAt: session.expiresAt, user: toUser(user) }
}

export function uniquenessErrors(
  fields: { email?: string; username?: string },
  exceptUserId?: string,
) {
  const others = db.users.filter((u) => u.id !== exceptUserId)
  const fieldErrors: Record<string, string> = {}
  if (fields.email && others.some((u) => u.email.toLowerCase() === fields.email!.toLowerCase()))
    fieldErrors.email = 'Já existe uma conta com este e-mail'
  if (fields.username && others.some((u) => u.username === fields.username))
    fieldErrors.username = 'Este nome de usuário já está em uso'
  return Object.keys(fieldErrors).length ? fieldErrors : null
}

export const authHandlers = [
  http.post('/api/auth/signup', async ({ request }) => {
    const input = await body(request, signupBody)
    const fieldErrors = uniquenessErrors(input)
    if (fieldErrors) fail('CONFLICT', { fieldErrors })
    const passwordSalt = crypto.randomUUID()
    const user: UserRecord = {
      id: nextId('user'),
      name: input.username,
      username: input.username,
      email: input.email,
      bio: '',
      avatarUrl: null,
      createdAt: now(),
      passwordSalt,
      passwordHash: await hashPassword(passwordSalt, input.password),
    }
    db.users.push(user)
    return HttpResponse.json(startSession(user), { status: 201 })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const input = await body(request, loginBody)
    const user = db.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase())
    if (!user || (await hashPassword(user.passwordSalt, input.password)) !== user.passwordHash)
      fail('VALIDATION_ERROR', { message: 'E-mail ou senha inválidos' })
    return HttpResponse.json(startSession(user))
  }),

  http.get('/api/auth/session', ({ request }) => {
    const user = requireUser(request)
    const token = request.headers.get('Authorization')!.replace(/^Bearer /, '')
    const session = db.sessions.find((s) => s.token === token)!
    return HttpResponse.json<Session>({ token, expiresAt: session.expiresAt, user: toUser(user) })
  }),

  http.post('/api/auth/logout', ({ request }) => {
    const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
    db.sessions = db.sessions.filter((s) => s.token !== token)
    save()
    return new HttpResponse(null, { status: 204 })
  }),
]
