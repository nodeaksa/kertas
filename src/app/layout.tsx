import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import ThemeSync from "@/components/ThemeSync";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "kertas.",
  description: "Your little space for thoughts",
  icons: {
    icon: "/logo-kertas.png",
    shortcut: "/logo-kertas.png",
    apple: "/logo-kertas.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Script id="theme-preference" strategy="beforeInteractive">
          {`try {
const savedTheme = localStorage.getItem('kertas-theme');
const theme = savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system' ? savedTheme : 'system';
const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.classList.toggle('dark', isDark);
document.documentElement.dataset.theme = theme;
document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
} catch {}`}
        </Script>
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
