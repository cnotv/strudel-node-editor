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
})
