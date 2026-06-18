import { Input } from "../ui/input.jsx";
import { Button } from "../ui/button.jsx";

export default function TableLookupForm({ tableInput, onTableInputChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="table-reference" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Table reference
        </label>
        <Input
          id="table-reference"
          value={tableInput}
          onChange={(e) => onTableInputChange(e.target.value)}
          placeholder="e.g. 12"
          aria-label="Table reference"
          className="h-12 rounded-xl border-border bg-background text-base text-foreground placeholder:text-muted-foreground"
        />
      </div>
      <Button
        type="submit"
        className="h-12 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold active:scale-[0.98]"
      >
        View menu
      </Button>
    </form>
  );
}
