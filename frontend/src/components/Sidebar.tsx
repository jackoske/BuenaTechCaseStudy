"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Properties", href: "/properties", icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(true);

  // Sync state with current class on mount
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  };

  return (
    <aside className="w-60 border-r bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.png" alt="Buena" className="h-7 w-7 mr-2.5 rounded-sm" />
        <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">
          Buena Property
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer: theme toggle */}
      <div className="p-4 border-t border-sidebar-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Buena Case Study</p>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
