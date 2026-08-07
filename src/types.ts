export type LiveNavSection = {
  /** Shown in the page index panel. */
  label: string
  /** The field path of the section's group in the edit form, e.g. "hero". */
  path: string
  /**
   * The group's admin label as rendered in the form heading. Used as a
   * fallback to locate the group when Payload's internal field id scheme
   * changes. Defaults to `label`.
   */
  adminLabel?: string
}

export type LiveNavEntityConfig = {
  sections: LiveNavSection[]
}

export type LiveNavPluginConfig = {
  /**
   * Keyed by collection or global slug. An entity listed here gets the page
   * index panel on its edit view. The focus bridge itself is global and needs
   * no configuration.
   */
  entities?: Record<string, LiveNavEntityConfig>
}
