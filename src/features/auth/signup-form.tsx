import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PasswordInput } from '@/components/password-input'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { signupBody } from '@/contracts/user'
import { applyApiError } from '@/lib/form'
import { FormField } from './form-field'
import { useSignup } from './use-auth'

const signupForm = signupBody
  .extend({ confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  })
type SignupForm = z.infer<typeof signupForm>

export function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const signup = useSignup()
  const form = useForm<SignupForm>({
    resolver: zodResolver(signupForm),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async ({ confirmPassword: _confirm, ...values }) => {
    try {
      await signup.mutateAsync(values)
      onSuccess()
    } catch (error) {
      applyApiError(error, form.setError)
    }
  })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <FormField label="Nome de usuário" error={errors.username} hideLabel>
        {(control) => (
          <Input
            {...control}
            autoComplete="username"
            placeholder="Nome de usuário"
            {...form.register('username')}
          />
        )}
      </FormField>
      <FormField label="E-mail" error={errors.email} hideLabel>
        {(control) => (
          <Input
            {...control}
            type="email"
            autoComplete="email"
            placeholder="Digite seu e-mail"
            {...form.register('email')}
          />
        )}
      </FormField>
      <FormField label="Senha" error={errors.password} hideLabel>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="new-password"
            placeholder="Senha"
            {...form.register('password')}
          />
        )}
      </FormField>
      <FormField label="Confirmar senha" error={errors.confirmPassword} hideLabel>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="new-password"
            placeholder="Confirmar senha"
            {...form.register('confirmPassword')}
          />
        )}
      </FormField>
      <FieldError errors={[errors.root?.server]} />
      <Button
        type="submit"
        size="lg"
        className="mt-2 w-full max-md:h-12 max-md:rounded-xl"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          'Criando conta...'
        ) : (
          <>
            <span className="md:hidden">Criar perfil</span>
            <span className="max-md:hidden">Criar conta</span>
          </>
        )}
      </Button>
    </form>
  )
}
