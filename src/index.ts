import type { Config, Plugin } from 'payload'

import type { LiveNavPluginConfig } from './types.js'

export type { LiveNavEntityConfig, LiveNavPluginConfig, LiveNavSection } from './types.js'

/**
 * Registers the admin side of payload-live-nav:
 *
 * - a focus bridge that posts the focused field's path into the Live Preview
 *   iframe (always on, zero config), and
 * - a page index panel on the edit views of the entities you configure,
 *   jumping both the form and the preview to a section in one click.
 *
 * The frontend half lives in `payload-live-nav/frontend`: drop
 * `<LiveNavListener />` (or `attachLiveNavListener()`) into the previewed
 * page and tag your elements with `data-cms-field`.
 */
export const liveNavPlugin =
  (pluginConfig: LiveNavPluginConfig = {}): Plugin =>
  (config: Config): Config => {
    const existingProviders = config.admin?.components?.providers ?? []

    return {
      ...config,
      admin: {
        ...config.admin,
        components: {
          ...config.admin?.components,
          providers: [
            ...existingProviders,
            {
              clientProps: { entities: pluginConfig.entities ?? {} },
              path: 'payload-live-nav/client#LiveNavProvider',
            },
          ],
        },
      },
    }
  }
