import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Chat | Next.js Intelligent Assistant",
  description: "Experience the future of AI conversation with our advanced chat interface. Built with Next.js, TypeScript, and real-time streaming.",
  keywords: ['AI Chat', 'Next.js', 'TypeScript', 'Chatbot', 'Artificial Intelligence'],
  authors: [{ name: 'AI Chat Team' }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AI Interview Tutor',
  },
  openGraph: {
    title: 'AI Chat - Next.js Intelligent Assistant',
    description: 'Experience the future of AI conversation with our advanced chat interface.',
    type: 'website',
    locale: 'en_US',
    siteName: 'AI Chat',
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
