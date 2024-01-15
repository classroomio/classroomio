import { act, cleanup } from './pure.js'

// If we're running in a test runner that supports afterEach
// then we'll automatically run cleanup afterEach test
// this ensures that tests run in isolation from each other
// if you don't like this then either import the `pure` module
// or set the STL_SKIP_AUTO_CLEANUP env variable to 'true'.
if (typeof afterEach === 'function' && !process.env.STL_SKIP_AUTO_CLEANUP) {
  afterEach(async () => {
    await act()
    cleanup()
  })
}

export * from './pure.js'
