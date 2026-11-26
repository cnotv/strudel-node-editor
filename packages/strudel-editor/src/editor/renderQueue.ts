type QueuedJob = {
  urgent: boolean
  run: (registerAbort: (abort: () => void) => void) => Promise<'done' | 'aborted'>
}

/**
 * A queue that runs jobs one after another. Strudel renders swap the one audio context their
 * engine plays on, so two at once wire nodes from one context into the other and fail.
 *
 * An urgent job jumps ahead of every waiting background job, and aborts a background job that is
 * running: that job reads the signal it is given and throws at its next safe point, and the queue
 * runs it again once the urgent jobs are done. A job must therefore leave nothing behind when it
 * is aborted, since its result is thrown away and the whole job runs again.
 * @returns a function that runs a job once every job queued before it has settled
 */
export const createRenderQueue = (): (<Result>(
  job: (signal: AbortSignal) => Promise<Result>,
  options?: { urgent?: boolean }
) => Promise<Result>) => {
  const state: {
    waiting: QueuedJob[]
    running: { urgent: boolean; abort: () => void } | null
  } = { waiting: [], running: null }

  const insertBeforeBackground = (queued: QueuedJob): void => {
    const firstBackground = state.waiting.findIndex((waiting) => !waiting.urgent)
    state.waiting.splice(firstBackground === -1 ? state.waiting.length : firstBackground, 0, queued)
  }

  const runNext = async (): Promise<void> => {
    if (state.running !== null) return
    const next = state.waiting.shift()
    if (next === undefined) return
    const runningJob = { urgent: next.urgent, abort: (): void => undefined }
    state.running = runningJob
    const outcome = await next.run((abort) => {
      runningJob.abort = abort
    })
    state.running = null
    if (outcome === 'aborted') insertBeforeBackground(next)
    void runNext()
  }

  return <Result>(
    job: (signal: AbortSignal) => Promise<Result>,
    { urgent = false }: { urgent?: boolean } = {}
  ): Promise<Result> =>
    new Promise<Result>((resolve, reject) => {
      const run: QueuedJob['run'] = async (registerAbort) => {
        const controller = new AbortController()
        registerAbort(() => controller.abort())
        try {
          resolve(await job(controller.signal))
          return 'done'
        } catch (error) {
          if (controller.signal.aborted) return 'aborted'
          reject(error)
          return 'done'
        }
      }
      if (urgent) {
        insertBeforeBackground({ urgent, run })
        if (state.running !== null && !state.running.urgent) state.running.abort()
      } else {
        state.waiting.push({ urgent, run })
      }
      void runNext()
    })
}
