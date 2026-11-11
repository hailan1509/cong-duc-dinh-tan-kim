import { Be_Vietnam_Pro, Noto_Serif } from "next/font/google";

// Vietnamese-friendly sans for the admin area (the public board keeps its own fonts).
export const adminFont = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

// Vietnamese serif for printed records and the public ledger page.
export const serifFont = Noto_Serif({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif-vn",
  display: "swap",
});
