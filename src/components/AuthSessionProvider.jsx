"use client";

import { SessionProvider } from "next-auth/react";
import ToastProvider from "@/components/ui/ToastProvider";

export default function AuthSessionProvider({ children }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
