"use client";

import Link from "next/link";
import { Github } from "lucide-react";

const GITHUB_URL = "https://github.com/Kameleon21/firstdevjob";
const FEEDBACK_BOARD_URL = process.env.NEXT_PUBLIC_FEEDBACK_BOARD_URL?.trim();

export default function SiteFooter() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            FirstDevJob
          </p>
          <div className="flex items-center gap-5">
            {FEEDBACK_BOARD_URL ? (
              <a
                href={FEEDBACK_BOARD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Feedback
              </a>
            ) : (
              <Link
                href="/feedback"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Feedback
              </Link>
            )}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub repository"
            >
              <Github size={16} />
              GitHub
            </a>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
