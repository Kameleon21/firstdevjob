'use client';

import { useEffect } from 'react';
import { useSidebar } from 'fumadocs-ui/components/sidebar/base';

// Matches Fumadocs' `md` breakpoint, where the sidebar switches from a drawer
// to a collapsible column.
const DESKTOP_QUERY = '(min-width: 768px)';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * Cmd+B (macOS) / Ctrl+B toggles the docs sidebar: collapses the column on
 * desktop, opens or closes the drawer on mobile. Renders nothing.
 */
export function DocsKeyboardShortcuts() {
  const { setCollapsed, setOpen } = useSidebar();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.altKey || event.shiftKey) return;
      if (event.key.toLowerCase() !== 'b') return;
      if (isEditableTarget(event.target)) return;

      event.preventDefault();
      if (window.matchMedia(DESKTOP_QUERY).matches) {
        setCollapsed((collapsed) => !collapsed);
      } else {
        setOpen((open) => !open);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setCollapsed, setOpen]);

  return null;
}
