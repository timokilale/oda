import { useState, useMemo } from 'react';
import { Table } from '../types';
import { 
  Plus, 
  Printer, 
  TrendingUp, 
  CheckCircle, 
  QrCode, 
  Download, 
  Share2, 
  Trash2,
  ChevronDown
} from 'lucide-react';

interface TablesViewProps {
  tables: Table[];
  setTables: (tables: Table[] | ((prev: Table[]) => Table[])) => void;
}

export default function TablesView({
  tables,
  setTables
}: TablesViewProps) {
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableStatus, setNewTableStatus] = useState<'ACTIVE' | 'PENDING'>('ACTIVE');

  // Interactive stats calculated dynamically
  const totalTablesCount = useMemo(() => tables.length, [tables]);
  
  const totalScansValue = useMemo(() => {
    return tables.reduce((acc, curr) => acc + curr.scansCount, 0);
  }, [tables]);

  const activeOrdersVal = useMemo(() => {
    return tables.filter(t => t.status === 'ACTIVE').length;
  }, [tables]);

  // Handle actions
  const handleAddNewTableSubmit = () => {
    if (!newTableNum.trim()) {
      alert('Please enter a valid table number/label.');
      return;
    }

    const formattedId = newTableNum.trim().padStart(2, '0');
    
    // Check if table label already exists
    if (tables.some(t => t.id === formattedId)) {
      alert(`Table ${formattedId} already exists in the catalog.`);
      return;
    }

    const newTable: Table = {
      id: formattedId,
      status: newTableStatus,
      scansCount: 0,
      activeOrdersCount: 0,
      qrVerified: false
    };

    setTables((prev) => [...prev, newTable].sort((a,b) => a.id.localeCompare(b.id)));
    setNewTableNum('');
    setShowAddTableModal(false);
  };

  const handleDeleteTable = (id: string) => {
    if (confirm(`Are you sure you want to delete Table ${id} permanently? This will invalidate its active QR code.`)) {
      setTables((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleDownloadQR = (id: string) => {
    // High-fidelity dynamic file download
    const element = document.createElement("a");
    const file = new Blob([`RestoManage QR Code File for Table ${id}\nScan Link: https://ais-dev-preview.run/table/${id}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `table-${id}-qr.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleShareQR = (id: string) => {
    const linkUrl = `https://ais-dev-gco2md3hjhfjrrwavnei3y-963660794889.run.app/table/${id}`;
    navigator.clipboard.writeText(linkUrl);
    alert(`Link copied to clipboard!\n${linkUrl}`);
  };

  const handlePrintAllQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow popups to print QR sheets.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Tables QR Code Catalog Sheet | RestoManage</title>
          <style>
            body { font-family: 'Geist', sans-serif; padding: 40px; color: #191c1d; text-align: center; }
            .qr-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; }
            .qr-card { border: 2px solid #E5E7EB; padding: 24px; border-radius: 16px; margin: 20px; text-align: center; }
            .qr-id { font-size: 24px; font-weight: bold; color: #2a14b4; margin-top: 10px; }
            .branding { font-size: 14px; color: #5b598c; margin-top: 5px; }
          </style>
        </head>
        <body>
          <h2>Bistro Modern Restaurant QR Tables Sheet</h2>
          <div class="qr-grid">
            ${tables.map(t => `
              <div class="qr-card">
                <div style="font-size: 80px; color: #2a14b4;">▣</div>
                <div class="qr-id">TABLE ${t.id}</div>
                <div class="branding">RestoManage • Dynamic Ordering System</div>
              </div>
            `).join('')}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div id="table-management-view" className="space-y-6">
      
      {/* Header operations area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-sans text-xl font-bold text-neutral-800 dark:text-neutral-100">
            Table QR Dashboard
          </h2>
          <p className="font-sans text-xs text-neutral-500">
            Provision dining QR labels, monitor table scan metrics, and track table engagement.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Add Table trigger button */}
          <button
            onClick={() => setShowAddTableModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#2a14b4] text-[#2a14b4] font-semibold hover:bg-[#EEF2FF] transition-all active:scale-95 text-xs uppercase cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tables</span>
          </button>
          
          {/* Print all code button */}
          <button
            onClick={handlePrintAllQR}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2a14b4] text-white font-semibold hover:opacity-90 transition-all active:scale-95 text-xs uppercase cursor-pointer shadow-md shadow-[#2a14b4]/10"
          >
            <Printer className="w-4 h-4" />
            <span>Print All QR Codes</span>
          </button>
        </div>
      </div>

      {/* Bento Grid Analytics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-6 rounded-2xl flex flex-col justify-between shadow-xs">
          <span className="text-neutral-400 font-sans text-[10px] font-bold uppercase tracking-wider">Total Tables</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="font-mono text-3xl font-bold text-[#2a14b4] dark:text-[#c3c0ff]">
              {totalTablesCount}
            </span>
            <span className="text-[#10B981] font-sans text-xs font-semibold flex items-center ml-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              +2 added
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-6 rounded-2xl flex flex-col justify-between shadow-xs">
          <span className="text-neutral-400 font-sans text-[10px] font-bold uppercase tracking-wider">Active Scans (Today)</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="font-mono text-3xl font-bold text-[#5b598c] dark:text-neutral-300">
              {totalScansValue}
            </span>
            <span className="text-neutral-400 font-sans text-xs">
              Avg. {(totalScansValue / (totalTablesCount || 1)).toFixed(1)} per table
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-6 rounded-2xl flex flex-col justify-between shadow-xs">
          <span className="text-neutral-400 font-sans text-[10px] font-bold uppercase tracking-wider">Active Orders Capacity</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="font-mono text-3xl font-bold text-[#2a14b4] dark:text-[#c3c0ff]">
              {activeOrdersVal}
            </span>
            <span className="bg-[#4338ca]/15 text-[#2a14b4] dark:text-[#c1beff] px-2.5 py-0.5 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider leading-none ml-1">
              {Math.min(100, Math.round((activeOrdersVal / (totalTablesCount || 1)) * 100))}% Capacity
            </span>
          </div>
        </div>

      </section>

      {/* Grid Canvas containing QR codes */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
        
        {/* Table loop cards */}
        {tables.map((table) => {
          const isPending = table.status === 'PENDING';
          const isActive = table.status === 'ACTIVE';
          return (
            <div 
              key={table.id}
              className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 rounded-xl overflow-hidden group hover:border-[#2a14b4] transition-colors flex flex-col shadow-xs"
            >
              {/* Card Header metadata */}
              <div className="p-4 border-b border-[#E5E7EB] dark:border-neutral-800 flex justify-between items-center bg-[#f3f4f5]/40 dark:bg-neutral-950/20">
                <div className="flex flex-col">
                  <span className="font-sans text-[9px] font-bold text-neutral-400 uppercase tracking-widest">TABLE</span>
                  <span className="font-mono text-xl font-bold text-[#2a14b4] dark:text-[#c1beff]">{table.id}</span>
                </div>
                
                {/* Status Pill Indicator */}
                <div className={`px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                  isActive 
                    ? 'bg-[#10B981]/10 text-[#10B981]' 
                    : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                  }`} />
                  <span className="font-sans text-[9px] font-bold uppercase tracking-widest leading-none">
                    {table.status}
                  </span>
                </div>
              </div>

              {/* Card Body - Containing centered QR block */}
              <div className="p-6 flex flex-col items-center flex-grow">
                
                <div className="relative p-3 bg-white border border-[#E5E7EB] rounded-xl mb-4 shadow-sm">
                  {/* Dotted QR Pattern */}
                  <div className={`w-36 h-36 qr-pattern rounded-lg flex items-center justify-center transition-all ${
                    isPending ? 'opacity-40 grayscale-[0.5]' : ''
                  }`}>
                    <QrCode className="w-16 h-16 text-[#2a14b4] stroke-[1.25]" />
                  </div>
                  
                  {/* Verified check indicator */}
                  {table.qrVerified && (
                    <div className="absolute -bottom-1.5 -right-1.5 bg-[#2a14b4] text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md shadow-[#2a14b4]/20 border-2 border-white">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                <div className="font-sans text-center text-[10px] text-neutral-400 mb-4 font-semibold uppercase tracking-wider">
                  {table.scansCount} total scan gestures
                </div>

                {/* Card interactive actions */}
                <div className="flex items-center justify-center gap-1 w-full border-t border-[#E5E7EB]/50 dark:border-neutral-800/50 pt-3">
                  <button
                    onClick={() => handleDownloadQR(table.id)}
                    className="flex-1 flex flex-col items-center gap-0.5 p-1 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-all cursor-pointer"
                    title="Download Table QR Code"
                  >
                    <Download className="w-4 h-4" />
                    <span className="font-sans text-[9px] font-bold uppercase tracking-wider">Download</span>
                  </button>
                  
                  <button
                    onClick={() => handleShareQR(table.id)}
                    className="flex-1 flex flex-col items-center gap-0.5 p-1 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-all cursor-pointer"
                    title="Copy QR Scan URL Link"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="font-sans text-[9px] font-bold uppercase tracking-wider">Share</span>
                  </button>
                  
                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    className="flex-1 flex flex-col items-center gap-0.5 p-1 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-all cursor-pointer"
                    title="Delete QR Table Record"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="font-sans text-[9px] font-bold uppercase tracking-wider">Delete</span>
                  </button>
                </div>

              </div>
            </div>
          );
        })}

        {/* Add Table Skeleton trigger box */}
        <button
          onClick={() => setShowAddTableModal(true)}
          className="border-2 border-dashed border-[#E5E7EB] dark:border-neutral-800 rounded-xl flex flex-col items-center justify-center p-6 hover:border-[#2a14b4] hover:bg-[#EEF2FF]/5 transition-all group active:scale-98 cursor-pointer h-full min-h-[300px]"
        >
          <div className="w-12 h-12 rounded-full bg-[#f3f4f5] dark:bg-neutral-800 flex items-center justify-center mb-3 group-hover:bg-[#4338ca] transition-all">
            <Plus className="w-6 h-6 text-neutral-500 group-hover:text-white transition-all" />
          </div>
          <span className="font-sans font-bold text-sm text-neutral-800 dark:text-neutral-300">
            Add Table
          </span>
          <span className="text-neutral-400 font-sans text-xs text-center mt-2 px-4 leading-normal">
            Generate new dynamic QR codes for additional physical dining locations.
          </span>
        </button>

      </section>

      {/* Add Table input popup */}
      {showAddTableModal && (
        <div className="fixed inset-0 bg-neutral-950/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
              <h3 className="font-sans text-base font-bold text-neutral-800 dark:text-white">
                Add Table Dining Space
              </h3>
              <button 
                onClick={() => setShowAddTableModal(false)}
                className="text-neutral-400 hover:text-neutral-600 font-sans text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                  Table Number / Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. 05 or 19"
                  maxLength={5}
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 px-3.5 py-2.5 rounded-xl text-sm focus:ring-1 focus:ring-[#4338ca] outline-none dark:text-white text-center font-mono font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                  Initial Status Setup
                </label>
                <div className="relative">
                  <select
                    value={newTableStatus}
                    onChange={(e) => setNewTableStatus(e.target.value as 'ACTIVE' | 'PENDING')}
                    className="w-full bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 px-3 py-2 rounded-xl text-xs outline-none dark:text-white appearance-none"
                  >
                    <option value="ACTIVE">ACTIVE (Immediate use)</option>
                    <option value="PENDING">PENDING (Hold qr codes)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowAddTableModal(false)}
                className="py-2 rounded-xl border border-neutral-200 text-neutral-500 font-sans text-xs font-bold hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewTableSubmit}
                className="py-2 rounded-xl bg-[#2a14b4] text-white font-sans text-xs font-bold hover:opacity-90 transition-all text-center flex items-center justify-center"
              >
                Create table
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
