'use client';

import { useTheme } from 'next-themes';
import { Github, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function NavToolbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center gap-2 mb-2">
      <a
        href="https://github.com/Kameleon21/firstdevjob"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-md p-1.5 text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent transition-colors"
        aria-label="GitHub"
      >
        <Github className="size-4.5" />
      </a>
      <button
        type="button"
        onClick={() =>
          setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
        }
        className="inline-flex items-center justify-center rounded-md p-1.5 text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent transition-colors"
        aria-label="Toggle theme"
      >
        {mounted ? (
          <div className="relative size-4.5">
            <Sun
              className={`size-4.5 transition-all duration-300 ease-in-out ${
                resolvedTheme === 'dark'
                  ? 'rotate-90 scale-0'
                  : 'rotate-0 scale-100'
              }`}
            />
            <Moon
              className={`absolute top-0 left-0 size-4.5 transition-all duration-300 ease-in-out ${
                resolvedTheme === 'dark'
                  ? 'rotate-0 scale-100'
                  : '-rotate-90 scale-0'
              }`}
            />
          </div>
        ) : (
          <div className="size-4.5" />
        )}
      </button>
    </div>
  );
}
