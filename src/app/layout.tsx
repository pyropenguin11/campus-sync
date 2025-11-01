import type { Metadata } from "next";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "Campus Sync",
  description: "UMN tunnel explorer for the Gopher Way network.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
