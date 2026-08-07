import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getWitheredDecks } from '../../api/queries';
import { AlertCircle, ChevronDown, ChevronUp, Droplets, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WitheredPlantsWidget: React.FC = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  const { data: witheredDecks, isLoading } = useQuery({
    queryKey: ['witheredDecks'],
    queryFn: getWitheredDecks,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading || !witheredDecks || witheredDecks.length === 0 || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-2 w-72 bg-white rounded-2xl shadow-xl border-2 border-[#e5e5e5] overflow-hidden"
          >
            <div className="bg-[#ff4b4b] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <AlertCircle size={18} />
                <span className="font-extrabold text-sm uppercase tracking-wide">Cần tưới ngay!</span>
              </div>
              <button 
                onClick={() => setIsVisible(false)}
                className="text-white hover:opacity-70 transition-opacity"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-2 max-h-60 overflow-y-auto">
              {witheredDecks.map((deck: any) => {
                const date = new Date(deck.next_wither_at);
                const isToday = date.toDateString() === new Date().toDateString();
                const isPast = date < new Date() && !isToday;
                
                return (
                  <div 
                    key={deck.id}
                    onClick={() => navigate(`/dashboard/deck/${deck.id}`)}
                    className="flex flex-col gap-1 p-3 hover:bg-[#f7f7f7] rounded-xl cursor-pointer transition-colors border-b-2 border-transparent hover:border-[#e5e5e5]"
                  >
                    <div className="font-bold text-[#3c3028] truncate">{deck.title}</div>
                    <div className="text-xs font-bold flex items-center gap-1 text-[#ff4b4b]">
                      <Droplets size={12} />
                      {isPast ? 'Đã héo từ: ' : 'Héo lúc: '}
                      {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {date.toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-center gap-2 bg-[#ff4b4b] text-white px-4 py-3 rounded-full font-extrabold shadow-lg hover:brightness-110 transition-all border-b-4 border-[#cc3c3c] active:translate-y-1 active:border-b-0"
      >
        <Droplets size={20} />
        <span>{witheredDecks.length} cây đang héo</span>
        {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </button>
    </div>
  );
};

export default WitheredPlantsWidget;
