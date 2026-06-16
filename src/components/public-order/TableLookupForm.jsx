import { Input } from "../ui/input.jsx";
import { Button } from "../ui/button.jsx";

export default function TableLookupForm({ tableInput, onTableInputChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="table-reference" className="text-xs uppercase tracking-widest text-stone-500">
          Table reference
        </label>
        <Input
          id="table-reference"
          value={tableInput}
          onChange={(e) => onTableInputChange(e.target.value)}
          placeholder="Enter table reference"
          aria-label="Table reference"
          className="h-11 rounded-xl border-stone-200 bg-white/80 text-stone-800 placeholder:text-stone-400"
        />
      </div>
      <Button type="submit" className="h-11 rounded-xl bg-amber-700 text-stone-50 hover:bg-amber-800 cursor-pointer">
        Load menu
      </Button>
    </form>
  );
}
