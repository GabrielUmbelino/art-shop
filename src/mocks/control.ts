import type { Edition } from '@/contracts/nft'
import { db, reset, save } from './db/store'
import { changeEdition, clearOrderTimers, resolveOrder, resumePendingOrders } from './domain'
import { isScenario, scenarios, type MockConfig, type ScenarioName } from './scenarios'
import { resetNetworkSequences } from './network'
import { dropConnections, events, replay } from './socket'

/** Test and demo controls, exposed as window.__mock when mocks are enabled. */
export const mockControl = {
  scenarios: () =>
    Object.entries(scenarios).map(([name, s]) => ({ name, description: s.description })),
  scenario: () => db.scenario,
  /** Restores the seed data with the given (or current) scenario. */
  reset: (scenario?: ScenarioName) => {
    clearOrderTimers()
    resetNetworkSequences()
    reset(scenario)
  },
  /** Overrides parts of the current scenario's configuration. */
  configure: (patch: Partial<MockConfig>) => {
    resetNetworkSequences()
    Object.assign(db.config, patch)
    save()
    if (patch.socketOffline) dropConnections()
  },
  expireSessions: () => {
    for (const session of db.sessions) session.expiresAt = new Date(0).toISOString()
    save()
  },
  /** Changes an edition and publishes nft.updated. */
  updateEdition: (
    nftId: string,
    editionId: string,
    patch: Partial<Pick<Edition, 'price' | 'available'>>,
  ) => changeEdition(nftId, editionId, patch),
  resolveOrder,
  events,
  replay,
  dropConnections,
  /** Read-only copy of the mock database, for assertions. */
  state: () => structuredClone(db),
}

export type MockControl = typeof mockControl

declare global {
  interface Window {
    __mock: MockControl
  }
}

/** Applies ?scenario=<name>: switching scenario resets the data, the same one keeps it. */
export function initMocks() {
  const requested = new URLSearchParams(location.search).get('scenario')
  if (requested && isScenario(requested) && requested !== db.scenario) mockControl.reset(requested)
  resumePendingOrders()
}
