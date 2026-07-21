import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FlowerDeckCardProps {
  deck: any;
  onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onStudy?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onTitleChange?: (newTitle: string) => void;
  index: number;
}

export const FlowerDeckCard: React.FC<FlowerDeckCardProps> = ({ deck, onClick, onEdit, onStudy, onDelete, onTitleChange, index }) => {
  const isSeed = deck.total_words === 0 || (deck.learned_words !== undefined && deck.learned_words < deck.total_words);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(deck.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingTitle]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (editTitle.trim() && editTitle !== deck.title && onTitleChange) {
      onTitleChange(editTitle.trim());
    } else {
      setEditTitle(deck.title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSubmit();
    if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setEditTitle(deck.title);
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-xl p-4 flex flex-col items-center relative shadow-sm transition-all hover:shadow-md"
      style={{ minHeight: '260px', border: '2px solid #f2f2f2' }}
    >
      {/* Light grey aura at the top with level number */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-28 bg-[#f5f5f5] rounded-t-xl z-0 opacity-70"></div>
      <div className="absolute top-4 font-black text-[#dce0e3] text-2xl z-10">
        {index + 1}
      </div>

      <div className="relative w-32 h-32 flex items-center justify-center mt-10 mb-2 z-10">
        {/* SVG Flower / Seed */}
        {!isSeed ? (
          <svg viewBox="0 0 100 120" width="100%" height="100%">
            {/* Stem */}
            <path d="M50 70 L50 45" stroke="#7cb42b" strokeWidth="5" strokeLinecap="round" />
            
            {/* Leaves */}
            <path d="M50 58 Q 38 48 35 58 Q 42 64 50 58" fill="#93d334" />
            <path d="M50 52 Q 62 42 65 52 Q 58 58 50 52" fill="#93d334" />
            
            {/* Flower Petals (Orange) */}
            <circle cx="50" cy="30" r="16" fill="#fbb303" />
            <circle cx="36" cy="22" r="10" fill="#fbb303" />
            <circle cx="64" cy="22" r="10" fill="#fbb303" />
            <circle cx="34" cy="38" r="10" fill="#fbb303" />
            <circle cx="66" cy="38" r="10" fill="#fbb303" />
            <circle cx="50" cy="14" r="10" fill="#fbb303" />
            <circle cx="50" cy="46" r="10" fill="#fbb303" />
            
            {/* Flower Center (White) */}
            <circle cx="50" cy="30" r="8" fill="#ffffff" />
            
            {/* Pot */}
            <path d="M32 80 L68 80 L62 105 L38 105 Z" fill="#7a5438" />
            <path d="M28 70 L72 70 L72 80 L28 80 Z" fill="#66462f" />
          </svg>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <svg viewBox="0 0 100 110" width="100%" height="100%">
              {/* Falling Seed */}
              <path d="M50 30 Q 56 38 50 45 Q 44 38 50 30" fill="#94578b" />
              {/* Little arrow pointing down */}
              <path d="M50 55 L50 62 M46 58 L50 62 L54 58" stroke="#dce0e3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Pot */}
              <path d="M32 80 L68 80 L62 105 L38 105 Z" fill="#7a5438" />
              <path d="M28 70 L72 70 L72 80 L28 80 Z" fill="#66462f" />
            </svg>
            <div className="w-20 h-2 bg-[#e5e5e5] rounded-full overflow-hidden mt-2">
               <div className="h-full bg-[#fbb303]" style={{ width: `${(deck.learned_words || 0) / (deck.total_words || 1) * 100}%` }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Checkmark or spacer */}
      <div className="h-10 flex items-center justify-center z-10 w-full mt-2">
        {!isSeed ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2c3e50" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          <div className="text-xs font-bold text-[#7a726d]">
            {deck.learned_words || 0} / {deck.total_words} đã thuộc
          </div>
        )}
      </div>
      
      {/* Title */}
      {isEditingTitle ? (
        <div className="z-20 mt-1 w-full px-2 h-10 flex items-center" onClick={(e) => e.stopPropagation()}>
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleTitleKeyDown}
            className="w-full text-center font-extrabold text-[#3c3028] text-sm bg-white border-2 border-[#1cb0f6] rounded-md outline-none px-1"
          />
        </div>
      ) : (
        <div className="font-extrabold text-[#3c3028] text-sm text-center mt-1 tracking-wide z-10 px-2 w-full flex items-start justify-center gap-1 h-10 overflow-hidden">
          <span className="line-clamp-2">{deck.title}</span>
          {onTitleChange && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              className="text-[#afafaf] hover:text-[#1cb0f6] p-1 rounded transition-colors flex-shrink-0 mt-[-2px]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
        {onDelete && (
          <button 
            onClick={onDelete}
            className="p-2 bg-white rounded-full shadow-md text-[#ea2b2b] hover:bg-red-50 transition-colors border border-red-100"
            title="Xóa bài"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        )}
      </div>
    </motion.div>
  );
};
