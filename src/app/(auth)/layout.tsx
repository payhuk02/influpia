import Link from "next/link";
import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left side - Branding (Hidden on mobile) */}
      <div className="hidden md:flex flex-1 relative flex-col justify-between p-10 bg-black overflow-hidden border-r border-white/10">
        {/* Background effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 to-accent/10 pointer-events-none" />
        <div className="absolute -left-1/4 -bottom-1/4 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">I</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Influpia</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold text-white mb-4">
            L'influence, <br />
            <span className="text-gradient">simplifiée et sécurisée.</span>
          </h2>
          <p className="text-white/60 text-lg">
            Rejoignez la marketplace leader en Afrique et collaborez avec les meilleurs talents.
          </p>
        </div>
      </div>

      {/* Right side - Forms */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        {/* Mobile Logo */}
        <div className="absolute top-6 left-6 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">I</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Influpia</span>
          </Link>
        </div>
        
        <div className="w-full max-w-md space-y-8 relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
