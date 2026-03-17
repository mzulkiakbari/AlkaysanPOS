import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import AlkaysanClientProvider from "./components/AlkaysanClientProvider";
import SessionWrapper from "./components/SessionWrapper";
import GlobalOfflineBanner from "./components/GlobalOfflineBanner";
import SyncService from "./components/SyncService";


// Use local fonts or handle build-time fetch issues
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata = {
  title: "Alkaysan Cashier",
  description: "Alkaysan Cashier",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#2F4F4F",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  shrinkToFit: "no",
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AlkaysanClientProvider>
          <AuthProvider>
            <SessionWrapper>
              {children}
            </SessionWrapper>
            <GlobalOfflineBanner />
            <SyncService />
          </AuthProvider>
        </AlkaysanClientProvider>
      </body>
    </html>
  );
}
