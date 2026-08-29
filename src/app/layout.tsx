import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ThemeInitializer } from "@/components/layout/ThemeInitializer";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SynergyBridge | Problem → Research → Innovation → Solution → Measurable Impact",
  description: "A collaborative platform connecting students, academia, industry, and government to transform real-world challenges into measurable solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storageKey = "synergybridge_user_settings";
                  var stored = localStorage.getItem(storageKey);
                  var theme = "light";
                  if (stored) {
                    var parsed = JSON.parse(stored);
                    if (parsed.theme) theme = parsed.theme;
                  }
                  var isDark = theme === "dark";
                  if (isDark) {
                    document.documentElement.classList.add("dark");
                    document.documentElement.setAttribute("data-theme", "dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                    document.documentElement.setAttribute("data-theme", "light");
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen antialiased bg-[#F6F5F2] dark:bg-[#0B0D14] text-[#1C1C1E] dark:text-[#F3F4F6]`}>
        <AuthProvider>
          <ThemeInitializer />
          <OfflineBanner />
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155'
              }
            }} 
          />
        </AuthProvider>
      </body>
    </html>
  );
}
