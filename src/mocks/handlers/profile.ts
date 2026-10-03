import { http, HttpResponse } from 'msw'
import { passwordChangeBody, profileUpdateBody } from '@/contracts/user'
import { save } from '../db/store'
import { body, fail, hashPassword, requireUser } from '../lib'
import { toUser, uniquenessErrors } from './auth'

export const profileHandlers = [
  http.get('/api/profile', ({ request }) => HttpResponse.json(toUser(requireUser(request)))),

  http.patch('/api/profile', async ({ request }) => {
    const user = requireUser(request)
    const input = await body(request, profileUpdateBody)
    const fieldErrors = uniquenessErrors(input, user.id)
    if (fieldErrors) fail('CONFLICT', { fieldErrors })
    Object.assign(user, input)
    save()
    return HttpResponse.json(toUser(user))
  }),

  http.put('/api/profile/password', async ({ request }) => {
    const user = requireUser(request)
    const input = await body(request, passwordChangeBody)
    if ((await hashPassword(user.passwordSalt, input.currentPassword)) !== user.passwordHash)
      fail('VALIDATION_ERROR', {
        fieldErrors: { currentPassword: 'Senha atual incorreta' },
      })
    user.passwordSalt = crypto.randomUUID()
    user.passwordHash = await hashPassword(user.passwordSalt, input.newPassword)
    save()
    return new HttpResponse(null, { status: 204 })
  }),
]
