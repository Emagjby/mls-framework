import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConditionalHeader from "../components/layout/ConditionalHeader";
import ConditionalFooter from "../components/layout/ConditionalFooter";
import StagewiseDevToolbar from "../components/StagewiseDevToolbar";
import { ThemeProvider } from "../components/providers/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MLS Framework",
  description: "A modular learning system engine with demo UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <StagewiseDevToolbar />
          <div className="min-h-screen flex flex-col">
            <ConditionalHeader />
            <main className="flex-1">{children}</main>
            <ConditionalFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
