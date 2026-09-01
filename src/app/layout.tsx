import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/pos/Sidebar";

export const metadata: Metadata = {
  title: "Advance POS",
  description: "Fast Food + Mini Mart point of sale",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex bg-bg text-text">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </body>
    </html>
  );
}
