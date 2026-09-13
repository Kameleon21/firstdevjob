import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import { DocsKeyboardShortcuts } from './keyboard-shortcuts';
import './globals.css';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      theme={{
        enabled: true,
        attribute: 'data-theme',
        defaultTheme: 'dark',
        enableSystem: false,
      }}
    >
      <DocsLayout
        tree={source.pageTree}
        nav={{
          title: 'FirstDevJob Docs',
          url: '/docs',
        }}
        themeSwitch={{
          enabled: false,
        }}
        links={[
          {
            text: 'Back to Site',
            url: '/',
            external: true,
          },
        ]}
        sidebar={{
          defaultOpenLevel: 1,
        }}
      >
        <DocsKeyboardShortcuts />
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
