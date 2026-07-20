import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sacred Geography — An Historical Atlas of the Bible',
  description:
    'An interactive historical atlas of the biblical world: places, people, routes and empires from the patriarchal age to the apostolic mission, with sources and scholarly uncertainty shown rather than hidden.',
  applicationName: 'Sacred Geography',
  authors: [{ name: 'Sacred Geography' }],
  openGraph: {
    title: 'Sacred Geography',
    description: 'An interactive historical atlas of the biblical world.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The map handles its own zoom; letting the page zoom as well makes pinch
  // gestures ambiguous on touch devices. Text scaling still works through the
  // browser's own font-size setting, so this does not trap users at 100%.
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e7ddc6' },
    { media: '(prefers-color-scheme: dark)', color: '#191710' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
