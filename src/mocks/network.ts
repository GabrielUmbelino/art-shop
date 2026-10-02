import { delay, http, HttpResponse } from 'msw'
import { db, save } from './db/store'
import { apiError } from './lib'
import type { Latency } from './scenarios'

/** Seeded PRNG so "random" latency is the same on every run. */
let seed = 42
function random() {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const calls = new Map<string, number>()

function latencyFor(latency: Latency, route: string) {
  if (typeof latency === 'number') return latency
  if ('sequence' in latency) {
    const n = calls.get(route) ?? 0
    calls.set(route, n + 1)
    return latency.sequence[n % latency.sequence.length]
  }
  return Math.round(latency.min + random() * (latency.max - latency.min))
}

/** Runs before every API handler: applies latency and injected failures, then falls through. */
export const networkHandler = http.all('/api/*', async ({ request }) => {
  const route = `${request.method} ${new URL(request.url).pathname}`
  const ms = latencyFor(db.config.latency, route)
  if (ms > 0) await delay(ms)
  if (db.config.offline) return HttpResponse.error()

  const failure = db.config.failures.find((f) => route.startsWith(f.match))
  if (!failure) return
  if (failure.times !== undefined) {
    failure.times -= 1
    if (failure.times <= 0) db.config.failures.splice(db.config.failures.indexOf(failure), 1)
    save()
  }
  if (failure.error === 'NETWORK') return HttpResponse.error()
  if (failure.error === 'TIMEOUT') await delay('infinite')
  return apiError(failure.error === 'TIMEOUT' ? 'TRANSIENT' : failure.error)
})
