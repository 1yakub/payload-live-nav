'use client'

import React, { useCallback, useEffect, useState } from 'react'

import type { LiveNavEntityConfig, LiveNavSection } from './types.js'

/**
 * Admin side of payload-live-nav. Two additive aids, both guarded so they can
 * never break the admin:
 *
 * 1. Focus bridge: focusing any form field posts its path into the Live
 *    Preview iframe, where the page scrolls to and flashes the matching
 *    `data-cms-field` element (see `payload-live-nav/frontend`).
 * 2. Page index: a collapsible panel on configured entities' edit views
 *    listing the page's sections; clicking one scrolls the form to that
 *    group AND sends the preview there too.
 *
 * Both lean on Payload's internal `field-<path>` DOM id scheme. If a future
 * Payload version changes it, everything degrades to a quiet no-op (the
 * heading text fallback below covers the page index).
 */

function postToPreview(path: string) {
  document.querySelectorAll('iframe').forEach((frame) => {
    frame.contentWindow?.postMessage({ cmsFocusField: path }, window.location.origin)
  })
}

function scrollFormToGroup(section: LiveNavSection) {
  const { adminLabel, label, path } = section
  let el: Element | null =
    document.getElementById(`field-${path}`) || document.querySelector(`[id^="field-${path}__"]`)
  if (!el) {
    // Fall back to the group's heading text in the form.
    const wanted = (adminLabel ?? label).toLowerCase()
    el =
      Array.from(document.querySelectorAll('h3, h2, legend')).find(
        (h) => (h.textContent || '').trim().toLowerCase() === wanted,
      ) || null
  }
  if (!el) return
  // Jump the form instantly (smooth scrolling dies when closing the panel
  // re-renders the document). The admin's form scrolls via BODY, not an inner
  // column (measured live), and body's rect.top goes negative once scrolled,
  // so root scrolling must use the viewport-relative offset directly; inner
  // containers (if Payload ever introduces one) use container-relative math.
  let container: HTMLElement | null = null
  let p = el.parentElement
  while (p && p !== document.body) {
    const s = getComputedStyle(p)
    if (/(auto|scroll|overlay)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 10) {
      container = p
      break
    }
    p = p.parentElement
  }
  const jump = () => {
    const elTop = el!.getBoundingClientRect().top
    if (container) {
      container.scrollTop += elTop - container.getBoundingClientRect().top - 12
    } else {
      window.scrollBy({ top: elTop - 90 })
    }
  }
  // Payload lazy-renders parts of the form as they scroll into view, which
  // shifts layout right after a long jump. Re-correct twice; instant scrolls
  // make the taps imperceptible.
  jump()
  window.setTimeout(jump, 250)
  window.setTimeout(jump, 650)
}

const panelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body, sans-serif)',
  left: '12px',
  position: 'fixed',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 80,
}

const PageIndex: React.FC<{ sections: LiveNavSection[] }> = ({ sections }) => {
  const [open, setOpen] = useState(false)

  const go = useCallback((section: LiveNavSection) => {
    try {
      scrollFormToGroup(section)
      postToPreview(section.path)
    } catch {
      /* quiet */
    }
    setOpen(false)
  }, [])

  if (!open) {
    return (
      <button
        aria-label="Open page index"
        onClick={() => setOpen(true)}
        style={{
          ...panelStyle,
          background: 'var(--theme-elevation-100)',
          border: '1px solid var(--theme-elevation-200)',
          borderRadius: '6px',
          color: 'var(--theme-elevation-800)',
          cursor: 'pointer',
          fontSize: '11px',
          letterSpacing: '0.08em',
          padding: '10px 6px',
          writingMode: 'vertical-rl',
        }}
        type="button"
      >
        PAGE INDEX
      </button>
    )
  }

  return (
    <div
      style={{
        ...panelStyle,
        background: 'var(--theme-elevation-50)',
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        padding: '8px',
        width: '160px',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '2px 6px 8px',
        }}
      >
        <span
          style={{
            color: 'var(--theme-elevation-500)',
            fontSize: '10px',
            letterSpacing: '0.1em',
          }}
        >
          PAGE INDEX
        </span>
        <button
          aria-label="Close page index"
          onClick={() => setOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--theme-elevation-500)',
            cursor: 'pointer',
            fontSize: '14px',
            lineHeight: 1,
          }}
          type="button"
        >
          ×
        </button>
      </div>
      {sections.map((s) => (
        <button
          key={s.path}
          onClick={() => go(s)}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--theme-elevation-100)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
          }}
          style={{
            background: 'none',
            border: 'none',
            borderRadius: '4px',
            color: 'var(--theme-elevation-800)',
            cursor: 'pointer',
            display: 'block',
            fontSize: '13px',
            padding: '6px 8px',
            textAlign: 'left',
            width: '100%',
          }}
          type="button"
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Matches the current admin URL against the configured entity slugs.
 * Globals edit at `/globals/<slug>`, collection documents at
 * `/collections/<slug>/<id>`.
 */
function activeEntityFromPath(
  pathname: string,
  entities: Record<string, LiveNavEntityConfig>,
): LiveNavEntityConfig | null {
  const clean = pathname.replace(/\/$/, '')
  for (const slug of Object.keys(entities)) {
    if (clean.endsWith(`/globals/${slug}`) || clean.includes(`/collections/${slug}/`)) {
      return entities[slug]
    }
  }
  return null
}

export const LiveNavProvider: React.FC<{
  children?: React.ReactNode
  entities?: Record<string, LiveNavEntityConfig>
}> = ({ children, entities = {} }) => {
  const [active, setActive] = useState<LiveNavEntityConfig | null>(null)

  // Focus bridge: field focus -> preview scroll. Always on.
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      try {
        const target = e.target as HTMLElement | null
        const id = target?.id || ''
        if (!id.startsWith('field-')) return
        postToPreview(id.slice('field-'.length).replace(/__/g, '.'))
      } catch {
        /* never interfere with the admin */
      }
    }
    document.addEventListener('focusin', onFocusIn)
    return () => document.removeEventListener('focusin', onFocusIn)
  }, [])

  // Show the page index only on configured entities' edit views. The admin
  // navigates client-side, so poll the pathname cheaply instead of trusting
  // a single render.
  useEffect(() => {
    const check = () => setActive(activeEntityFromPath(window.location.pathname, entities))
    check()
    const t = window.setInterval(check, 1000)
    return () => window.clearInterval(t)
  }, [entities])

  return (
    <>
      {children}
      {active && active.sections.length > 0 && <PageIndex sections={active.sections} />}
    </>
  )
}
