"use client";

import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";

export default function HeroProvider({ children }: { children: any }) {
  return (
    <HeroUIProvider className="h-full">
      <ToastProvider />
      {children}
    </HeroUIProvider>
  );
}
