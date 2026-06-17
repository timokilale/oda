import FlashStack from "./FlashStack.jsx";

export default function AuthShell({ flash, onClearFlash, children }) {
  return (
    <div className="mx-auto max-w-[1280px] px-4">
      <header className="sticky top-0 z-30 -mx-4 px-4 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center h-12">
          <span className="text-xl font-bold tracking-tight text-foreground">
            ODA
          </span>
        </div>
      </header>

      <FlashStack flash={flash} onDismiss={onClearFlash} bottom />

      <main>
        {children}
      </main>
    </div>
  );
}
