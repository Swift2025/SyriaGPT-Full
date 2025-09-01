import type { Metadata } from 'next';
import { Noto_Sans_Arabic } from 'next/font/google';

const notoArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SyriaGPT',
  description: 'SyriaGPT Chatbot',
  icons: {
    icon: '/logo.ai.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${notoArabic.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
