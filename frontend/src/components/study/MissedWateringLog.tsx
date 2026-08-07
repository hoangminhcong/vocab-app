import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMissedWaterings } from '../../api/queries';
import { Ghost, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MissedWateringLog: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['missedWaterings'],
    queryFn: getMissedWaterings,
    refetchInterval: 300000, // Refresh every 5 mins
  });

  if (isLoading || !logs || logs.length === 0) {
    return null; // Don't show anything if there are no missed waterings
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-2 w-80 bg-white rounded-2xl shadow-xl border-2 border-gray-300 overflow-hidden"
          >
            <div className="bg-gray-800 px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Ghost size={18} />
                <span className="font-extrabold text-sm uppercase tracking-wide">Bảng Phong Thần</span>
              </div>
            </div>
            
            <div className="p-2 max-h-72 overflow-y-auto bg-gray-50">
              {logs.map((logGroup: any) => {
                const date = new Date(logGroup.date);
                const dateString = date.toLocaleDateString('vi-VN');
                
                return (
                  <div 
                    key={logGroup.date}
                    className="flex flex-col gap-1 p-3 mb-2 bg-white rounded-xl shadow-sm border border-gray-200"
                  >
                    <div className="font-bold text-gray-800 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-orange-500" />
                      Ngày {dateString}
                    </div>
                    <div className="text-sm font-bold text-red-500 mb-1">
                      Bỏ lỡ {logGroup.decks.length} cây
                    </div>
                    <ul className="text-xs text-gray-600 list-disc list-inside">
                      {logGroup.decks.map((d: any) => (
                        <li key={d.id} className="truncate">{d.deck_title}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-center gap-2 bg-gray-800 text-white px-4 py-3 rounded-full font-extrabold shadow-lg hover:brightness-110 transition-all border-b-4 border-gray-900 active:translate-y-1 active:border-b-0"
      >
        <Ghost size={20} />
        <span>Lịch sử bỏ bê ({logs.length} ngày)</span>
        {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </button>
    </div>
  );
};

export default MissedWateringLog;
