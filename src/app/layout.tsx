import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import ThemeProvider from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const clerkAppearance = {
  variables: {
    colorPrimary: "var(--primary)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorBackground: "var(--background)",
    colorInputBackground: "var(--background)",
    colorInputText: "var(--foreground)",
    colorDanger: "var(--error)",
    colorSuccess: "var(--success)",
    borderRadius: "12px",
    fontFamily: "var(--font-geist-sans)",
  },
  elements: {
    card: "bg-[var(--background)] border border-[var(--border)] shadow-xl",
    headerTitle: "text-[var(--foreground)]",
    headerSubtitle: "text-[var(--muted-foreground)]",
    formButtonPrimary:
      "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]",
    socialButtonsBlockButton:
      "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]",
    formFieldInput:
      "bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] focus:ring-[var(--ring)] focus:border-[var(--ring)]",
    footerActionLink: "text-[var(--primary)] hover:text-[var(--primary-hover)]",
  },
};

export const metadata: Metadata = {
  title: "FirstDevJob - Find Your First Tech Job",
  description: "Find your first tech job",
  icons: {
    icon: "/apple-touch-icon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get Clerk publishable key - may be undefined during build
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning={true}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme) {
                    document.documentElement.setAttribute('data-theme', theme);
                  } else {
                    var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    var defaultTheme = systemPrefersDark ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', defaultTheme);
                    localStorage.setItem('theme', defaultTheme);
                  }
                } catch (e) {
                  // Fallback to dark theme if localStorage fails
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {clerkPubKey ? (
          <ClerkProvider appearance={clerkAppearance}>
            <ConvexClientProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </ConvexClientProvider>
          </ClerkProvider>
        ) : (
          <ThemeProvider>{children}</ThemeProvider>
        )}
      </body>
    </html>
  );
}
