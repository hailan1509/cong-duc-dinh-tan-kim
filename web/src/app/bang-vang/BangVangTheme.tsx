"use client";

import { useEffect } from "react";

export default function BangVangTheme() {
  useEffect(() => {
    document.body.classList.add("bang-vang");
    return () => document.body.classList.remove("bang-vang");
  }, []);
  return null;
}

