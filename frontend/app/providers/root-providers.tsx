"use client";

import { ThemeProvider } from "@/app/context/Theme/ThemeContext";
import { ReduxProvider } from "@/app/providers/redux-provider";
import { SocketProvider } from "@/app/providers/socket-provider";
import { CurrencyProvider } from "../context/Curency/CurrencyContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AuthBootstrap from "@/app/components/AuthBootstrap/AuthBootstrap";
export function Providers({ children }: { children: React.ReactNode }) {
  const CLIENT_ID: string = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string;
  return (
    <ReduxProvider>
      <AuthBootstrap />
      <SocketProvider>
        <CurrencyProvider>
          <GoogleOAuthProvider clientId={CLIENT_ID}>
            <ThemeProvider>{children}</ThemeProvider>
          </GoogleOAuthProvider>
        </CurrencyProvider>
      </SocketProvider>
    </ReduxProvider>
  );
}
