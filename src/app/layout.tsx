import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import { MotionRoot } from "@/features/shell/MotionRoot";
import { ScrollProgress } from "@/features/shell/ScrollProgress";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const serifDisplay = Playfair_Display({ variable: "--font-serif-display", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dayline",
  description: "Your interests. One morning paper. Five minutes well spent.",
};

const THEME_BOOT = `try{var t=localStorage.getItem("dayline-theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t}}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className={`${geistSans.variable} ${serifDisplay.variable} flex min-h-screen flex-col antialiased`}>
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-30 focus:bg-card focus:px-3 focus:py-2">
          Skip to content
        </a>
        <MotionRoot>
          <ScrollProgress />
          {children}
        </MotionRoot>
      </body>
    </html>
  );
}
