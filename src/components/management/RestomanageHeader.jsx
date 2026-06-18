import { Bell, Volume2, VolumeX } from 'lucide-react';

export default function RestomanageHeader({
  title,
  ordersActive,
  onToggleOrders,
  soundEnabled,
  onToggleSound,
  notificationsCount,
  onNotificationsClick,
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 w-full bg-white/80 dark:bg-[#191c1d]/80 frosted-header border-b border-[#E5E7EB] dark:border-neutral-800">
      <div className="flex items-center gap-4">
        <h2 className="font-sans text-xl md:text-2xl font-bold text-neutral-800 dark:text-white">
          {title}
        </h2>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#edeeef] dark:bg-neutral-850 rounded-full">
          <span className={`w-2.5 h-2.5 rounded-full ${ordersActive ? 'bg-[#10B981] animate-pulse' : 'bg-amber-500'}`} />
          <span className="font-sans text-[10px] font-semibold text-[#5b598c] dark:text-neutral-300 uppercase tracking-widest leading-none">
            {ordersActive ? 'Live System' : 'System Paused'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pr-4 border-r border-[#E5E7EB] dark:border-neutral-800">
          <span className="hidden sm:inline font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Accepting Orders
          </span>
          <button
            onClick={onToggleOrders}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-250 focus:outline-none focus:ring-2 focus:ring-[#4338ca]/20 ${
              ordersActive ? 'bg-[#10B981]' : 'bg-neutral-400'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-250 ${
                ordersActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNotificationsClick}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#edeeef] dark:hover:bg-neutral-800 transition-colors text-[#2a14b4] dark:text-[#c3c0ff] relative active:scale-95"
            title="View Real-Time Logs"
          >
            <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
            {notificationsCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full" />
            )}
          </button>

          <button
            onClick={onToggleSound}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#edeeef] dark:hover:bg-neutral-800 transition-colors text-[#2a14b4] dark:text-[#c3c0ff] active:scale-95"
            title={soundEnabled ? 'Turn alerts sound off' : 'Turn alerts sound on'}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
            ) : (
              <VolumeX className="w-5 h-5 text-neutral-400" />
            )}
          </button>

          <div className="w-8 h-8 rounded-full bg-[#e1e3e4] overflow-hidden border border-[#E5E7EB] dark:border-neutral-700 ml-1">
            <img
              className="w-full h-full object-cover"
              alt="Manager Avatar"
              referrerPolicy="no-referrer"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1THJT8GkKJFAIk2zJS_uePSgdKerdgp2d8oDV_jfpBq_Zb5P0vpkrkTJtaJnX5z6GTEiop2cP1ToosUnbWgK04ahnwGl9a5fv6dpt55i-OzgP8KLMm4QBgc_8flrlxlUt2pkJdhzfyYUOWued_CBtD_ga7i6tbmpgwYiG2AvJigZFYykkkIMJY5WF5FWQcGMPEdFNdNZ3O00vC1EsB33DG4NscbL5tHRD2yYPdaZpAc_5CXuZEEE92ITom_x69iGeh1uOcihZGss"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
