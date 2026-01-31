// Force dynamic rendering for SSO callback - requires ClerkProvider at runtime
export const dynamic = "force-dynamic";

export default function SSOCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
