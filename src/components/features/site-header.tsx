import type { ReactNode } from "react";
import Link from "next/link";

export function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="site-header">
      <Link className="brand" href="/">frame<span>pay</span></Link>
      {children && <nav aria-label="Primary navigation">{children}</nav>}
    </header>
  );
}
