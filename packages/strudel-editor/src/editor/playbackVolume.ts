import { isRecordModule } from './strudelModules'

type VolumeControl = {
  /** Sets how loud the live output is, from 0 (silent) to 1. */
  setVolume: (volume: number) => void
  /** Hooks a newly built output so it starts at the chosen volume; safe to call again. */
  attach: () => void
}

const writeGain = (node: unknown, volume: number): void => {
  const gain = isRecordModule(node) ? node.gain : undefined
  if (isRecordModule(gain)) {
    Reflect.set(gain, 'value', volume)
  }
}

/**
 * The master volume of the live output. Superdough rebuilds its final gain node every time it
 * resets, so the volume is applied through a setter on the output, which sees each new node
 * the moment it is made. It starts at full volume, so a host app that plays a song hears it; the editor sets its own.
 * @param readController - gives superdough's audio controller, once audio is initialised
 * @returns the volume setter and the hook for each new output
 */
export const createVolumeControl = (readController: () => unknown): VolumeControl => {
  let volume = 1
  let hookedOutput: Record<string, unknown> | null = null
  let gainNode: unknown = null

  const attach = (): void => {
    const controller = readController()
    const output = isRecordModule(controller) ? controller.output : undefined
    if (!isRecordModule(output) || output === hookedOutput) {
      return
    }
    hookedOutput = output
    gainNode = output.destinationGain
    Object.defineProperty(output, 'destinationGain', {
      configurable: true,
      enumerable: true,
      get: () => gainNode,
      set: (next: unknown) => {
        gainNode = next
        writeGain(next, volume)
      }
    })
    writeGain(gainNode, volume)
  }

  return {
    setVolume: (nextVolume) => {
      volume = nextVolume
      attach()
      writeGain(gainNode, volume)
    },
    attach
  }
}
