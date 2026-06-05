import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display-raw', weight: ['400','500','600','700'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-body-raw', weight: ['300','400','500','600'] });

export const metadata = {
  title: 'SaveDown - Download TikTok, Instagram & Facebook',
  description: 'Free social media downloader. Download TikTok videos without watermark, Instagram posts, reels, stories, and Facebook videos.',
  keywords: ['tiktok downloader', 'instagram downloader', 'facebook video download', 'no watermark'],
  openGraph: {
    title: 'SaveDown - Free Social Media Downloader',
    description: 'Download TikTok without watermark, Instagram & Facebook — free, fast, no sign-up.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <head>
        {/* Google AdSense — replace with your publisher ID */}
        {/* <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX" crossOrigin="anonymous" /> */}
      </head>
      <body>{children}</body>
    </html>
  );
}
