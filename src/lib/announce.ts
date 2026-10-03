/** Screen-reader announcements for changes that have no toast (e.g. realtime updates). */
export function announce(message: string) {
  const region = document.getElementById('live-region')
  if (!region) return
  region.textContent = ''
  // A new text node on the next frame makes repeated messages announce again.
  requestAnimationFrame(() => {
    region.textContent = message
  })
}
