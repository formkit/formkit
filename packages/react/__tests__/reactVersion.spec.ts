import { version } from 'react'
import { version as domVersion } from 'react-dom'
import { describe, expect, it } from 'vitest'

describe('react version under test', () => {
  it('uses matching react and react-dom', () => {
    expect(version).toBe(domVersion)
    console.log(`react ${version}`)
  })
})
