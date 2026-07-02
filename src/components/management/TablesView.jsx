import { useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';

export default function TablesView({ tables, setTables, onAddTable, onDeleteTable, restaurantRef, settingsIncomplete }) {
  const { toast } = useToast();
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');

  const handleAddNewTableSubmit = () => {
    if (!newTableNum.trim()) { toast({ type: 'warning', title: 'Validation', message: 'Please enter a valid table number/label.' }); return; }
    if (tables.some(t => t.tableNumber === newTableNum.trim())) { toast({ type: 'warning', title: 'Duplicate', message: `Table ${newTableNum.trim()} already exists.` }); return; }
    onAddTable({ tableNumber: newTableNum.trim() });
    setNewTableNum('');
    setShowAddTableModal(false);
  };

  const handleDeleteTable = (table) => {
    if (onDeleteTable) {
      onDeleteTable(table.tableNumber);
    } else {
      setTables((prev) => prev.filter((t) => t.id !== table.id));
    }
    toast({ type: 'success', title: 'Deleted', message: `Table ${table.tableNumber} has been removed.` });
  };

  const handleCopyLink = (tableNumber) => {
    const linkUrl = `${window.location.origin}/order/${restaurantRef}?table=${tableNumber}`;
    try {
      navigator.clipboard.writeText(linkUrl);
      toast({ type: 'success', title: 'Link copied', message: `Table ${tableNumber} link copied to clipboard.` });
    } catch {
      toast({ type: 'info', title: 'Link', message: linkUrl });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => {
          if (settingsIncomplete) {
            toast({ type: 'warning', title: 'Settings required', message: 'Fill in your restaurant profile in Settings first.' });
            return;
          }
          setShowAddTableModal(true);
        }} className="bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-800 px-4 py-2 rounded-lg font-sans text-xs font-medium hover:opacity-80 transition-all cursor-pointer">
          Add Table
        </button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => (
          <div key={table.id} className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 rounded-lg overflow-hidden flex flex-col">
            <div className="p-6 flex flex-col items-center flex-grow">
              <span className="font-mono text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{table.tableNumber}</span>
              <div className="flex items-center gap-2 w-full border-t border-[#E5E7EB]/50 dark:border-neutral-800/50 pt-3 mt-auto">
                <button onClick={() => handleCopyLink(table.tableNumber)} className="flex-1 p-2 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-all cursor-pointer text-xs font-sans font-medium">
                  Copy Link
                </button>
                <button onClick={() => handleDeleteTable(table)} className="flex-1 p-2 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-600 transition-all cursor-pointer text-xs font-sans font-medium">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {tables.length === 0 && !showAddTableModal && (
        <div className="text-center py-16">
          <p className="font-sans text-sm text-neutral-500">No tables yet.</p>
        </div>
      )}

      {showAddTableModal && (
        <div className="fixed inset-0 bg-neutral-950/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-full max-w-sm border border-[#E5E7EB] dark:border-neutral-800 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
              <h3 className="font-sans text-sm font-medium text-neutral-800 dark:text-neutral-100">Add Table</h3>
              <button onClick={() => setShowAddTableModal(false)} className="text-neutral-400 hover:text-neutral-600 font-sans text-sm cursor-pointer">Close</button>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-neutral-400 mb-1">Number / Label</label>
              <input type="text" placeholder="e.g. 05" maxLength={5} value={newTableNum} onChange={(e) => setNewTableNum(e.target.value)} className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 px-3 py-2 rounded-lg text-sm focus:ring-1 focus:ring-neutral-400 outline-none dark:text-neutral-100 text-center font-mono font-medium" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={() => setShowAddTableModal(false)} className="py-2 rounded-lg border border-[#E5E7EB] dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 font-sans text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer">Cancel</button>
              <button onClick={handleAddNewTableSubmit} className="py-2 rounded-lg bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-800 font-sans text-xs font-medium hover:opacity-80 transition-all cursor-pointer">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
