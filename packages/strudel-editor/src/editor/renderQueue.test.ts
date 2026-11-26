import { describe, it, expect } from 'vitest'
import { createRenderQueue } from './renderQueue'

describe('createRenderQueue', () => {
  it('runs a job only after the one queued before it has settled', async () => {
    // Arrange
    const runInTurn = createRenderQueue()
    const order: string[] = []
    const slowJob = () =>
      new Promise<void>((resolve) =>
        setTimeout(() => {
          order.push('slow')
          resolve()
        }, 10)
      )
    const quickJob = async () => {
      order.push('quick')
    }

    // Act
    await Promise.all([runInTurn(slowJob), runInTurn(quickJob)])

    // Assert
    expect(order).toEqual(['slow', 'quick'])
  })

  it('keeps running jobs after one fails', async () => {
    // Arrange
    const runInTurn = createRenderQueue()
    const failingJob = () => Promise.reject(new Error('boom'))

    // Act
    const failure = runInTurn(failingJob)
    const next = runInTurn(async () => 'ok')

    // Assert
    await expect(failure).rejects.toThrow('boom')
    await expect(next).resolves.toBe('ok')
  })

  it('runs an urgent job before background jobs still waiting', async () => {
    // Arrange
    const runInTurn = createRenderQueue()
    const order: string[] = []
    const record = (name: string) => async () => {
      order.push(name)
    }
    const running = runInTurn(
      () => new Promise<void>((resolve) => setTimeout(() => (order.push('running'), resolve()), 10))
    )

    // Act
    await Promise.all([
      running,
      runInTurn(record('background')),
      runInTurn(record('urgent'), { urgent: true })
    ])

    // Assert
    expect(order).toEqual(['running', 'urgent', 'background'])
  })

  it('keeps urgent jobs in the order they arrived', async () => {
    // Arrange
    const runInTurn = createRenderQueue()
    const order: string[] = []
    const record = (name: string) => async () => {
      order.push(name)
    }

    // Act
    await Promise.all([
      runInTurn(record('first')),
      runInTurn(record('urgent one'), { urgent: true }),
      runInTurn(record('urgent two'), { urgent: true })
    ])

    // Assert
    expect(order).toEqual(['first', 'urgent one', 'urgent two'])
  })

  it('aborts a running background job when an urgent job arrives, then runs it again after', async () => {
    // Arrange
    const runInTurn = createRenderQueue()
    const order: string[] = []
    const backgroundJob = async (signal: AbortSignal) => {
      order.push(`background starts, aborted ${signal.aborted}`)
      await new Promise((resolve) => setTimeout(resolve, 10))
      signal.throwIfAborted()
      order.push('background finishes')
      return 'rendered'
    }

    // Act
    const background = runInTurn(backgroundJob)
    const urgent = runInTurn(async () => order.push('urgent'), { urgent: true })

    // Assert
    await urgent
    await expect(background).resolves.toBe('rendered')
    expect(order).toEqual([
      'background starts, aborted false',
      'urgent',
      'background starts, aborted false',
      'background finishes'
    ])
  })

  it('does not abort a running urgent job when another urgent job arrives', async () => {
    // Arrange
    const runInTurn = createRenderQueue()
    const aborted: boolean[] = []
    const firstUrgent = async (signal: AbortSignal) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      aborted.push(signal.aborted)
    }

    // Act
    await Promise.all([
      runInTurn(firstUrgent, { urgent: true }),
      runInTurn(async () => undefined, { urgent: true })
    ])

    // Assert
    expect(aborted).toEqual([false])
  })
})
