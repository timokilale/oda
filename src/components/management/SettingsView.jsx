import ToggleSwitch from '../ui/ToggleSwitch.jsx';

export default function SettingsView({ restaurantName, onRestaurantNameChange, branchName, onBranchNameChange, soundEnabled, onSoundEnabledChange, autoAccept, onAutoAcceptChange, onSave, saving }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 rounded-xl p-6 max-w-2xl space-y-6">
      <h3 className="font-sans text-base font-semibold text-neutral-800 dark:text-neutral-100">Settings</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-medium text-neutral-400 mb-1">Name</label>
          <input
            type="text"
            value={restaurantName}
            onChange={(e) => onRestaurantNameChange(e.target.value)}
            className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-400 outline-none transition-all text-sm dark:text-neutral-100"
          />
        </div>

        <div>
          <label className="block text-[10px] font-medium text-neutral-400 mb-1">Branch</label>
          <input
            type="text"
            value={branchName}
            onChange={(e) => onBranchNameChange(e.target.value)}
            className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-400 outline-none transition-all text-sm dark:text-neutral-100"
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
          className="px-4 py-2 bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-800 font-sans text-xs font-medium rounded-lg hover:opacity-80 transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
