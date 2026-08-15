"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ThemeMode() {
  const pathname = usePathname();

  useEffect(() => {
    const isChild = pathname.startsWith("/child");
    document.documentElement.setAttribute("data-mode", isChild ? "board" : "parent");
  }, [pathname]);

  return null;
}
