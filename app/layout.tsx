import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AmplifyConfig from "@/components/AmplifyConfig";

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
        {/* Client-side Amplify configuration */}
        <AmplifyConfig />
        
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
