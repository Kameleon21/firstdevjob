'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { Maximize2, X } from 'lucide-react';

interface MermaidProps {
  /** Mermaid diagram source. */
  chart: string;
  /** Short description, used as the accessible label and caption. */
  title?: string;
}

const lightTheme = {
  background: '#ffffff',
  primaryColor: '#f1f5f9',
  primaryTextColor: '#0f172a',
  primaryBorderColor: '#94a3b8',
  secondaryColor: '#ede9fe',
  secondaryTextColor: '#0f172a',
  secondaryBorderColor: '#a78bfa',
  tertiaryColor: '#f8fafc',
  tertiaryTextColor: '#0f172a',
  tertiaryBorderColor: '#cbd5e1',
  lineColor: '#475569',
  textColor: '#0f172a',
  noteBkgColor: '#fef9c3',
  noteTextColor: '#1f2937',
  noteBorderColor: '#facc15',
  actorBkg: '#f1f5f9',
  actorBorder: '#94a3b8',
  actorTextColor: '#0f172a',
  signalColor: '#475569',
  signalTextColor: '#0f172a',
  labelBoxBkgColor: '#ede9fe',
  labelTextColor: '#0f172a',
  clusterBkg: '#f8fafc',
  clusterBorder: '#cbd5e1',
  edgeLabelBackground: '#ffffff',
  attributeBackgroundColorOdd: '#f8fafc',
  attributeBackgroundColorEven: '#f1f5f9',
};

const darkTheme = {
  background: '#0b1220',
  primaryColor: '#1f2937',
  primaryTextColor: '#e5e7eb',
  primaryBorderColor: '#4b5563',
  secondaryColor: '#3b0764',
  secondaryTextColor: '#f3e8ff',
  secondaryBorderColor: '#a855f7',
  tertiaryColor: '#111827',
  tertiaryTextColor: '#e5e7eb',
  tertiaryBorderColor: '#374151',
  lineColor: '#9ca3af',
  textColor: '#e5e7eb',
  noteBkgColor: '#422006',
  noteTextColor: '#fde68a',
  noteBorderColor: '#a16207',
  actorBkg: '#1f2937',
  actorBorder: '#4b5563',
  actorTextColor: '#e5e7eb',
  signalColor: '#9ca3af',
  signalTextColor: '#e5e7eb',
  labelBoxBkgColor: '#3b0764',
  labelTextColor: '#f3e8ff',
  clusterBkg: '#111827',
  clusterBorder: '#374151',
  edgeLabelBackground: '#0b1220',
  attributeBackgroundColorOdd: '#111827',
  attributeBackgroundColorEven: '#1f2937',
};

/**
 * Renders a Mermaid diagram on the client, matching the docs theme.
 * The library is loaded lazily so it only ships on pages that use a diagram.
 */
export function Mermaid({ chart, title }: MermaidProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const source = chart.trim();
  const label = title ?? 'Diagram';

  const openFullscreen = () => dialogRef.current?.showModal();
  const closeFullscreen = () => dialogRef.current?.close();

  useEffect(() => {
    let cancelled = false;
    const isDark = resolvedTheme === 'dark';

    import('mermaid')
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          fontFamily: 'inherit',
          themeVariables: isDark ? darkTheme : lightTheme,
          flowchart: { curve: 'basis', htmlLabels: true },
          sequence: { mirrorActors: false, showSequenceNumbers: false },
        });
        const { svg: rendered } = await mermaid.render(
          `mermaid-${reactId}-${isDark ? 'dark' : 'light'}`,
          source,
        );
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      })
      .catch((renderError: unknown) => {
        if (!cancelled) {
          setError(
            renderError instanceof Error
              ? renderError.message
              : String(renderError),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [source, reactId, resolvedTheme]);

  return (
    <figure className="not-prose group relative my-6 rounded-lg border border-fd-border bg-fd-card p-4">
      {error ? (
        <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-red-600 dark:text-red-400">
          Diagram failed to render: {error}
        </pre>
      ) : svg ? (
        <>
          <button
            type="button"
            onClick={openFullscreen}
            className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-fd-border bg-fd-background/80 px-2 py-1 text-xs text-fd-muted-foreground opacity-0 transition-opacity hover:text-fd-foreground focus-visible:opacity-100 group-hover:opacity-100"
            aria-label={`Expand diagram: ${label}`}
          >
            <Maximize2 className="size-3.5" aria-hidden="true" />
            Expand
          </button>
          <div
            role="img"
            aria-label={label}
            className="mermaid-diagram overflow-x-auto [&>svg]:mx-auto [&>svg]:h-auto [&>svg]:max-w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <dialog
            ref={dialogRef}
            aria-label={`${label} (expanded)`}
            onClick={(event) => {
              if (event.target === event.currentTarget) closeFullscreen();
            }}
            className="m-auto w-[min(96vw,1600px)] max-w-none rounded-xl border border-fd-border bg-fd-background p-0 text-fd-foreground shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
          >
            <div className="flex items-center justify-between gap-4 border-b border-fd-border px-4 py-2">
              <span className="text-sm text-fd-muted-foreground">{label}</span>
              <button
                type="button"
                onClick={closeFullscreen}
                className="inline-flex items-center gap-1 rounded-md p-1.5 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
                aria-label="Close expanded diagram"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div
              className="max-h-[85vh] overflow-auto p-6 [&>svg]:mx-auto [&>svg]:h-auto [&>svg]:w-full [&>svg]:!max-w-none"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </dialog>
        </>
      ) : (
        <div
          className="h-48 animate-pulse rounded-md bg-fd-muted"
          aria-hidden="true"
        />
      )}
      {title && (
        <figcaption className="mt-3 text-center text-sm text-fd-muted-foreground">
          {title}
        </figcaption>
      )}
      <details className="mt-3 text-xs text-fd-muted-foreground">
        <summary className="cursor-pointer select-none hover:text-fd-foreground">
          Diagram source
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-md bg-fd-muted p-3 font-mono text-[11px] leading-relaxed text-fd-foreground">
          {source}
        </pre>
      </details>
    </figure>
  );
}
