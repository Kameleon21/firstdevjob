import Link from "next/link";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

const feedbackBoardUrl = process.env.NEXT_PUBLIC_FEEDBACK_BOARD_URL?.trim();

export const metadata = {
  title: "Privacy Policy | FirstDevJob",
  description: "How FirstDevJob handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: February 7, 2026
        </p>

        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">What we collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                Account identity through Clerk (for example email address and
                authentication identifier).
              </li>
              <li>
                Profile information you provide, such as your name.
              </li>
              <li>
                Job tracking data you add, including saved jobs, application
                status, and optional notes.
              </li>
              <li>
                Job posts submitted through the platform (title, company,
                location, URL, tags).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">How we use data</h2>
            <p className="text-muted-foreground">
              We use this data only to run core product features: account
              access, profile display, bookmarking/tracking jobs, and job
              posting/moderation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Local storage and cookies</h2>
            <p className="text-muted-foreground">
              We use minimal client-side storage for app behavior (for example
              theme preference and one-time UI notifications after redirects).
              Authentication providers may also use cookies required for sign-in
              sessions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Third-party services</h2>
            <p className="text-muted-foreground">
              FirstDevJob uses Clerk for authentication and Convex for backend
              data storage/sync.
              {feedbackBoardUrl && (
                <>
                  {" "}
                  We also use Fider for the public feedback board at{" "}
                  <a
                    href={feedbackBoardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:opacity-80"
                  >
                    {feedbackBoardUrl}
                  </a>
                  .
                </>
              )}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Deleting your data</h2>
            <p className="text-muted-foreground">
              You can delete your account from Profile &gt; Security. This
              removes your profile and tracked application data in the app and
              deletes your Clerk account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="text-muted-foreground">
              For privacy questions, open an issue on{" "}
              <a
                href="https://github.com/Kameleon21/firstdevjob"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:opacity-80"
              >
                GitHub
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-10">
          <Link href="/" className="text-accent hover:opacity-80">
            Back to jobs
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
