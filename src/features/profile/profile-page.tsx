import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ImageIcon } from 'lucide-react'
import { useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { sessionKey } from '@/api/auth'
import { profileApi, profileQuery } from '@/api/profile'
import { PasswordInput } from '@/components/password-input'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { displayName, email, ensName, nickname, username } from '@/contracts/fields'
import { password, type Session, type User } from '@/contracts/user'
import { inputClass, LabeledField } from '@/features/checkout/fields'
import { useSession } from '@/features/auth/use-auth'
import { applyApiError } from '@/lib/form'

const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const AVATAR_MAX_BYTES = 1024 * 1024

const profileForm = z
  .object({
    name: displayName,
    username,
    email,
    ensName,
    walletNickname: nickname,
    avatarUrl: z.string().nullable(),
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((v, ctx) => {
    // The password section is optional: validated only when any of its fields is filled.
    if (!v.currentPassword && !v.newPassword && !v.confirmPassword) return
    if (!v.currentPassword)
      ctx.addIssue({
        code: 'custom',
        path: ['currentPassword'],
        message: 'Informe sua senha atual',
      })
    const next = password.safeParse(v.newPassword)
    if (!next.success)
      ctx.addIssue({ code: 'custom', path: ['newPassword'], message: next.error.issues[0].message })
    if (v.confirmPassword !== v.newPassword)
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'As senhas não coincidem',
      })
  })
type ProfileForm = z.infer<typeof profileForm>

const toForm = (user: User): ProfileForm => ({
  name: user.name,
  username: user.username,
  email: user.email,
  ensName: user.ensName,
  walletNickname: user.walletNickname,
  avatarUrl: user.avatarUrl,
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

function ProfileFormView({ user }: { user: User }) {
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileForm),
    defaultValues: toForm(user),
  })
  const { errors, isSubmitting, dirtyFields } = form.formState
  const [avatarUrl, ensValue] = useWatch({ control: form.control, name: ['avatarUrl', 'ensName'] })

  const pickAvatar = (file: File | undefined) => {
    if (!file) return
    if (!AVATAR_TYPES.includes(file.type))
      return form.setError('avatarUrl', { message: 'Use uma imagem PNG, JPEG, WebP ou GIF' })
    if (file.size > AVATAR_MAX_BYTES)
      return form.setError('avatarUrl', { message: 'Use uma imagem de até 1 MB' })
    const reader = new FileReader()
    reader.onload = () => {
      form.clearErrors('avatarUrl')
      form.setValue('avatarUrl', reader.result as string, { shouldDirty: true })
    }
    reader.readAsDataURL(file)
  }

  const submit = form.handleSubmit(async (values) => {
    const { currentPassword, newPassword, confirmPassword: _confirm, ...profile } = values
    const profileChanged = (
      ['name', 'username', 'email', 'ensName', 'walletNickname', 'avatarUrl'] as const
    ).some((field) => dirtyFields[field])
    try {
      let saved = user
      if (profileChanged) {
        saved = await profileApi.update(profile)
        queryClient.setQueryData(profileQuery(user.id).queryKey, saved)
        queryClient.setQueryData<Session | null>(
          sessionKey,
          (session) => session && { ...session, user: saved },
        )
      }
      if (newPassword) await profileApi.changePassword({ currentPassword, newPassword })
      if (profileChanged || newPassword)
        toast.success(newPassword ? 'Perfil e senha atualizados.' : 'Perfil atualizado.')
      form.reset(toForm(saved))
    } catch (error) {
      applyApiError(error, form.setError)
    }
  })

  const text = (
    name: 'name' | 'username' | 'email' | 'walletNickname',
    label: string,
    type = 'text',
  ) => (
    <LabeledField label={label} required error={errors[name]}>
      {(control) => (
        <input {...control} type={type} className={inputClass} {...form.register(name)} />
      )}
    </LabeledField>
  )
  const secret = (
    name: 'currentPassword' | 'newPassword' | 'confirmPassword',
    label: string,
    autoComplete: string,
  ) => (
    <LabeledField label={label} error={errors[name]}>
      {(control) => (
        <PasswordInput {...control} autoComplete={autoComplete} {...form.register(name)} />
      )}
    </LabeledField>
  )

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <h1 className="text-base font-bold tracking-wide">Perfil do colecionador</h1>
      <div className="grid gap-x-7 gap-y-5 md:grid-cols-2">
        {text('name', 'Nome de exibição')}
        {text('username', 'Nome de usuário')}
        {text('email', 'E-mail', 'email')}
        <LabeledField label="Nome ENS" required error={errors.ensName}>
          {(control) => (
            <div className="flex gap-2">
              <span
                className="flex h-10 items-center rounded-[2.5px] border border-input px-3 text-sm"
                aria-hidden="true"
              >
                .eth
              </span>
              <input
                {...control}
                value={ensValue.replace(/\.eth$/, '')}
                onChange={(e) =>
                  form.setValue('ensName', e.target.value ? `${e.target.value.trim()}.eth` : '', {
                    shouldDirty: true,
                  })
                }
                placeholder="nome"
                className={inputClass}
              />
            </div>
          )}
        </LabeledField>
        {text('walletNickname', 'Apelido da carteira')}
        <div className="flex flex-col gap-2">
          <span className="text-[15px] tracking-wide" id="avatar-label">
            Avatar
          </span>
          <div className="flex items-center gap-6" role="group" aria-labelledby="avatar-label">
            <span className="flex size-12 items-center justify-center overflow-hidden rounded-full border border-border bg-card">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Seu avatar" className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-5 text-primary" aria-hidden="true" />
              )}
            </span>
            <input
              ref={fileInput}
              type="file"
              accept={AVATAR_TYPES.join(',')}
              className="sr-only"
              tabIndex={-1}
              aria-label="Escolher imagem do avatar"
              onChange={(e) => {
                pickAvatar(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <Button type="button" className="px-6" onClick={() => fileInput.current?.click()}>
              Alterar
            </Button>
            <button
              type="button"
              disabled={!avatarUrl}
              onClick={() => form.setValue('avatarUrl', null, { shouldDirty: true })}
              className="text-sm hover:text-highlight disabled:opacity-40"
            >
              Remover
            </button>
          </div>
          <FieldError errors={[errors.avatarUrl]} />
        </div>
      </div>

      <fieldset className="flex flex-col gap-4 md:max-w-[417px]">
        <legend className="mb-4 text-base font-bold tracking-wide">Alterar senha</legend>
        {secret('currentPassword', 'Senha atual', 'current-password')}
        {secret('newPassword', 'Nova senha', 'new-password')}
        {secret('confirmPassword', 'Confirmar nova senha', 'new-password')}
      </fieldset>

      <FieldError errors={[errors.root?.server]} />
      <Button type="submit" className="w-fit px-10" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  )
}

export function ProfilePage() {
  const session = useSession()
  const profile = useQuery({ ...profileQuery(session?.user.id ?? ''), enabled: !!session })
  if (profile.isError)
    return (
      <div role="alert" className="flex flex-col items-center gap-4 bg-card py-16 text-center">
        <p className="font-bold">Não foi possível carregar seu perfil.</p>
        <Button onClick={() => profile.refetch()}>Tentar novamente</Button>
      </div>
    )
  if (!profile.data) return <Skeleton className="h-[640px] w-full" aria-label="Carregando perfil" />
  return <ProfileFormView key={profile.data.id} user={profile.data} />
}
