import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ThemeMode from "@/components/theme-mode";
import { ProfileProvider } from "@/lib/profile";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Neura | Your Child's AI Tutor",
  description:
    "An adaptive Socratic AI tutor that learns who your child is before teaching what they're struggling with.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-mode="parent"
      className={`${inter.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeMode />
        <ProfileProvider>{children}</ProfileProvider>
      </body>
    </html>
  );
}
