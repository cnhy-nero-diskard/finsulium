import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LoadingOverlay } from "@/components/loading-overlay";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FINSULIUM - Privacy-First Personal Finance",
  description: "Mindful finance tracking with data sovereignty and powerful insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={null}>
          <LoadingOverlay />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
