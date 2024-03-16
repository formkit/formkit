/**
 * Reset any counters in the inputs package.
 */
import { resetCounts } from '@formkit/inputs'
import { resetCount as coreResetCount } from '@formkit/core'

export function resetCount() {
  resetCounts()
  coreResetCount()
}
