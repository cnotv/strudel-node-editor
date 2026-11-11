import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const repositoryUrl = 'https://github.com/cnotv/strudel-node-editor'

const config: Config = {
  title: 'Strudel Node Editor',
  tagline: 'Embed the Strudel live-coding editor in your own Vue app',
  favicon: 'img/favicon.svg',
  url: 'https://cnotv.github.io',
  baseUrl: '/strudel-node-editor/',
  organizationName: 'cnotv',
  projectName: 'strudel-node-editor',
  onBrokenLinks: 'throw',
  i18n: { defaultLocale: 'en', locales: ['en'] },
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: `${repositoryUrl}/tree/main/documentation/`
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' }
      } satisfies Preset.Options
    ]
  ],
  themeConfig: {
    colorMode: { respectPrefersColorScheme: true },
    navbar: {
      title: 'Strudel Node Editor',
      items: [
        { href: 'https://strudel.cnotv.xyz', label: 'Open the editor', position: 'right' },
        { href: repositoryUrl, label: 'GitHub', position: 'right' }
      ]
    },
    footer: {
      style: 'dark',
      copyright: 'Strudel Node Editor. The Strudel engine is AGPL-3.0-or-later.'
    },
    prism: { theme: prismThemes.github, darkTheme: prismThemes.dracula }
  } satisfies Preset.ThemeConfig
}

export default config
