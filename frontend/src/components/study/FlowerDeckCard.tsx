import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FlowerDeckCardProps {
  deck: any;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  onTitleChange?: (newTitle: string) => void;
  index: number;
}

export const FlowerDeckCard: React.FC<FlowerDeckCardProps> = ({ deck, onClick, onDelete, onTitleChange, index }) => {
  const srsPercent = deck.total_words > 0 ? (deck.learned_words || 0) / deck.total_words : 0;
  const survivalWins = deck.survival_wins || 0;
  const nextWitherAt = deck.next_wither_at ? new Date(deck.next_wither_at) : null;
  const now = new Date();
  const isWithered = nextWitherAt && nextWitherAt < now;

  // Determine stage (0 to 7)
  let stage = 0;
  if (srsPercent < 1) {
    if (srsPercent < 0.3) stage = 0; // Seed
    else if (srsPercent < 0.5) stage = 1; // Sprout
    else if (srsPercent < 0.7) stage = 2; // Small plant
    else stage = 3; // Big plant
  } else {
    if (survivalWins === 0) stage = 4; // Budding
    else if (survivalWins === 1) stage = 5; // Half-bloom
    else {
      if (isWithered) stage = 7; // Withered
      else stage = 6; // Fully bloomed
    }
  }

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

  const renderSVG = () => {
    switch (stage) {
      case 0: // Seed
        return (
          <svg viewBox="0 0 100 110" width="100%" height="100%">
            <path d="M50 30 Q 56 38 50 45 Q 44 38 50 30" fill="#94578b" />
            <path d="M50 55 L50 62 M46 58 L50 62 L54 58" stroke="#dce0e3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M32 80 L68 80 L62 105 L38 105 Z" fill="#7a5438" />
            <path d="M28 70 L72 70 L72 80 L28 80 Z" fill="#66462f" />
          </svg>
        );
      case 1: // Sprout
        return (
          <svg viewBox="0 0 100 120" width="100%" height="100%">
            <path d="M50 70 L50 60" stroke="#7cb42b" strokeWidth="4" strokeLinecap="round" />
            <path d="M50 62 Q 45 55 42 60 Q 45 64 50 62" fill="#93d334" />
            <path d="M50 60 Q 55 53 58 58 Q 55 62 50 60" fill="#93d334" />
            <path d="M32 80 L68 80 L62 105 L38 105 Z" fill="#7a5438" />
            <path d="M28 70 L72 70 L72 80 L28 80 Z" fill="#66462f" />
          </svg>
        );
      case 2: // Small plant
        return (
          <svg viewBox="0 0 100 120" width="100%" height="100%">
            <path d="M50 70 L50 45" stroke="#7cb42b" strokeWidth="5" strokeLinecap="round" />
            <path d="M50 58 Q 38 48 35 58 Q 42 64 50 58" fill="#93d334" />
            <path d="M50 52 Q 62 42 65 52 Q 58 58 50 52" fill="#93d334" />
            <path d="M50 45 Q 40 38 42 45 Q 46 48 50 45" fill="#93d334" />
            <path d="M32 80 L68 80 L62 105 L38 105 Z" fill="#7a5438" />
            <path d="M28 70 L72 70 L72 80 L28 80 Z" fill="#66462f" />
          </svg>
        );
      case 3: // Big plant
        return (
          <svg viewBox="0 0 100 120" width="100%" height="100%">
            <path d="M50 70 L50 35" stroke="#7cb42b" strokeWidth="5" strokeLinecap="round" />
            <path d="M50 58 Q 35 48 32 58 Q 42 64 50 58" fill="#93d334" />
            <path d="M50 52 Q 65 42 68 52 Q 58 58 50 52" fill="#93d334" />
            <path d="M50 42 Q 38 32 35 42 Q 42 48 50 42" fill="#93d334" />
            <path d="M50 36 Q 62 26 65 36 Q 58 42 50 36" fill="#93d334" />
            <path d="M32 80 L68 80 L62 105 L38 105 Z" fill="#7a5438" />
            <path d="M28 70 L72 70 L72 80 L28 80 Z" fill="#66462f" />
          </svg>
        );
      case 4: // Budding
        return (
          <svg viewBox="0 0 100 120" width="100%" height="100%">
            <path d="M50 70 L50 35" stroke="#7cb42b" strokeWidth="5" strokeLinecap="round" />
            <path d="M50 58 Q 35 48 32 58 Q 42 64 50 58" fill="#93d334" />
            <path d="M50 52 Q 65 42 68 52 Q 58 58 50 52" fill="#93d334" />
            <path d="M50 42 Q 38 32 35 42 Q 42 48 50 42" fill="#93d334" />
            <path d="M50 36 Q 62 26 65 36 Q 58 42 50 36" fill="#93d334" />
            
            {/* Bud */}
            <path d="M50 35 Q 45 20 50 15 Q 55 20 50 35" fill="#fbb303" />
            <path d="M50 35 Q 45 25 50 25 Q 55 25 50 35" fill="#93d334" />
            
            <path d="M32 80 L68 80 L62 105 L38 105 Z" fill="#7a5438" />
            <path d="M28 70 L72 70 L72 80 L28 80 Z" fill="#66462f" />
          </svg>
        );
      case 5: // Half-bloom
        return (
          <svg viewBox="0 0 100 120" width="100%" height="100%">
            <path d="M50 70 L50 35" stroke="#7cb42b" strokeWidth="5" strokeLinecap="round" />
            <path d="M50 58 Q 35 48 32 58 Q 42 64 50 58" fill="#93d334" />
            <path d="M50 52 Q 65 42 68 52 Q 58 58 50 52" fill="#93d334" />
            <path d="M50 42 Q 38 32 35 42 Q 42 48 50 42" fill="#93d334" />
            
            {/* Half-bloom petals */}
            <circle cx="50" cy="30" r="16" fill="#fbb303" />
            <circle cx="36" cy="22" r="10" fill="#fbb303" />
            <circle cx="64" cy="22" r="10" fill="#fbb303" />
            <circle cx="50" cy="14" r="10" fill="#fbb303" />
            <circle cx="50" cy="30" r="8" fill="#ffffff" />
            
            <path d="M32 80 L68 80 L62 105 L38 105 Z" fill="#7a5438" />
            <path d="M28 70 L72 70 L72 80 L28 80 Z" fill="#66462f" />
          </svg>
        );
      case 6: // Fully bloomed
        return (
          <svg viewBox="0 0 100 120" width="100%" height="100%">
            <path d="M50 70 L50 45" stroke="#7cb42b" strokeWidth="5" strokeLinecap="round" />
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
            <circle cx="50" cy="30" r="8" fill="#ffffff" />
            
            <path d="M32 80 L68 80 L62 105 L38 105 Z" fill="#7a5438" />
            <path d="M28 70 L72 70 L72 80 L28 80 Z" fill="#66462f" />
          </svg>
        );
      case 7: // Withered
        return (
          <svg viewBox="0 0 100 120" width="100%" height="100%">
            {/* Droopy Stem */}
            <path d="M50 70 Q 50 50 70 45" stroke="#8a8a5c" strokeWidth="5" strokeLinecap="round" fill="none" />
            {/* Droopy Leaves */}
            <path d="M50 60 Q 60 65 55 75 Q 45 65 50 60" fill="#8a8a5c" />
            
            {/* Withered Flower */}
            <g transform="translate(20, 15)">
              <circle cx="50" cy="30" r="16" fill="#d9b650" />
              <circle cx="36" cy="22" r="10" fill="#d9b650" />
              <circle cx="64" cy="22" r="10" fill="#d9b650" />
              <circle cx="34" cy="38" r="10" fill="#d9b650" />
              <circle cx="66" cy="38" r="10" fill="#d9b650" />
              <circle cx="50" cy="14" r="10" fill="#d9b650" />
              <circle cx="50" cy="46" r="10" fill="#d9b650" />
              <circle cx="50" cy="30" r="8" fill="#e6e3dc" />
            </g>
            
            <path d="M32 80 L68 80 L62 105 L38 105 Z" fill="#7a5438" />
            <path d="M28 70 L72 70 L72 80 L28 80 Z" fill="#66462f" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (stage < 4) {
      return (
        <div className="flex flex-col items-center">
          <div className="w-20 h-2 bg-[#e5e5e5] rounded-full overflow-hidden mb-1">
             <div className="h-full bg-[#93d334]" style={{ width: `${srsPercent * 100}%` }}></div>
          </div>
          <div className="text-xs font-bold text-[#7a726d] text-center px-1">
            {deck.learned_words || 0} / {deck.total_words} từ
          </div>
        </div>
      );
    } else if (stage === 4 || stage === 5) {
      return (
        <div className="flex flex-col items-center">
          <div className="w-20 h-2 bg-[#e5e5e5] rounded-full overflow-hidden mb-1">
             <div className="h-full bg-[#fbb303]" style={{ width: `${(survivalWins / 2) * 100}%` }}></div>
          </div>
          <div className="text-xs font-bold text-[#fbb303] text-center px-1">
            {survivalWins} / 2 Siêu tốc
          </div>
        </div>
      );
    } else if (stage === 7) {
      return (
        <div className="text-xs font-bold text-[#ea2b2b] text-center px-1">
          Hoa héo! Ôn ngay!
        </div>
      );
    } else {
      let timeRemaining = "";
      let isWitherToday = false;
      if (nextWitherAt) {
        const timeStr = nextWitherAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const dateStr = nextWitherAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        timeRemaining = `${timeStr} ${dateStr}`;
        
        isWitherToday = 
          nextWitherAt.getDate() === now.getDate() &&
          nextWitherAt.getMonth() === now.getMonth() &&
          nextWitherAt.getFullYear() === now.getFullYear();
      }

      return (
        <div className="flex flex-col items-center">
          <div className="text-xs font-bold text-[#7cb42b] text-center px-1 flex items-center justify-center gap-1 mb-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Đã nở
          </div>
          {timeRemaining && <div className="text-[10px] text-[#7a726d] font-semibold">{timeRemaining}</div>}
          {isWitherToday && <div className="text-[10px] text-[#e89c1e] font-bold">(Phải tưới hôm nay)</div>}
        </div>
      );
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
        {renderSVG()}
      </div>

      {/* Checkmark or spacer */}
      <div className="h-10 flex items-center justify-center z-10 w-full mt-2">
        {getStatusText()}
      </div>
      
      {/* Title */}
      {isEditingTitle ? (
        <div className="z-20 mt-1 w-full px-2 h-10 flex items-center" onClick={(e) => e.stopPropagation()}>
          <input
            ref={inputRef}
            type="text"
            value={editTitle || ''}
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
