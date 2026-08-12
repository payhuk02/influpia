"use client";

import { Toaster } from "sonner";

export function ToasterProvider() {
  return (
    <Toaster 
      theme="dark" 
      position="bottom-right"
      toastOptions={{
        className: 'bg-background border border-white/10 text-white rounded-xl',
        descriptionClassName: 'text-white/60',
        style: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }
      }}
    />
  );
}
