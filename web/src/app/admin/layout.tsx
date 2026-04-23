export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // Keep /admin/login clean; protected admin pages use /admin/(protected)/layout.tsx
  return <>{children}</>;
}

