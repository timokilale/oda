/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { MenuItem } from '../types';

interface MenuSwiperProps {
  items: MenuItem[];
  onAddItem: (item: MenuItem, quantity: number) => void;
  onOpenDetails: (item: MenuItem) => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

export default function MenuSwiper({
  items,
  onAddItem,
  onOpenDetails,
  activeIndex,
  setActiveIndex
}: MenuSwiperProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [direction, setDirection] = useState<number>(0); // -1 for left, 1 for right

  const activeItem = items[activeIndex];

  const handlePrev = () => {
    setDirection(-1);
    setQuantity(1);
    setActiveIndex((activeIndex - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setDirection(1);
    setQuantity(1);
    setActiveIndex((activeIndex + 1) % items.length);
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleIncreaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const handleAddToOrder = () => {
    onAddItem(activeItem, quantity);
    setQuantity(1); // Reset
  };

  // Variants for sliding transition
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.25 }
      }
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.25 }
      }
    })
  };

  return (
    <div id="menu-swiper-container" className="flex-1 w-full h-full relative flex flex-col justify-between overflow-hidden">
      
      {/* Background Color Leak Glow - synced dynamically with current plate configuration */}
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

      {/* Swipe Nav Arrow Hooks */}
      <div className="absolute inset-x-0 top-1/3 -translate-y-1/2 flex justify-between px-2 z-20 pointer-events-none">
        <button
          id="btn-nav-prev"
          onClick={handlePrev}
          className="p-2.5 rounded-full bg-surface/85 backdrop-blur-md text-on-surface shadow-sm border border-border pointer-events-auto hover:bg-surface hover:scale-110 active:scale-95 transition-all outline-none"
          aria-label="Previous specialty"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          id="btn-nav-next"
          onClick={handleNext}
          className="p-2.5 rounded-full bg-surface/85 backdrop-blur-md text-on-surface shadow-sm border border-border pointer-events-auto hover:bg-surface hover:scale-110 active:scale-95 transition-all outline-none"
          aria-label="Next specialty"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Carousel Area */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10 select-none">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.article
            key={activeItem.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full flex flex-col items-center justify-center max-w-md pt-4"
          >
            {/* Visual spinning luxurious dinner plate */}
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
              {/* Subtle info tap indicator */}
              <div className="absolute inset-0 bg-black/10 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white backdrop-blur-[2px] transition-opacity duration-200">
                <span className="flex items-center gap-1.5 font-sans font-semibold text-xs tracking-wider uppercase bg-primary/95 px-3.5 py-1.5 rounded-full shadow-md">
                  <Info className="w-4 h-4" /> View Details
                </span>
              </div>
            </div>

            {/* Badges container */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              {activeItem.badges.map((badge, idx) => {
                const isPopular = badge === 'POPULAR';
                return (
                  <span
                    key={idx}
                    className={`font-sans font-semibold text-[10px] tracking-wider px-3 py-1 rounded-full ${
                      isPopular
                        ? 'bg-secondary-fixed text-on-secondary-fixed'
                        : 'bg-surface-container-high text-on-surface-variant border border-outline-variant'
                    }`}
                  >
                    {badge}
                  </span>
                );
              })}
              {activeItem.badges.length === 0 && (
                <span className="font-sans font-semibold text-[10px] tracking-wider px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant border border-outline-variant">
                  {activeItem.category.toUpperCase()}
                </span>
              )}
            </div>

            {/* Information Texts */}
            <div className="text-center w-full space-y-2">
              <h2 className="font-serif italic font-semibold text-2xl sm:text-3xl text-on-surface tracking-tight truncate max-w-[20rem] sm:max-w-[24rem]">
                {activeItem.name}
              </h2>
              <p className="font-serif italic text-[#8b4513] text-lg font-medium tracking-wide">
                ${activeItem.price.toFixed(2)}
              </p>
              <p className="font-sans text-xs sm:text-body-sm text-on-surface-variant/80 leading-relaxed line-clamp-3 max-h-[4rem] px-4">
                {activeItem.description}
              </p>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      {/* Footer Interface - Floating drawer holding buttons and absolute indicators */}
      <div className="w-full bg-gradient-to-t from-background via-background/90 to-transparent pt-6 pb-2 px-6 flex flex-col items-center space-y-3 relative z-20">
        
        {/* Quantity and Order buttons inline panel */}
        <div className="w-full max-w-sm bg-surface shadow-[0_6px_24px_rgba(30,27,75,0.04)] rounded-xl border border-border p-2 flex items-center justify-between">
          <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 border border-border">
            <button
              id="swiper-decrease-btn"
              onClick={handleDecreaseQuantity}
              className="w-9 h-9 flex items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface hover:scale-105 active:scale-95 transition-all"
              aria-label="Decrease quantity"
            >
              <span className="text-lg font-bold font-mono">-</span>
            </button>
            <span className="w-10 text-center font-mono text-price-sm text-on-surface font-semibold select-none">
              {quantity}
            </span>
            <button
              id="swiper-increase-btn"
              onClick={handleIncreaseQuantity}
              className="w-9 h-9 flex items-center justify-center rounded-md text-primary hover:bg-primary-container hover:text-on-primary-container hover:scale-105 active:scale-95 transition-all"
              aria-label="Increase quantity"
            >
              <span className="text-lg font-bold font-mono">+</span>
            </button>
          </div>

          <button
            id="swiper-add-to-order-btn"
            onClick={handleAddToOrder}
            className="flex-1 ml-3 bg-primary text-on-primary h-11 rounded-lg font-sans font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-container active:scale-98 transition-all shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" /> Add to Order
          </button>
        </div>

        {/* Dynamic slide indicator code matches '1 / 24' exactly */}
        <div className="font-mono text-[11px] font-medium text-outline-variant tracking-widest uppercase select-none pb-1">
          {activeIndex + 1} / {items.length}
        </div>
      </div>

    </div>
  );
}
