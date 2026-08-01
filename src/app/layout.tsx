import type { Metadata, Viewport } from "next";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI Tutor — Learn AI, ML & RAG interactively",
    template: "%s · AI Tutor",
  },
  description:
    "An interactive course on large language models, machine learning, and retrieval-augmented generation. Hands-on labs, quizzes, and an AI tutor that answers questions in context.",
};

export const viewport: Viewport = {
  themeColor: "#f2f3f7",
  width: "device-width",
  initialScale: 1,
  // Allow pinch-zoom — capping it is an accessibility regression.
  maximumScale: 5,
  // Without this, `env(safe-area-inset-*)` resolves to 0 on iOS, and fixed
  // bottom-anchored elements (the tutor launcher) can sit under Safari's own
  // toolbar / the home-indicator gesture area, making them untappable.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-indigo-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main">{children}</main>
        <footer className="mt-24 border-t border-ink-800 px-5 py-10 text-center text-sm text-ink-500">
          <p>
            Built with Next.js and a local Ollama model. Progress is stored
            locally in your browser.
          </p>
        </footer>
      </body>
    </html>
  );
}
