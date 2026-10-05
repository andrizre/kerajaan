import { DemoProvider } from "@/components/DemoProvider";
import { DemoTopBar, DemoBottomNav } from "@/components/DemoNav";

export const dynamic = "force-static";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <DemoTopBar />
      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-4 md:pb-8">{children}</main>
      <DemoBottomNav />
    </DemoProvider>
  );
}
