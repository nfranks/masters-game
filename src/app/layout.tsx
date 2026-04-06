import type { Metadata } from 'next';
import { Playfair_Display, Work_Sans } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const workSans = Work_Sans({
  variable: '--font-work-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Masters Madness',
  description: 'Masters Golf Tournament Pool Manager',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${workSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
