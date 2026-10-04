import { CheckCircle2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { walletProvider } from '@/contracts/wallet'
import type { Wallet } from '@/contracts/wallet'
import { networkLabels, shortHash } from '@/lib/format'
import { cn } from 'cn'
import { providerLabels, type CheckoutForm } from './schema'
import type { Connection } from './use-checkout'

const option =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border border-border px-4 py-2 text-[15px] has-checked:border-foreground has-focus-visible:outline-2 has-focus-visible:outline-ring'
const radio = 'size-4 accent-primary'

/** Saved wallets as radios (mobile always, desktop behind "Usar outra carteira?"). */
export function SavedWallets({
  wallets,
  value,
  network,
  onChange,
}: {
  wallets: Wallet[]
  value: string
  network: CheckoutForm['network']
  onChange: (id: string) => void
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 font-bold">Carteira conectada</legend>
      {wallets.map((wallet) => (
        <label key={wallet.id} className={cn(option, 'bg-card')}>
          <input
            type="radio"
            name="walletId"
            value={wallet.id}
            checked={value === wallet.id}
            onChange={() => onChange(wallet.id)}
            className={radio}
          />
          <span className="flex flex-col">
            <span className="font-bold">{wallet.label}</span>
            <span className="text-sm text-muted-foreground">{shortHash(wallet.address)}</span>
            <span className="text-sm text-muted-foreground">
              {wallet.slot === 'primary' ? 'Principal' : 'Secundária'} · Rede{' '}
              {networkLabels[network]}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}

/** "Carteira e rede": wallet app, then the simulated connection for the chosen wallet and network. */
export function ConnectionSection({
  provider,
  onProvider,
  connection,
  connected,
  onConnect,
  onDisconnect,
  network,
}: {
  provider: CheckoutForm['provider']
  onProvider: (p: CheckoutForm['provider']) => void
  connection: Connection
  connected: boolean
  onConnect: () => void
  onDisconnect: () => void
  network: CheckoutForm['network']
}) {
  return (
    <section aria-labelledby="wallet-network" className="flex flex-col gap-3">
      <h2 id="wallet-network" className="text-center text-lg font-bold">
        Carteira e rede
      </h2>
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Aplicativo da carteira</legend>
        {walletProvider.options.map((p) => (
          <label key={p} className={option}>
            <input
              type="radio"
              name="provider"
              value={p}
              checked={provider === p}
              onChange={() => onProvider(p)}
              className={radio}
            />
            {providerLabels[p]}
          </label>
        ))}
      </fieldset>
      <div aria-live="polite" className="flex flex-col gap-2">
        {connected ? (
          <div className="flex items-center justify-between gap-3 rounded-sm bg-card px-4 py-3 text-sm">
            <span className="flex items-center gap-2">
              <CheckCircle2Icon className="size-4 text-highlight" aria-hidden="true" />
              Conectada via {providerLabels[provider]} na {networkLabels[network]}
            </span>
            <button type="button" onClick={onDisconnect} className="text-highlight hover:underline">
              Desconectar
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onConnect}
            disabled={connection.status === 'connecting'}
          >
            {connection.status === 'connecting' ? 'Aguardando a carteira...' : 'Conectar carteira'}
          </Button>
        )}
        {connection.status === 'rejected' && (
          <p role="alert" className="text-sm text-destructive">
            {connection.message}. Tente novamente.
          </p>
        )}
      </div>
    </section>
  )
}
