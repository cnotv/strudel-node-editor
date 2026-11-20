import useBaseUrl from '@docusaurus/useBaseUrl'

const SPRITES = {
  waveform: { file: 'waveform-cases.jpg', panelCount: 6, aspectRatio: '560 / 150' },
  spectrogram: { file: 'spectrogram-cases.jpg', panelCount: 8, aspectRatio: '560 / 260' }
}

interface Props {
  sprite: keyof typeof SPRITES
  index: number
  alt: string
}

/** Shows one panel of a sound check sprite; the panels are stacked and equal in height. */
export default function SoundCase({ sprite, index, alt }: Props) {
  const { file, panelCount, aspectRatio } = SPRITES[sprite]
  const spriteUrl = useBaseUrl(`/img/sound-check/${file}`)
  return (
    <span
      role="img"
      aria-label={alt}
      style={{
        display: 'block',
        width: 260,
        aspectRatio,
        backgroundImage: `url(${spriteUrl})`,
        backgroundSize: `100% ${panelCount * 100}%`,
        backgroundPosition: `0 ${(index / (panelCount - 1)) * 100}%`
      }}
    />
  )
}
