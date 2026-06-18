/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Flame, Tag, ChefHat, Check } from 'lucide-react';
import { MenuItem } from '../types';

interface DishDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onAddToOrder: (quantity: number, notes: string) => void;
}

export default function DishDetailModal({
  isOpen,
  onClose,
  item,
  onAddToOrder
}: DishDetailModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [successState, setSuccessState] = useState<boolean>(false);

  // Reset local inputs when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSpecialNotes('');
      setSuccessState(false);
    }
  }, [isOpen, item]);

  if (!item) return null;

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleIncreaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const handleAdd = () => {
    setSuccessState(true);
    setTimeout(() => {
      onAddToOrder(quantity, specialNotes);
      onClose();
    }, 850);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="dish-modal-overlay" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            id="dish-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-on-background/30 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            id="dish-modal-content"
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full sm:max-w-xl bg-surface sm:rounded-2xl shadow-xl border border-border overflow-hidden rounded-t-2xl z-10 max-h-[92dvh] sm:max-h-[85vh] flex flex-col"
          >
            {/* Soft background bleed glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 opacity-20 blur-[80px] pointer-events-none rounded-full"
              style={{ backgroundColor: item.colorLeak }}
            />

            {/* Header / Image Area */}
            <div className="relative h-48 sm:h-56 bg-surface-container-low flex items-center justify-center overflow-hidden">
              <button
                id="close-modal-btn"
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 bg-surface/80 backdrop-blur-md text-on-surface hover:bg-surface-container-high hover:scale-105 active:scale-95 rounded-full transition-transform"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-surface shadow-[0_12px_36px_rgba(0,0,0,0.06)] flex items-center justify-center p-1 relative z-10">
                <img
                  src={item.image}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full spin-slow"
                />
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 relative">
              <div className="space-y-1">
                <div className="flex flex-wrap gap-2">
                  {item.badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="bg-secondary-fixed text-on-secondary-fixed font-sans font-semibold text-[10px] tracking-wider px-2 py-0.5 rounded-full"
                    >
                      {badge}
                    </span>
                  ))}
                  <span className="bg-surface-container-high text-on-surface-variant border border-outline-variant font-sans font-semibold text-[10px] tracking-wider px-2 py-0.5 rounded-full">
                    {item.category.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-serif italic font-semibold text-2xl sm:text-3xl text-on-surface leading-tight">
                  {item.name}
                </h3>
                <p className="font-serif italic text-price-lg text-secondary font-medium">
                  ${item.price.toFixed(2)}
                </p>
              </div>

              <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
                {item.description}
              </p>

              {/* Technical Grid: prepping, calories, spiciness */}
              <div className="grid grid-cols-3 gap-3 bg-surface-container-low p-3 rounded-lg text-center border border-border">
                <div className="flex flex-col items-center">
                  <span className="flex items-center gap-1 text-on-surface-variant text-xs mb-1 font-sans">
                    <Clock className="w-3.5 h-3.5 text-secondary" /> Time
                  </span>
                  <span className="font-mono text-sm font-semibold text-on-surface">
                    {item.prepTime} min
                  </span>
                </div>
                <div className="flex flex-col items-center border-x border-border">
                  <span className="flex items-center gap-1 text-on-surface-variant text-xs mb-1 font-sans">
                    <Flame className="w-3.5 h-3.5 text-error" /> Energy
                  </span>
                  <span className="font-mono text-sm font-semibold text-on-surface">
                    {item.calories} cal
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="flex items-center gap-1 text-on-surface-variant text-xs mb-1 font-sans">
                    <Tag className="w-3.5 h-3.5 text-success" /> Dietary
                  </span>
                  <span className="font-sans text-[11px] font-semibold text-on-surface truncate capitalize">
                    {item.badges.includes('VEGAN') ? 'Vegan' : 'Standard'}
                  </span>
                </div>
              </div>

              {/* Ingredients list */}
              <div className="space-y-2">
                <h4 className="font-sans font-semibold text-xs text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-primary" /> Key Ingredients
                </h4>
                <div className="flex flex-wrap gap-2">
                  {item.ingredients.map((ingredient, idx) => (
                    <span
                      key={idx}
                      className="bg-surface-container text-on-surface-variant text-xs px-3 py-1 rounded-md border border-border font-sans font-medium"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>

              {/* Special chef instructions */}
              <div className="space-y-2">
                <label
                  htmlFor="special-notes-input"
                  className="block font-sans font-semibold text-xs text-on-surface-variant uppercase tracking-widest"
                >
                  Special Chef Instructions
                </label>
                <textarea
                  id="special-notes-input"
                  rows={2}
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="e.g. Allergy to garlic, extra sauce, dressing on the side..."
                  className="w-full text-sm rounded-lg border border-border p-3 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-on-surface-variant/40 bg-surface resize-none font-sans"
                />
              </div>
            </div>

            {/* Footer Order Button panel */}
            <div className="border-t border-border bg-surface-container-lowest p-4 flex items-center justify-between gap-4">
              <div className="flex items-center bg-surface-container-low rounded-lg p-1 border border-border">
                <button
                  id="modal-decrease-btn"
                  onClick={handleDecreaseQuantity}
                  className="w-10 h-10 flex items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface hover:scale-105 active:scale-95 transition-all"
                  aria-label="Decrease quantity"
                >
                  <span className="text-xl font-bold font-mono">-</span>
                </button>
                <span className="w-12 text-center font-mono text-price-lg text-on-surface font-semibold select-none">
                  {quantity}
                </span>
                <button
                  id="modal-increase-btn"
                  onClick={handleIncreaseQuantity}
                  className="w-10 h-10 flex items-center justify-center rounded-md text-primary hover:bg-primary-container hover:text-on-primary-container hover:scale-105 active:scale-95 transition-all"
                  aria-label="Increase quantity"
                >
                  <span className="text-xl font-bold font-mono">+</span>
                </button>
              </div>

              <button
                id="modal-add-to-order-btn"
                disabled={successState}
                onClick={handleAdd}
                className={`flex-1 h-12 rounded-lg font-sans font-semibold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all shadow-sm ${
                  successState
                    ? 'bg-success text-white'
                    : 'bg-primary text-on-primary hover:opacity-90'
                }`}
              >
                {successState ? (
                  <>
                    <Check className="w-5 h-5 animate-bounce" /> Added to Order!
                  </>
                ) : (
                  <>
                    Add to Order
                    <span className="mx-1 font-light opacity-60">|</span>
                    <span className="font-mono">${(item.price * quantity).toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
