import MeritBoard from "./bang-vang/MeritBoard";
import BangVangTheme from "./bang-vang/BangVangTheme";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="page-root">
      <BangVangTheme />
      <MeritBoard />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700;900&family=Playfair+Display:wght@400;600;700;900&display=swap"
        rel="stylesheet"
      />
    </div>
  );
}

