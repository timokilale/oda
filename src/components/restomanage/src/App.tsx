import { useState, useEffect } from 'react';
import { Order, MenuItem, Table, ActivityLog } from './types';
import { 
  INITIAL_MENU_ITEMS, 
  INITIAL_ORDERS, 
  INITIAL_TABLES, 
  INITIAL_LOGS 
} from './data';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OrdersView from './components/OrdersView';
import MenuView from './components/MenuView';
import TablesView from './components/TablesView';
import ReportsView from './components/ReportsView';
import { BellRing, Check, Save } from 'lucide-react';

export default function App() {
  // Navigation active state
  const [activeTab, setActiveTab] = useState('orders');

  // Restaurant settings metadata
  const [restaurantName, setRestaurantName] = useState('Bistro Modern');
  const [branchName, setBranchName] = useState('Main Street Branch');

  // Master States
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const [ordersActive, setOrdersActive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Overlay simulated order toast state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertDetails, setAlertDetails] = useState({ title: '', desc: '' });

  // Initialize master states with seeded catalog values
  useEffect(() => {
    // Attempt load from localStorage if previously stored
    const valOrders = localStorage.getItem('resto_orders');
    const valMenu = localStorage.getItem('resto_menu');
    const valTables = localStorage.getItem('resto_tables');
    const valLogs = localStorage.getItem('resto_logs');
    const valRestoName = localStorage.getItem('resto_name');
    const valBranchName = localStorage.getItem('resto_branch');

    if (valOrders) setOrders(JSON.parse(valOrders));
    else setOrders(INITIAL_ORDERS);

    if (valMenu) setMenuItems(JSON.parse(valMenu));
    else setMenuItems(INITIAL_MENU_ITEMS);

    if (valTables) setTables(JSON.parse(valTables));
    else setTables(INITIAL_TABLES);

    if (valLogs) setLogs(JSON.parse(valLogs));
    else setLogs(INITIAL_LOGS);

    if (valRestoName) setRestaurantName(valRestoName);
    if (valBranchName) setBranchName(valBranchName);
  }, []);

  // Sync to localStorage on state modifications
  useEffect(() => {
    if (orders.length > 0) localStorage.setItem('resto_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (menuItems.length > 0) localStorage.setItem('resto_menu', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    if (tables.length > 0) localStorage.setItem('resto_tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    if (logs.length > 0) localStorage.setItem('resto_logs', JSON.stringify(logs));
  }, [logs]);

  // Audio Oscillator chime synthesizer
  const playAlertChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
      osc2.frequency.exponentialRampToValueAtTime(440.00, ctx.currentTime + 0.15); // A4

      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 0.5);
    } catch (err) {
      console.warn('Audio play block triggered:', err);
    }
  };

  // Simulate incoming live order from Table 08 after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (ordersActive) {
        // Create order Table 08
        const simulatedOrder: Order = {
          id: '#RM-4831',
          table: 'Table 08',
          status: 'Pending',
          items: [
            { name: 'Truffle Tagliatelle', quantity: 1, customization: 'Extra Parmesan' },
            { name: 'Zesty Tuna Crudo', quantity: 1, customization: 'Lime spray' },
            { name: 'Hibiscus Lime Sparkler', quantity: 2 }
          ],
          price: 50.00,
          timeAgo: 'Just now',
          timestamp: Date.now()
        };

        // Append order
        setOrders((prev) => [simulatedOrder, ...prev]);
        
        // Append log
        const logId = 'log-' + Math.floor(Math.random() * 1000);
        const newLog: ActivityLog = {
          id: logId,
          text: 'New order check: Table 08 just placed an order.',
          time: 'Just now',
          type: 'pending'
        };
        setLogs((prev) => [newLog, ...prev]);

        // Trigger alert visual chime feedback
        setAlertDetails({
          title: 'New Order Received!',
          desc: 'Table 08 coordinates have finalized a cart checkout.'
        });
        setAlertOpen(true);
        playAlertChime();

        // Autoclose alert after 6 seconds
        setTimeout(() => {
          setAlertOpen(false);
        }, 6000);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [ordersActive]);

  // Handler for Manual order placing by staff in dashboard
  const handleAddManualOrder = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    
    // Add log
    const logId = 'log-' + Math.floor(Math.random() * 1000);
    const newLog: ActivityLog = {
      id: logId,
      text: `Staff added manual order ${newOrder.id} for ${newOrder.table}`,
      time: 'Just now',
      type: 'info'
    };
    setLogs((prev) => [newLog, ...prev]);

    // Play chime sound
    setAlertDetails({
      title: 'Manual Order Placed',
      desc: `${newOrder.table} has been written successfully.`
    });
    setAlertOpen(true);
    playAlertChime();

    setTimeout(() => {
      setAlertOpen(false);
    }, 4000);
  };

  // Human view mapping resolver
  const renderCurrentView = () => {
    switch (activeTab) {
      case 'orders':
        return (
          <OrdersView 
            orders={orders} 
            setOrders={setOrders} 
            menuItems={menuItems}
            onAddManualOrder={handleAddManualOrder}
          />
        );
      case 'menu':
        return (
          <MenuView 
            menuItems={menuItems} 
            setMenuItems={setMenuItems} 
          />
        );
      case 'tables':
        return (
          <TablesView 
            tables={tables} 
            setTables={setTables} 
          />
        );
      case 'reports':
        return (
          <ReportsView 
            logs={logs} 
          />
        );
      case 'settings':
        return (
          <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 rounded-2xl p-6 shadow-xs max-w-2xl space-y-6">
            <div>
              <h3 className="font-sans text-lg font-bold text-neutral-800 dark:text-white">Bistro Branch Settings</h3>
              <p className="font-sans text-xs text-neutral-400">Configure global restaurant naming, branches, and alerts triggers.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                  Restaurant Branding Label
                </label>
                <input 
                  type="text" 
                  value={restaurantName}
                  onChange={(e) => {
                    setRestaurantName(e.target.value);
                    localStorage.setItem('resto_name', e.target.value);
                  }}
                  className="w-full bg-white dark:bg-neutral-850 border border-[#E5E7EB] dark:border-neutral-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4338ca]/20 outline-none transition-all text-sm dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                  Active Street Branch / Location
                </label>
                <input 
                  type="text" 
                  value={branchName}
                  onChange={(e) => {
                    setBranchName(e.target.value);
                    localStorage.setItem('resto_branch', e.target.value);
                  }}
                  className="w-full bg-white dark:bg-neutral-850 border border-[#E5E7EB] dark:border-neutral-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4338ca]/20 outline-none transition-all text-sm dark:text-white font-medium"
                />
              </div>

              {/* Status toggles */}
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block font-semibold text-neutral-800 dark:text-white text-sm">Synthetic Audio Oscillators</span>
                    <span className="text-[11px] text-neutral-400 block">Trigger real sound beeps on manual or table checkout placements.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2a14b4]" />
                  </label>
                </div>

                <div className="flex items-center justify-between pt-1 border-b border-transparent">
                  <div>
                    <span className="block font-semibold text-neutral-800 dark:text-white text-sm">Auto-Accept Queue Mode</span>
                    <span className="text-[11px] text-neutral-400 block">Directly auto-approve all incoming table requests to cooking mode.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2a14b4]" />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
              <button 
                onClick={() => {
                  alert('Branch configuration settings saved successfully!');
                  setActiveTab('orders');
                }}
                className="px-6 py-2.5 bg-[#2a14b4] hover:opacity-90 transition-all text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Settings Changes</span>
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#f8f9fa] dark:bg-[#191c1d] dark:text-white text-[#191c1d] min-h-screen flex font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        restaurantName={restaurantName}
        branchName={branchName}
      />

      {/* Main Content Area flow */}
      <main className="flex-grow md:ml-64 flex flex-col min-h-screen pb-16 md:pb-0">
        
        {/* Top Sticky Header */}
        <Header 
          title={
            activeTab === 'orders' 
              ? 'Live Orders' 
              : activeTab === 'menu' 
              ? 'Menu Management' 
              : activeTab === 'tables' 
              ? 'Table Management' 
              : activeTab === 'reports'
              ? 'Reports & Analytics'
              : 'Branch Settings'
          }
          ordersActive={ordersActive}
          setOrdersActive={setOrdersActive}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          notificationsCount={logs.length}
          onNotificationsClick={() => {
            alert(`Real-Time Operation Feed Logs:\n\n${logs.map((l, i) => `${i+1}. [${l.time}] ${l.text}`).join('\n')}`);
          }}
        />

        {/* View Canvas Stage container */}
        <section className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {renderCurrentView()}
        </section>

      </main>

      {/* Slide-Up Alert/Toast Overlay feedback for table additions/orders */}
      {alertOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 transform translate-y-0 transition-transform duration-300 pointer-events-none">
          <div className="bg-[#4338ca] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-slideUp">
            <BellRing className="w-6 h-6 text-white animate-bounce" />
            <div>
              <p className="font-sans font-bold text-sm tracking-tight">{alertDetails.title}</p>
              <p className="font-sans text-xs opacity-85 mt-0.5">{alertDetails.desc}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
