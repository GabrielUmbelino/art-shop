import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { walletsApi, walletsKey } from '@/api/wallets'
import { EnsInput } from '@/components/ens-input'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { networks } from '@/contracts/common'
import { walletBody, walletProvider, type Wallet, type WalletBody } from '@/contracts/wallet'
import { inputClass, LabeledField } from '@/features/checkout/fields'
import { providerLabels } from '@/features/checkout/schema'
import { useUserId, useWallets } from '@/features/checkout/use-checkout'
import { applyApiError } from '@/lib/form'
import { networkLabels } from '@/lib/format'

type Slot = Wallet['slot']
type Values = Omit<WalletBody, 'slot'>
const formSchema = walletBody.omit({ slot: true })

const empty: Values = {
  label: '',
  provider: 'metamask',
  address: '',
  network: 'ethereum',
  displayName: '',
  profileName: '',
  email: '',
  ensName: '',
  referralCode: '',
  secondaryAddress: '',
}

/** Profile fields a secondary wallet can copy from the primary ("Igual à carteira principal"). */
const profileOf = ({
  displayName,
  profileName,
  email,
  ensName,
  referralCode,
  network,
  provider,
}: Wallet) => ({
  displayName,
  profileName,
  email,
  ensName,
  referralCode,
  network,
  provider,
})

function WalletForm({ slot, wallet, primary }: { slot: Slot; wallet?: Wallet; primary?: Wallet }) {
  const queryClient = useQueryClient()
  const userId = useUserId()
  const { id: _id, slot: _slot, updatedAt: _u, ...current } = wallet ?? ({ ...empty } as Wallet)
  const form = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: wallet ? current : empty,
  })
  const { errors, isSubmitting } = form.formState
  const [sameAsPrimary, setSameAsPrimary] = useState(false)

  const submit = form.handleSubmit(async (values) => {
    try {
      const saved = wallet
        ? await walletsApi.update(wallet.id, values)
        : await walletsApi.create({ ...values, slot })
      queryClient.setQueryData<Wallet[]>(walletsKey(userId), (list = []) =>
        list.some((w) => w.id === saved.id)
          ? list.map((w) => (w.id === saved.id ? saved : w))
          : [...list, saved],
      )
      toast.success(`Carteira ${slot === 'primary' ? 'principal' : 'secundária'} salva.`)
      form.reset(values)
    } catch (error) {
      applyApiError(error, form.setError)
    }
  })

  const text = (
    name: Exclude<keyof Values, 'provider' | 'network' | 'ensName'>,
    label: string,
    required = true,
    placeholder?: string,
  ) => (
    <LabeledField label={label} required={required} error={errors[name]}>
      {(control) => (
        <input
          {...control}
          placeholder={placeholder}
          className={inputClass}
          {...form.register(name)}
        />
      )}
    </LabeledField>
  )

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-label={`Carteira ${slot === 'primary' ? 'principal' : 'secundária'}`}
      className="flex flex-col gap-5"
    >
      {slot === 'secondary' && primary && (
        <label className="flex w-fit items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sameAsPrimary}
            onChange={(e) => {
              setSameAsPrimary(e.target.checked)
              if (e.target.checked)
                for (const [k, v] of Object.entries(profileOf(primary)))
                  form.setValue(k as keyof Values, v, { shouldDirty: true })
            }}
            className="size-4 accent-primary"
          />
          Igual à carteira principal
        </label>
      )}
      <div className="grid gap-x-7 gap-y-4 md:grid-cols-2">
        {text('displayName', 'Nome de exibição')}
        {text('label', 'Apelido da carteira')}
        <LabeledField label="Rede" required error={errors.network}>
          {(control) => (
            <select {...control} className={inputClass} {...form.register('network')}>
              {networks.map((n) => (
                <option key={n} value={n}>
                  {networkLabels[n]}
                </option>
              ))}
            </select>
          )}
        </LabeledField>
        {text('profileName', 'Nome do perfil')}
        {text('address', 'Endereço da carteira', true, 'Endereço 0x da carteira')}
        {text(
          'secondaryAddress',
          'ENS ou carteira secundária (opcional)',
          false,
          'nome.eth ou 0x...',
        )}
        <LabeledField label="Tipo de carteira" required error={errors.provider}>
          {(control) => (
            <select {...control} className={inputClass} {...form.register('provider')}>
              {walletProvider.options.map((p) => (
                <option key={p} value={p}>
                  {providerLabels[p]}
                </option>
              ))}
            </select>
          )}
        </LabeledField>
        {text('referralCode', 'Código de indicação')}
        {text('email', 'E-mail')}
        <LabeledField label="Nome ENS" required error={errors.ensName}>
          {(control) => (
            <Controller
              control={form.control}
              name="ensName"
              render={({ field }) => (
                <EnsInput
                  {...control}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  className={inputClass}
                />
              )}
            />
          )}
        </LabeledField>
      </div>
      <FieldError
        errors={[(errors as { slot?: { message?: string } }).slot, errors.root?.server]}
      />
      <Button type="submit" className="w-fit px-4" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : 'Salvar carteira'}
      </Button>
    </form>
  )
}

export function WalletsPage() {
  const wallets = useWallets()
  const [addingSecondary, setAddingSecondary] = useState(false)
  if (wallets.isError)
    return (
      <div role="alert" className="flex flex-col items-center gap-4 bg-card py-16 text-center">
        <p className="font-bold">Não foi possível carregar suas carteiras.</p>
        <Button onClick={() => wallets.refetch()}>Tentar novamente</Button>
      </div>
    )
  if (!wallets.data)
    return <Skeleton className="h-[640px] w-full" aria-label="Carregando carteiras" />

  const primary = wallets.data.find((w) => w.slot === 'primary')
  const secondary = wallets.data.find((w) => w.slot === 'secondary')

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="primary-title" className="flex flex-col gap-4">
        <div>
          <h1 id="primary-title" className="text-base font-bold tracking-wide">
            Carteira principal
          </h1>
          <p className="text-sm tracking-wide text-muted-foreground">
            Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
          </p>
        </div>
        <WalletForm key={primary?.id ?? 'new-primary'} slot="primary" wallet={primary} />
      </section>

      <section aria-labelledby="secondary-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="secondary-title" className="text-lg font-bold tracking-wide">
            Carteira secundária
          </h2>
          {!secondary && !addingSecondary && (
            <button
              type="button"
              onClick={() => setAddingSecondary(true)}
              className="text-lg font-bold text-highlight hover:underline"
            >
              Adicionar
            </button>
          )}
        </div>
        {secondary || addingSecondary ? (
          <WalletForm
            key={secondary?.id ?? 'new-secondary'}
            slot="secondary"
            wallet={secondary}
            primary={primary}
          />
        ) : (
          <p className="text-sm tracking-wide text-muted-foreground">
            Você ainda não adicionou uma carteira secundária.
          </p>
        )}
      </section>
    </div>
  )
}
