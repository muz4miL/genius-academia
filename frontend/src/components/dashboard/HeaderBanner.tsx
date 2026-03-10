import { ReactNode } from "react";

interface HeaderBannerProps {
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
}

export function HeaderBanner({ title, subtitle, children }: HeaderBannerProps) {
  return (
    <div className="header-gradient rounded-xl p-4 sm:p-6 text-primary-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm sm:text-base text-primary-foreground/80">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
