import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ComingSoon } from '@/components/coming-soon'
import { PasswordInput } from '@/components/password-input'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { loginBody, type LoginBody } from '@/contracts/user'
import { applyApiError } from '@/lib/form'
import { FormField } from './form-field'
import { useLogin } from './use-auth'

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useLogin()
  const form = useForm<LoginBody>({
    resolver: zodResolver(loginBody),
    defaultValues: { email: '', password: '' },
  })
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values)
      onSuccess()
    } catch (error) {
      applyApiError(error, form.setError)
    }
  })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <FormField label="E-mail" error={errors.email} hideLabel>
        {(control) => (
          <Input
            {...control}
            type="email"
            autoComplete="email"
            placeholder="contato@email.com"
            {...form.register('email')}
          />
        )}
      </FormField>
      <FormField label="Senha" error={errors.password} hideLabel>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="current-password"
            placeholder="Senha"
            {...form.register('password')}
          />
        )}
      </FormField>
      <ComingSoon className="self-end text-sm text-highlight">Esqueceu a senha?</ComingSoon>
      <FieldError errors={[errors.root?.server]} />
      <Button
        type="submit"
        size="lg"
        className="mt-2 w-full max-md:h-12 max-md:rounded-xl"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
