"use client";

import { useState } from "react";
import { MobileFilterButton, MobileFilterDrawer } from "@/components/resource/CategoryFilterSidebar";
import type { NavCategory } from "@/components/nav/SiteHeader";

interface Props {
  activeCategory: string | null;
  navCategories: NavCategory[];
  activeChildren3: { id: string; name: string; slug: string }[];
}

export function MobileFilterClientWrapper({ activeCategory, navCategories, activeChildren3 }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <MobileFilterButton activeCategory={activeCategory} onClick={() => setOpen(true)} />
      <MobileFilterDrawer
        open={open}
        onClose={() => setOpen(false)}
        navCategories={navCategories}
        activeCategory={activeCategory}
        activeChildren3={activeChildren3}
      />
    </>
  );
}
