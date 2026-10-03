import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { mockControl } from './control'
import type { ScenarioName } from './scenarios'

const HIDDEN_KEY = 'nft-mock:panel'

/**
 * Small scenario switcher for the demo, mounted in its own root outside the app tree.
 * Hidden when localStorage "nft-mock:panel" is "hidden" (automated tests, screenshots).
 */
function MockPanel() {
  const [open, setOpen] = useState(false)
  const reload = (scenario?: ScenarioName) => {
    mockControl.reset(scenario)
    location.reload()
  }
  return (
    <div className="fixed bottom-20 left-3 z-50 font-sans text-xs md:bottom-3">
      {open ? (
        <div className="flex w-64 flex-col gap-2 rounded-sm border border-border bg-card p-3 shadow-lg">
          <label htmlFor="mock-scenario" className="font-bold text-highlight">
            Cenário simulado
          </label>
          <select
            id="mock-scenario"
            defaultValue={mockControl.scenario()}
            onChange={(e) => reload(e.target.value as ScenarioName)}
            className="h-8 rounded-sm border border-input bg-background px-2"
          >
            {mockControl.scenarios().map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="text-subtle">
            {mockControl.scenarios().find((s) => s.name === mockControl.scenario())?.description}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => reload()}
              className="h-8 flex-1 rounded-sm bg-primary font-bold text-primary-foreground"
            >
              Restaurar dados
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-8 rounded-sm border border-border px-3"
            >
              Fechar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-8 rounded-sm border border-border bg-card px-3 text-subtle hover:text-highlight"
        >
          Mock: {mockControl.scenario()}
        </button>
      )}
    </div>
  )
}

export function mountMockPanel() {
  if (localStorage.getItem(HIDDEN_KEY) === 'hidden') return
  const container = document.createElement('div')
  container.setAttribute('aria-label', 'Controles da simulação')
  container.setAttribute('role', 'region')
  document.body.append(container)
  createRoot(container).render(<MockPanel />)
}
