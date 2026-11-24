import { beforeEach, vi } from 'vitest'

const resizeObserverMethods = {
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}

function ResizeObserverStub(this: Record<string, unknown>) {
  Object.assign(this, resizeObserverMethods)
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub)

// The editor remembers its volume in localStorage, so a test starts muted and never plays aloud.
beforeEach(() => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('strudel-editor-volume', '0')
  }
})
