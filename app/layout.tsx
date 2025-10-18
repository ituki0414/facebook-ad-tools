import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Review Location Analyst',
  description: 'AI-powered store review analysis platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
