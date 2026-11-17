import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata = {
  title: {
    default: "HasiLaut | Hasil Laut Segar Langsung dari Nelayan",
    template: "%s | HasiLaut",
  },
  description:
    "Platform jual beli hasil laut segar langsung dari nelayan dan mitra pesisir dalam satuan kilogram untuk kebutuhan usaha kuliner maupun rumah tangga.",
};

function NavbarFallback() {
  return (
    <div
      aria-hidden="true"
      className="w-full h-[72px] bg-[#FFFFFF] border-b border-[#E2E8F0]"
    />
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0F172A] text-[16px] leading-[1.6] font-sans antialiased">
        <a href="#main-content" className="skip-link">
          Langsung ke konten utama
        </a>
        <AuthSessionProvider>
          <Suspense fallback={<NavbarFallback />}>
            <Navbar />
          </Suspense>
          <main id="main-content" tabIndex={-1} className="flex-1 w-full">
            {children}
          </main>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
