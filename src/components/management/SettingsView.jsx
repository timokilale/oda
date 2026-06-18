import { Save, Bell, ToggleLeft } from 'lucide-react';

export default function SettingsView({ restaurantName, onRestaurantNameChange, branchName, onBranchNameChange, soundEnabled, onSoundEnabledChange, autoAccept, onAutoAcceptChange, onSave, saving }) {
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
            onChange={(e) => onRestaurantNameChange(e.target.value)}
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
            onChange={(e) => onBranchNameChange(e.target.value)}
            className="w-full bg-white dark:bg-neutral-850 border border-[#E5E7EB] dark:border-neutral-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4338ca]/20 outline-none transition-all text-sm dark:text-white font-medium"
          />
        </div>

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
                onChange={(e) => onSoundEnabledChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2a14b4]" />
            </label>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="block font-semibold text-neutral-800 dark:text-white text-sm">Auto-Accept Queue Mode</span>
              <span className="text-[11px] text-neutral-400 block">Directly auto-approve all incoming table requests to cooking mode.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoAccept}
                onChange={(e) => onAutoAcceptChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2a14b4]" />
            </label>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#2a14b4] hover:opacity-90 transition-all text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings Changes'}</span>
        </button>
      </div>
    </div>
  );
}
