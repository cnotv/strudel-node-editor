/**
 * A queue that runs jobs one after another. Strudel renders swap the one audio context its engine
 * plays on, so two at once wire nodes from one context into the other and fail.
 * @returns a function that runs a job once every job queued before it has settled
 */
export const createRenderQueue = (): (<Result>(job: () => Promise<Result>) => Promise<Result>) => {
  const queue: { last: Promise<unknown> } = { last: Promise.resolve() }
  return <Result>(job: () => Promise<Result>): Promise<Result> => {
    const result = queue.last.then(job)
    queue.last = result.catch(() => undefined)
    return result
  }
}
