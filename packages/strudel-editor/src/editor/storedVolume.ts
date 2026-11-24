import { readStorage } from '../utils/storage'
import { STRUDEL_TIMELINE_DEFAULT_VOLUME, STRUDEL_VOLUME_STORAGE_KEY } from './config'

/**
 * The volume from the last visit, or the default on a first visit or a value that is no volume.
 * @returns a volume from 0 to 1
 */
export const readStoredVolume = (): number => {
  const stored = readStorage(STRUDEL_VOLUME_STORAGE_KEY)
  const volume = stored === null || stored.trim() === '' ? Number.NaN : Number(stored)
  return volume >= 0 && volume <= 1 ? volume : STRUDEL_TIMELINE_DEFAULT_VOLUME
}
