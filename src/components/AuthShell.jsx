import FlashStack from "./FlashStack.jsx";

export default function AuthShell({ flash, onClearFlash, children }) {
  return (
    <div className="min-h-screen bg-[#FCFAF7] dark:bg-[#141517]">
      <div className="mx-auto max-w-[1280px] px-4">
        <header className="sticky top-0 z-30 -mx-4 px-4 bg-[#FCFAF7]/80 dark:bg-[#141517]/80 backdrop-blur-md border-b border-[#E5E7EB] dark:border-neutral-800">
          <div className="flex items-center h-14">
            <span className="font-sans text-xl font-bold tracking-tight text-[#2a14b4] dark:text-[#c3c0ff]">
              ODA
            </span>
          </div>
        </header>

        <FlashStack flash={flash} onDismiss={onClearFlash} bottom />

        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
