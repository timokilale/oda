import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Info } from 'lucide-react';
import { formatCurrency } from '../../lib/format';

export default function MenuSwiper({
  items,
  onAddItem,
  onOpenDetails,
  activeIndex,
  onActiveIndexChange,
}) {
  const [quantity, setQuantity] = useState(1);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef(0);
  const mouseDownX = useRef(0);

  const activeItem = items[activeIndex];

  if (!activeItem) return null;

  const handlePrev = () => {
    setDirection(-1);
    setQuantity(1);
    onActiveIndexChange((activeIndex - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setDirection(1);
    setQuantity(1);
    onActiveIndexChange((activeIndex + 1) % items.length);
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.25 },
      },
    },
    exit: (dir) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.25 },
      },
    }),
  };

  return (
    <div className="flex-1 w-full h-full relative flex flex-col justify-between overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`leak-${activeItem.id}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.35, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.8 }}
          className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 opacity-35 blur-[80px] rounded-full z-[0] pointer-events-none"
          style={{ backgroundColor: activeItem.colorLeak }}
        />
      </AnimatePresence>

      <div
        className="flex-1 flex items-center justify-center px-6 relative z-10 select-none"
        onMouseDown={(e) => { mouseDownX.current = e.clientX; }}
        onMouseUp={(e) => {
          const diff = mouseDownX.current - e.clientX;
          if (Math.abs(diff) > 50) {
            if (diff > 0) handleNext();
            else handlePrev();
          }
        }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          if (diff > 50) handleNext();
          else if (diff < -50) handlePrev();
        }}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={activeItem.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full flex flex-col items-center justify-center max-w-md pt-4"
          >
            <div
              onClick={() => onOpenDetails(activeItem)}
              className="group cursor-pointer w-60 h-60 min-h-60 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-full shadow-[0_24px_60px_rgba(30,27,75,0.08)] bg-surface flex items-center justify-center p-2.5 mb-6 relative hover:shadow-[0_30px_70px_rgba(30,27,75,0.12)] transition-shadow duration-300"
            >
              <img
                src={activeItem.image}
                alt={activeItem.name}
                referrerPolicy="no-referrer"
                loading="eager"
                className="w-full h-full object-cover rounded-full spin-slow group-hover:scale-[1.02] transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/10 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white backdrop-blur-[2px] transition-opacity duration-200">
                <span className="flex items-center gap-1.5 font-sans font-semibold text-xs tracking-wider uppercase bg-primary/95 px-3.5 py-1.5 rounded-full shadow-md">
                  <Info className="w-4 h-4" /> View Details
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              <span className="font-sans font-semibold text-[10px] tracking-wider px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant border border-outline-variant">
                {activeItem.category}
              </span>
            </div>

            <div className="text-center w-full space-y-2">
              <h2 className="font-serif italic font-semibold text-2xl sm:text-3xl text-on-surface tracking-tight truncate max-w-[20rem] sm:max-w-[24rem]">
                {activeItem.name}
              </h2>
              <p className="font-mono text-price-lg text-secondary font-semibold tracking-tight">
                {formatCurrency(activeItem.price)}
              </p>
              <p className="font-sans text-xs sm:text-body-sm text-on-surface-variant/80 leading-relaxed line-clamp-3 max-h-[4rem] px-4">
                {activeItem.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full bg-gradient-to-t from-background via-background/90 to-transparent pt-6 pb-2 px-6 flex flex-col items-center space-y-3 relative z-20">
        <div className="w-full max-w-sm bg-surface shadow-[0_6px_24px_rgba(30,27,75,0.04)] rounded-xl border border-border p-2 flex items-center justify-between">
          <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 border border-border">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 flex items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface hover:scale-105 active:scale-95 transition-all"
              aria-label="Decrease quantity"
            >
              <span className="text-lg font-bold font-mono">-</span>
            </button>
            <span className="w-10 text-center font-mono text-price-sm text-on-surface font-semibold select-none">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-9 h-9 flex items-center justify-center rounded-md text-primary hover:bg-primary-container hover:text-on-primary-container hover:scale-105 active:scale-95 transition-all"
              aria-label="Increase quantity"
            >
              <span className="text-lg font-bold font-mono">+</span>
            </button>
          </div>

          <button
            onClick={() => {
              onAddItem(activeItem, quantity);
              setQuantity(1);
            }}
            className="flex-1 ml-3 bg-primary text-on-primary h-11 rounded-lg font-sans font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-container active:scale-98 transition-all shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" /> Add to Order
          </button>
        </div>

        <div className="font-mono text-[11px] font-medium text-outline-variant tracking-widest uppercase select-none pb-1">
          {activeIndex + 1} / {items.length}
        </div>
      </div>
    </div>
  );
}
