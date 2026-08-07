'use client'

import React, { useEffect } from 'react'

export type LiveNavListenerOptions = {
  /** Outline color of the flash. Defaults to a soft gold. */
  flashColor?: string
  /** How long the flash stays, in ms. */
  flashMs?: number
}

/**
 * Frontend half of payload-live-nav: listens for the admin's focus messages
 * and scrolls to / flashes the element whose `data-cms-field` attribute
 * matches the focused field's path. Unmatched paths climb to their parent
 * (e.g. `faq.headline` can resolve the `faq` card and vice versa: a group
 * path like `faq` has no element of its own, but `faq.headline` does).
 *
 * Only same-origin messages are accepted, so this is inert on the public
 * site; it only ever reacts inside the admin's Live Preview iframe.
 *
 * Framework agnostic core. React users can drop `<LiveNavListener />` in the
 * previewed page instead.
 */
export function attachLiveNavListener(
  doc: Document = typeof document !== 'undefined' ? document : (undefined as never),
  options: LiveNavListenerOptions = {},
): () => void {
  const { flashColor = '#c39b4b', flashMs = 1600 } = options
  const win = doc.defaultView
  if (!win) return () => {}

  const onMessage = (e: MessageEvent) => {
    if (e.origin !== win.location.origin) return
    const path = (e.data && (e.data as Record<string, unknown>).cmsFocusField) as string | undefined
    if (!path) return
    const safe = path.replace(/[^a-zA-Z0-9_.]/g, '')
    let candidate = safe
    let el: HTMLElement | null = null
    while (candidate && !el) {
      // Exact match first, then the first child of the group.
      el =
        doc.querySelector<HTMLElement>(`[data-cms-field="${candidate}"]`) ||
        doc.querySelector<HTMLElement>(`[data-cms-field^="${candidate}."]`)
      if (!el) candidate = candidate.split('.').slice(0, -1).join('.')
    }
    if (!el) return
    // The iframe is its own document, so smooth scrolling is safe here (it is
    // the admin form where smooth dies; see the client side).
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const previous = el.style.boxShadow
    el.style.boxShadow = `0 0 0 3px ${flashColor}`
    win.setTimeout(() => {
      el!.style.boxShadow = previous
    }, flashMs)
  }

  win.addEventListener('message', onMessage)
  return () => win.removeEventListener('message', onMessage)
}

/**
 * React wrapper around `attachLiveNavListener`. Render it once anywhere in
 * the previewed page (layout or page level). Renders nothing.
 */
export const LiveNavListener: React.FC<LiveNavListenerOptions> = ({ flashColor, flashMs }) => {
  useEffect(() => attachLiveNavListener(document, { flashColor, flashMs }), [flashColor, flashMs])
  return null
}
