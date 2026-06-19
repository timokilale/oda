import { Save, Bell, ToggleLeft } from 'lucide-react';
import ToggleSwitch from '../ui/ToggleSwitch.jsx';

export default function SettingsView({ restaurantName, onRestaurantNameChange, branchName, onBranchNameChange, soundEnabled, onSoundEnabledChange, autoAccept, onAutoAcceptChange, onSave, saving }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 rounded-2xl p-6 shadow-xs max-w-2xl space-y-6">
      <div>
        <h3 className="font-sans text-lg font-bold text-neutral-800 dark:text-white">Settings</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
            Name
          </label>
          <input
            type="text"
            value={restaurantName}
            onChange={(e) => onRestaurantNameChange(e.target.value)}
            className="w-full bg-white dark:bg-neutral-850 border border-[#E5E7EB] dark:border-neutral-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4338ca]/20 outline-none transition-all text-sm dark:text-white font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
            Branch
          </label>
          <input
            type="text"
            value={branchName}
            onChange={(e) => onBranchNameChange(e.target.value)}
            className="w-full bg-white dark:bg-neutral-850 border border-[#E5E7EB] dark:border-neutral-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4338ca]/20 outline-none transition-all text-sm dark:text-white font-medium"
          />
        </div>

        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-4">
          <ToggleSwitch
            checked={soundEnabled}
            onChange={onSoundEnabledChange}
            label="Sound"
            description="Play notification sound on new orders"
          />
          <ToggleSwitch
            checked={autoAccept}
            onChange={onAutoAcceptChange}
            label="Auto-Accept"
            description="Automatically accept incoming orders"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#2a14b4] hover:opacity-90 transition-all text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
}
