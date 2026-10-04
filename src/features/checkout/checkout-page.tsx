import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { ChevronLeftIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { profileQuery } from '@/api/profile'
import { EnsInput } from '@/components/ens-input'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { networks } from '@/contracts/common'
import type { CartItem } from '@/contracts/cart'
import type { User } from '@/contracts/user'
import { walletProvider, type Wallet } from '@/contracts/wallet'
import { useCart, useQuote } from '@/features/cart/use-cart'
import { networkLabels } from '@/lib/format'
import { formatEth } from '@/lib/money'
import { loadDraft, saveDraft } from './draft'
import { inputClass, LabeledField } from './fields'
import { OrderSummary } from './order-summary'
import { ReviewDialog } from './review-dialog'
import { checkoutForm, providerLabels, type CheckoutForm } from './schema'
import { useUserId, useWalletConnection, useWallets } from './use-checkout'
import { ConnectionSection, SavedWallets } from './wallet-section'

/** The collector profile saved with a wallet (wallets page) fills the payment form. */
const walletProfile = (wallet: Wallet, profile: User): CheckoutForm['collector'] => ({
  displayName: wallet.displayName,
  username: profile.username,
  profileName: wallet.profileName,
  email: wallet.email,
  ensName: wallet.ensName,
  referralCode: wallet.referralCode,
  secondaryAddress: wallet.secondaryAddress,
  note: '',
})

function defaults(userId: string, profile: User, wallets: Wallet[]): CheckoutForm {
  const draft = loadDraft(userId)
  const primary = wallets.find((w) => w.slot === 'primary') ?? wallets[0]
  const wallet = wallets.find((w) => w.id === draft.walletId) ?? primary
  return {
    collector: { ...walletProfile(wallet, profile), ...draft.collector },
    walletId: wallet.id,
    provider: draft.provider ?? wallet.provider,
    network: draft.network ?? wallet.network,
  }
}

function CheckoutFormView({
  userId,
  profile,
  wallets,
  items,
}: {
  userId: string
  profile: User
  wallets: Wallet[]
  items: CartItem[]
}) {
  const router = useRouter()
  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutForm),
    defaultValues: defaults(userId, profile, wallets),
  })
  const { errors } = form.formState
  const values = useWatch({ control: form.control }) as CheckoutForm
  const wallet = wallets.find((w) => w.id === values.walletId) ?? wallets[0]
  const quote = useQuote(values.network).data
  const { connection, connect, disconnect, reset } = useWalletConnection()
  const connected =
    connection.status === 'connected' &&
    connection.walletId === values.walletId &&
    connection.network === values.network
  const [otherWallet, setOtherWallet] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  // Keep the draft so a refresh or an expired session does not lose what was typed.
  useEffect(() => {
    const timer = setTimeout(
      () =>
        saveDraft(userId, {
          collector: values.collector,
          walletId: values.walletId,
          provider: values.provider,
          network: values.network,
        }),
      300,
    )
    return () => clearTimeout(timer)
  }, [userId, values])

  // A different wallet or network needs a new connection.
  const changeWallet = (id: string) => {
    const next = wallets.find((w) => w.id === id)
    if (!next) return
    form.reset({
      ...form.getValues(),
      walletId: id,
      provider: next.provider,
      network: next.network,
      collector: walletProfile(next, profile),
    })
    reset()
  }

  const submit = form.handleSubmit(() => {
    if (!connected) {
      setConnectError('Conecte sua carteira na rede selecionada para continuar.')
      document.getElementById('wallet-network')?.scrollIntoView({ block: 'center' })
      return
    }
    setConnectError(null)
    setReviewing(true)
  })

  const text = (
    name: keyof CheckoutForm['collector'],
    label: string,
    options: {
      required?: boolean
      placeholder?: string
      type?: string
      autoComplete?: string
    } = {},
  ) => (
    <LabeledField label={label} required={options.required} error={errors.collector?.[name]}>
      {(control) => (
        <input
          {...control}
          type={options.type ?? 'text'}
          placeholder={options.placeholder}
          autoComplete={options.autoComplete}
          className={inputClass}
          {...form.register(`collector.${name}`)}
        />
      )}
    </LabeledField>
  )

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-10 md:grid-cols-[1fr_405px] md:grid-rows-[auto_1fr] md:gap-x-8 md:gap-y-6"
    >
      <div className="flex flex-col gap-6 md:col-start-2 md:row-start-1">
        <div className="md:hidden">
          <SavedWallets
            wallets={wallets}
            value={values.walletId}
            network={values.network}
            onChange={changeWallet}
          />
        </div>
        <div className="max-md:hidden">
          <OrderSummary items={items} quote={quote} />
        </div>
        <ConnectionSection
          provider={values.provider}
          onProvider={(p) => {
            form.setValue('provider', p)
            reset()
          }}
          connection={connection}
          connected={connected}
          network={values.network}
          onConnect={() => void connect(values.walletId, values.network)}
          onDisconnect={() => void disconnect(values.walletId)}
        />
      </div>
      <div className="flex flex-col gap-8 md:col-start-1 md:row-span-2 md:row-start-1">
        <section aria-labelledby="collector-title" className="flex flex-col gap-4">
          <h2 id="collector-title" className="text-lg font-bold tracking-wide">
            Perfil do colecionador
          </h2>
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {text('displayName', 'Nome de exibição', { required: true, autoComplete: 'name' })}
            {text('username', 'Nome de usuário', { required: true, autoComplete: 'username' })}
            <LabeledField label="Rede" required error={errors.network}>
              {(control) => (
                <select
                  {...control}
                  className={inputClass}
                  {...form.register('network', { onChange: reset })}
                >
                  {networks.map((n) => (
                    <option key={n} value={n}>
                      {networkLabels[n]}
                    </option>
                  ))}
                </select>
              )}
            </LabeledField>
            {text('profileName', 'Nome do perfil', { required: true })}
            <LabeledField label="Endereço da carteira" required>
              {(control) => (
                <input {...control} readOnly value={wallet.address} className={inputClass} />
              )}
            </LabeledField>
            {text('secondaryAddress', 'ENS ou carteira secundária (opcional)', {
              placeholder: 'nome.eth ou 0x...',
            })}
            <LabeledField label="Tipo de carteira" required error={errors.provider}>
              {(control) => (
                <select
                  {...control}
                  className={inputClass}
                  {...form.register('provider', { onChange: reset })}
                >
                  {walletProvider.options.map((p) => (
                    <option key={p} value={p}>
                      {providerLabels[p]}
                    </option>
                  ))}
                </select>
              )}
            </LabeledField>
            {text('referralCode', 'Código de indicação', { required: true })}
            {text('email', 'E-mail', { required: true, type: 'email', autoComplete: 'email' })}
            <LabeledField label="Nome ENS" required error={errors.collector?.ensName}>
              {(control) => (
                <Controller
                  control={form.control}
                  name="collector.ensName"
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
          <label className="flex w-fit items-center gap-2 text-[15px] max-md:hidden">
            <input
              type="checkbox"
              checked={otherWallet}
              onChange={(e) => setOtherWallet(e.target.checked)}
              className="size-4 accent-primary"
            />
            Usar outra carteira?
          </label>
          {otherWallet && (
            <div className="max-md:hidden">
              <SavedWallets
                wallets={wallets}
                value={values.walletId}
                network={values.network}
                onChange={changeWallet}
              />
            </div>
          )}
          <LabeledField
            label="Observação do colecionador (opcional)"
            error={errors.collector?.note}
            className="sm:max-w-[350px]"
          >
            {(control) => (
              <textarea
                {...control}
                rows={5}
                className={`${inputClass} h-auto py-2`}
                {...form.register('collector.note')}
              />
            )}
          </LabeledField>
        </section>
      </div>

      <div className="flex flex-col gap-6 md:col-start-2 md:row-start-2">
        <p className="flex justify-between text-lg font-bold md:hidden">
          Total: <span className="text-highlight">{quote ? formatEth(quote.total) : '...'}</span>
        </p>
        <FieldError errors={[connectError ? { message: connectError } : undefined]} />
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="text-sm text-destructive">
            Revise os campos destacados no formulário.
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          className="w-full max-md:h-12 max-md:rounded-full"
          disabled={!quote?.valid}
        >
          Confirmar compra
        </Button>
        <button
          type="button"
          onClick={() => router.history.back()}
          className="text-sm text-highlight hover:underline md:hidden"
        >
          Voltar ao carrinho
        </button>
      </div>

      {reviewing && (
        <ReviewDialog
          body={{
            network: values.network,
            walletId: values.walletId,
            provider: values.provider,
            collector: form.getValues('collector'),
          }}
          items={items}
          walletAddress={wallet.address}
          onClose={() => setReviewing(false)}
          onWalletDisconnected={() => {
            setReviewing(false)
            reset()
            setConnectError('A carteira foi desconectada. Conecte novamente para continuar.')
          }}
        />
      )}
    </form>
  )
}

export function CheckoutPage() {
  const userId = useUserId()
  const router = useRouter()
  const cart = useCart()
  const wallets = useWallets()
  const profile = useQuery({ ...profileQuery(userId), enabled: !!userId })
  const ready = cart.data && wallets.data && profile.data

  return (
    <div className="page-container flex flex-col gap-6 py-6">
      <div className="relative flex items-center justify-center md:hidden">
        <button
          type="button"
          onClick={() => router.history.back()}
          aria-label="Voltar"
          className="absolute left-0 flex size-10 items-center justify-center rounded-full bg-card"
        >
          <ChevronLeftIcon className="size-5 text-highlight" />
        </button>
        <h1 className="text-lg font-bold">Pagamento com carteira</h1>
      </div>
      <nav aria-label="Trilha" className="text-sm font-bold tracking-wide max-md:hidden">
        <ol className="flex gap-2">
          <li>
            <Link to="/">Início</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/" hash="mercado">
              Mercado
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">
            <h1>Pagamento</h1>
          </li>
        </ol>
      </nav>

      {cart.isError || wallets.isError || profile.isError ? (
        <div role="alert" className="flex flex-col items-center gap-4 bg-card py-16 text-center">
          <p className="font-bold">Não foi possível carregar o pagamento.</p>
          <Button
            onClick={() => void Promise.all([cart.refetch(), wallets.refetch(), profile.refetch()])}
          >
            Tentar novamente
          </Button>
        </div>
      ) : !ready ? (
        <div className="grid gap-8 md:grid-cols-[1fr_405px]" aria-busy="true">
          <span className="sr-only">Carregando pagamento...</span>
          <Skeleton className="h-[520px] w-full" />
          <Skeleton className="h-[520px] w-full" />
        </div>
      ) : cart.data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 bg-card py-16 text-center">
          <p className="font-bold">Seu carrinho está vazio.</p>
          <Button asChild>
            <Link to="/" hash="mercado">
              Explorar o mercado
            </Link>
          </Button>
        </div>
      ) : wallets.data.length === 0 ? (
        <div className="flex flex-col items-center gap-4 bg-card py-16 text-center">
          <p className="font-bold">Cadastre uma carteira para pagar.</p>
          <Button asChild>
            <Link to="/wallets">Cadastrar carteira</Link>
          </Button>
        </div>
      ) : (
        <CheckoutFormView
          userId={userId}
          profile={profile.data}
          wallets={wallets.data}
          items={cart.data.items}
        />
      )}
    </div>
  )
}
