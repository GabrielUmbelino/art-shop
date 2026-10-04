import Big from 'big.js'

/** All ETH math goes through here. Inputs and outputs are decimal strings. */

Big.DP = 18
Big.RM = Big.roundDown

const normalize = (value: Big) => value.toFixed(18).replace(/\.?0+$/, '') || '0'

export const add = (...values: string[]) =>
  normalize(values.reduce((sum, v) => sum.plus(v), Big(0)))

export const sub = (a: string, b: string) => normalize(Big(a).minus(b))

export const mul = (amount: string, factor: string | number) => normalize(Big(amount).times(factor))

/** Percentage of an amount, rounded down to 6 decimals. */
export const percentOf = (amount: string, percent: number) =>
  normalize(Big(amount).times(percent).div(100).round(6, Big.roundDown))

export const compare = (a: string, b: string) => Big(a).cmp(b)

export const roundTo = (amount: string, decimals: number) =>
  normalize(Big(amount).round(decimals, Big.roundHalfUp))

export const min = (values: string[]) => values.reduce((m, v) => (compare(v, m) < 0 ? v : m))

export const max = (values: string[]) => values.reduce((m, v) => (compare(v, m) > 0 ? v : m))

/** Display format: trims trailing zeros, keeps up to `decimals` places. */
export const formatEth = (amount: string, decimals = 4) =>
  `${Big(amount)
    .round(decimals, Big.roundHalfUp)
    .toFixed(decimals)
    .replace(/\.?0+$/, '')} ETH`

/** pt-BR decimal comma with fixed decimals, as in the price filter label ("0,02 - 12,30 ETH"). */
export const formatEthComma = (amount: string, decimals = 2) =>
  Big(amount).round(decimals, Big.roundHalfUp).toFixed(decimals).replace('.', ',')

/**
 * Sliders position thumbs with numbers. Only for that: amounts sent to the API stay decimal strings,
 * converted back with fromSliderValue.
 */
export const toSliderValue = (amount: string) => Big(amount).toNumber()
export const fromSliderValue = (value: number, decimals = 2) =>
  normalize(Big(value).round(decimals, Big.roundHalfUp))
