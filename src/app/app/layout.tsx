import { SignOutButton } from "@/components/features/SignOutButton";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
        <span className="text-h3 font-semibold text-stone-900">UniFit</span>
        <SignOutButton />
      </header>
      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
