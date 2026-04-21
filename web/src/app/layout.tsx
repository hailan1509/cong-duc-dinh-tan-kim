import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Công đức đình Tân Kim",
  description: "Quản lý và hiển thị danh sách công đức theo ngày lễ.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

