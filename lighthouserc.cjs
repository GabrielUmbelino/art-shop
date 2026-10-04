/**
 * Lighthouse CI: home and NFT detail, 3 runs each, against the optimized demo build (mocks on, default scenario).
 * Profiles: mobile (Lighthouse default: emulated mid-range phone, slow 4G, 4x CPU) and desktop (preset).
 * Run with `pnpm lighthouse`; reports land in lighthouse/reports/<profile> and lighthouse/REPORT.md.
 */
const profile = process.env.LH_PROFILE ?? 'mobile'

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm preview --port 4173 --strictPort',
      startServerReadyPattern: 'Local',
      url: ['http://localhost:4173/', 'http://localhost:4173/nft/nft-001'],
      numberOfRuns: 3,
      settings: {
        ...(profile === 'desktop' ? { preset: 'desktop' } : {}),
        // The mock layer and its panel are part of the delivery; nothing is disabled for the audit.
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: `./lighthouse/reports/${profile}`,
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
  },
}
