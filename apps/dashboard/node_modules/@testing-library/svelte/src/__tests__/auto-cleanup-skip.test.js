import { beforeAll, describe, expect, test } from 'vitest'

import Comp from './fixtures/Comp.svelte'

describe('auto-cleanup-skip', () => {
  let render

  beforeAll(async () => {
    process.env.STL_SKIP_AUTO_CLEANUP = 'true'
    const stl = await import('..')
    render = stl.render
  })

  // This one verifies that if STL_SKIP_AUTO_CLEANUP is set
  // then we DON'T auto-wire up the afterEach for folks
  test('first', () => {
    render(Comp, { props: { name: 'world' } })
  })

  test('second', () => {
    expect(document.body.innerHTML).toMatchSnapshot()
  })
})
