import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";

// Layout khusus versi server (grup route (web)). Demo (/demo) punya layout sendiri.
export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-4 md:pb-8">{children}</main>
      <BottomNav />
    </>
  );
}
