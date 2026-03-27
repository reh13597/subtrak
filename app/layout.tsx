import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AmplifyConfig from "@/components/AmplifyConfig";
import Providers from "@/components/Providers";
import PageTransition from "@/components/layout/PageTransition";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "SubTrak",
  description: "Track and manage your subscriptions with ease.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <AmplifyConfig />
        <Providers>
          <Navbar />
          <main className="flex-grow">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
