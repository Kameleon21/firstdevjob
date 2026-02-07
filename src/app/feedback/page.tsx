import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

const feedbackBoardUrl = process.env.NEXT_PUBLIC_FEEDBACK_BOARD_URL?.trim() ?? "";
const hasFeedbackBoard = feedbackBoardUrl.length > 0;

export const metadata = {
  title: "Feedback | FirstDevJob",
  description: "Share feature requests and report bugs for FirstDevJob.",
};

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <h1 className="text-3xl font-bold mb-4">Feedback Board</h1>
        <p className="text-muted-foreground mb-8">
          Help shape FirstDevJob by submitting feature requests or reporting bugs.
          You can vote on existing posts so the most useful ideas rise to the top.
        </p>

        <div className="bg-background border border-border rounded-2xl p-6 sm:p-8 space-y-5 shadow-lg">
          <div>
            <h2 className="text-xl font-semibold mb-2">What to post</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Feature requests (what you want to see next).</li>
              <li>Bug reports (what is broken and where).</li>
              <li>Upvotes on existing posts that match your needs.</li>
            </ul>
          </div>

          {hasFeedbackBoard ? (
            <a
              href={feedbackBoardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
            >
              Open Feedback Board
            </a>
          ) : (
            <div className="rounded-lg border border-warning bg-warning-background px-4 py-3 text-warning">
              Feedback board is not configured yet. Check back soon.
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
