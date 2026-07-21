import React, { useState, useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitReview } from '@/api/queries';

import { API_BASE_URL } from '../../api/axios';

interface SrsModeProps {
  allWords: any[];
  onExit: () => void;
}

const SrsMode: React.FC<SrsModeProps> = ({ allWords, onExit }) => {
  const [activeQueue, setActiveQueue] = useState<any[]>([]);
  const [unseenWords, setUnseenWords] = useState<any[]>([]);
  const [currentWord, setCurrentWord] = useState<any | null>(null);

  const [isAnswered, setIsAnswered] = useState(false);
  const [mcqOptions, setMcqOptions] = useState<any[]>([]);
  const [typingInput, setTypingInput] = useState('');
  const [feedback, setFeedback] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const [totalLearned, setTotalLearned] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioIntervalRef = useRef<number | null>(null);
  const typingInputRef = useRef<HTMLInputElement>(null);
  const isProcessingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  // Initialize
  useEffect(() => {
    const unseen = allWords.filter(w => w.study_progress?.level < 4);
    const initialLearned = allWords.filter(w => w.study_progress?.level >= 4).length;
    setTotalLearned(initialLearned);

    // Fill initial queue
    const initialQueue = unseen.slice(0, 5);
    setActiveQueue(initialQueue);
    setUnseenWords(unseen.slice(5));
  }, [allWords]);

  useEffect(() => {
    if (activeQueue.length > 0 && !currentWord) {
      loadNextWord(activeQueue);
    }
  }, [activeQueue, currentWord]);

  const fillQueue = (currentQueue: any[], currentUnseen: any[], minLength = 5) => {
    const newQueue = [...currentQueue];
    let newUnseen = [...currentUnseen];

    while (newQueue.length < minLength && newUnseen.length > 0) {
      newQueue.push(newUnseen[0]);
      newUnseen = newUnseen.slice(1);
    }
    return { q: newQueue, u: newUnseen };
  };

  const loadNextWord = (queueToLoad: any[]) => {
    if (queueToLoad.length === 0) {
      setCurrentWord(null);
      return;
    }

    const word = queueToLoad[0];
    setCurrentWord(word);
    setIsAnswered(false);
    setTypingInput('');
    setFeedback(null);
    setStartTime(Date.now());

    stopAudioLoop();

    const level = word.study_progress?.level || 0;

    if (level === 0) {
      playAudio(word.id.toString());
    } else if (level === 1 || level === 2) {
      generateMcqOptions(word);
      if (level === 1) startAudioLoop(word.id.toString());
    } else if (level === 3) {
      setTimeout(() => typingInputRef.current?.focus(), 100);
    }

    isProcessingRef.current = false;
  };

  const generateMcqOptions = (word: any) => {
    const pool = allWords.filter(w => w.id !== word.id);
    const shuffledPool = pool.sort(() => Math.random() - 0.5);
    const options = [word, ...shuffledPool.slice(0, 3)].sort(() => Math.random() - 0.5);
    setMcqOptions(options);
  };

  const playAudio = (id?: string) => {
    if (id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(`${API_BASE_URL}/api/vocabularies/${id}/audio`);
      audioRef.current = audio;
      audio.play().catch(() => { });
    }
  };

  const startAudioLoop = (id?: string) => {
    playAudio(id);
    audioIntervalRef.current = setInterval(() => playAudio(id), 4000);
  };

  const stopAudioLoop = () => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
  };

  const handleCorrect = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    stopAudioLoop();
    setIsAnswered(true);
    setFeedback({ msg: "✅ Chính xác!", type: 'success' });

    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    // Update local state queue
    const word = activeQueue[0];
    let newQueue = activeQueue.slice(1);

    try {
      const res = await submitReview(word.id, true, timeSpent);
      const updatedWord = {
        ...word,
        study_progress: { ...(word.study_progress || {}), level: res.level }
      };

      let currentUnseen = unseenWords;
      if (res.level >= 4) {
        setTotalLearned(prev => prev + 1);
        // Graduated, don't reinsert
      } else {
        // Reinsert randomly between index 4 and 6
        const insertIdx = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6
        const { q, u } = fillQueue(newQueue, currentUnseen, 6); // fill up to 6 to allow insertion
        newQueue = q;
        currentUnseen = u;
        const actualIdx = Math.min(newQueue.length, insertIdx);
        newQueue.splice(actualIdx, 0, updatedWord);
      }

      const { q, u } = fillQueue(newQueue, currentUnseen, 5);
      setActiveQueue(q);
      setUnseenWords(u);
      setTimeout(() => loadNextWord(q), 1000);
    } catch (e) {
      console.error(e);
      const { q, u } = fillQueue(newQueue, unseenWords, 5);
      setActiveQueue(q);
      setUnseenWords(u);
      setTimeout(() => loadNextWord(q), 1000);
    }
  };

  const handleWrong = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    stopAudioLoop();
    setIsAnswered(true);
    setFeedback({ msg: "❌ Sai rồi!", type: 'error' });

    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    const word = activeQueue[0];
    let newQueue = activeQueue.slice(1);

    try {
      const res = await submitReview(word.id, false, timeSpent);
      const updatedWord = {
        ...word,
        study_progress: { ...(word.study_progress || {}), level: res.level }
      };

      let currentUnseen = unseenWords;
      // Reinsert randomly between 2 and 4
      const insertIdx = Math.floor(Math.random() * 3) + 2;
      const { q, u } = fillQueue(newQueue, currentUnseen, insertIdx);
      newQueue = q;
      currentUnseen = u;
      const actualIdx = Math.min(newQueue.length, insertIdx);
      newQueue.splice(actualIdx, 0, updatedWord);

      const { q: q2, u: u2 } = fillQueue(newQueue, currentUnseen, 5);
      setActiveQueue(q2);
      setUnseenWords(u2);
      setTimeout(() => loadNextWord(q2), 2000);
    } catch (e) {
      console.error(e);
      const { q: q2, u: u2 } = fillQueue(newQueue, unseenWords, 5);
      setActiveQueue(q2);
      setUnseenWords(u2);
      setTimeout(() => loadNextWord(q2), 2000);
    }
  };

  const checkMcq = (opt: any) => {
    if (isAnswered) return;

    if (opt.id === currentWord.id) {
      handleCorrect();
    } else {
      handleWrong();
    }

    if (currentWord.study_progress?.level === 2) {
      playAudio(currentWord.id.toString());
    }
  };

  const checkTyping = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered || !typingInput.trim()) return;

    if (typingInput.trim().toLowerCase() === currentWord.english_word.trim().toLowerCase()) {
      handleCorrect();
    } else {
      handleWrong();
    }
    playAudio(currentWord.id.toString());
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (!currentWord) return;
    if (e.key === 'Enter' && currentWord.study_progress?.level === 0 && !isAnswered) {
      e.preventDefault();
      handleCorrect();
    }
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      playAudio(currentWord.id.toString());
    }

    // MCQ Hotkeys
    const level = currentWord.study_progress?.level || 0;
    if ((level === 1 || level === 2) && !isAnswered) {
      if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key) - 1;
        if (idx < mcqOptions.length) {
          e.preventDefault();
          checkMcq(mcqOptions[idx]);
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentWord, isAnswered]);

  if (!currentWord) {
    if (activeQueue.length === 0 && unseenWords.length === 0) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#fdfaf3' }}>
          <h1 className="text-5xl font-extrabold text-[#3c3028] mb-4">🎉 Tuyệt vời! 🎉</h1>
          <p className="text-xl mb-8 text-[#7a726d] font-bold">Bạn đã học thuộc tất cả các từ trong danh sách.</p>
          <button
            onClick={onExit}
            className="w-full max-w-sm h-16 rounded-2xl font-bold text-xl uppercase tracking-wider text-white shadow-sm hover:brightness-105 active:translate-y-1 transition-all"
            style={{ backgroundColor: '#1cb0f6', borderBottom: '4px solid #1899d6' }}
          >
            Trở Về
          </button>
        </div>
      );
    }
    return <div className="min-h-screen flex items-center justify-center font-bold text-xl text-[#7a726d]" style={{ backgroundColor: '#fdfaf3' }}>Đang tải...</div>;
  }

  const level = currentWord.study_progress?.level || 0;
  const progressPercent = allWords.length > 0 ? (totalLearned / allWords.length) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: '#fdfaf3' }}>
      {/* Header Banner */}
      <div className="w-full flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#52e3b5' }}>
        <div className="font-extrabold text-[#1e5e49] text-lg sm:text-xl tracking-wide truncate pr-4">
          [LEARNING] - Vocabulary
        </div>
        <button onClick={onExit} className="text-[#1e5e49] hover:opacity-70 transition-opacity">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      {/* Progress Bar Area */}
      <div className="w-full max-w-2xl mx-auto px-4 py-6 flex items-center gap-3 sm:gap-4">
        <div className="flex-1 h-7 rounded-full overflow-hidden" style={{ backgroundColor: '#e5e5e5' }}>
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%`, backgroundColor: '#fbb303' }}></div>
        </div>
        <div className="bg-white px-4 py-1.5 rounded-full font-bold text-[#3c3028] shadow-sm text-sm">
          {totalLearned}
        </div>
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#78b39d' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-7l-2-2"></path><path d="M12 15l2-2"></path><path d="M12 15c-2-2-4-3-4-5 0-2 2-3 4-3s4 1 4 3c0 2-2 3-4 5z"></path></svg>
        </div>
        <div className="hidden sm:flex gap-2 text-[#cbd1d6]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center p-4 max-w-2xl mx-auto w-full pb-32">

        {/* Word Display (Level 0, 1, 2) */}
        {level !== 3 && (
          <div className="text-center mb-8 w-full flex flex-col items-center">
            <h2 className="text-[2.5rem] sm:text-[3.5rem] font-extrabold text-[#3c3028] leading-tight mb-4 tracking-tight">
              {level === 1 || level === 0 ? currentWord.english_word : currentWord.vi_meaning}
            </h2>
            {level === 1 && currentWord.part_of_speech && (
              <span className="text-[#3c3028] text-2xl mb-4 opacity-80 font-bold">({currentWord.part_of_speech})</span>
            )}
            {level === 0 && (
              <>
                {currentWord.ipa && <p className="text-[#5e544d] font-mono text-xl font-bold mt-1 mb-4">{currentWord.ipa}</p>}
                <p className="text-2xl font-bold text-[#3c3028] mt-2 mb-4">{currentWord.vi_meaning}</p>
              </>
            )}

            {/* Synonyms Pill */}
            {currentWord.synonyms && (
              <div className="inline-block px-5 py-2.5 rounded-full mt-2" style={{ backgroundColor: '#52e3b5' }}>
                <span className="text-[#1e5e49] font-black uppercase text-sm sm:text-base tracking-wide">
                  {currentWord.synonyms}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Level 0 Continue Button */}
        {level === 0 && (
          <div className="w-full mt-8 flex justify-center">
            <button
              onClick={() => !isAnswered && handleCorrect()}
              className="w-full max-w-sm h-16 rounded-2xl font-bold text-xl uppercase tracking-wider text-white shadow-sm transition-all hover:brightness-105 active:translate-y-1"
              style={{ backgroundColor: '#1cb0f6', borderBottom: '4px solid #1899d6' }}
            >
              Tiếp tục
            </button>
          </div>
        )}

        {/* Level 1 & 2 MCQ Options */}
        {(level === 1 || level === 2) && (
          <div className="w-full flex flex-col gap-3.5">
            {mcqOptions.map((opt, i) => {
              let isSelected = false;
              let isWrong = false;
              if (isAnswered) {
                if (opt.id === currentWord.id) isSelected = true;
                else isWrong = true;
              }

              let bg = "#ffffff";
              let border = "#dce0e3";
              let borderB = "#c4cdd4";
              let text = "#3c3028";

              if (isSelected) {
                bg = "#d7ffb8";
                border = "#93d334";
                borderB = "#7cb42b";
                text = "#58a700";
              }

              return (
                <button
                  key={i}
                  onClick={() => checkMcq(opt)}
                  disabled={isAnswered}
                  className={`w-full relative flex flex-col items-center justify-center min-h-[4.5rem] rounded-2xl px-6 transition-all ${isAnswered && isWrong ? 'opacity-40' : 'hover:bg-gray-50 active:translate-y-1'}`}
                  style={{
                    backgroundColor: bg,
                    border: `2px solid ${border}`,
                    borderBottomWidth: isAnswered && isSelected ? '2px' : '4px',
                    borderBottomColor: borderB,
                    color: text
                  }}
                >
                  <span className="font-bold text-[1.15rem]">
                    {level === 1 ? opt.vi_meaning : opt.english_word} {level === 1 && opt.part_of_speech ? `(${opt.part_of_speech})` : ''}
                  </span>
                  {level === 2 && opt.ipa && (
                    <span className="text-[0.95rem] font-mono text-[#7a726d] font-bold mt-1 tracking-wide">{opt.ipa}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Level 3 Typing */}
        {level === 3 && (
          <div className="w-full mt-2">
            <div className="text-center mb-8">
              <h2 className="text-[2.5rem] sm:text-[3.5rem] font-extrabold text-[#3c3028] leading-tight mb-4">
                {currentWord.vi_meaning}
              </h2>
              {currentWord.synonyms && (
                <div className="inline-block px-5 py-2.5 rounded-full" style={{ backgroundColor: '#52e3b5' }}>
                  <span className="text-[#1e5e49] font-black uppercase text-sm sm:text-base tracking-wide">
                    {currentWord.synonyms}
                  </span>
                </div>
              )}
            </div>

            <div className="w-full">
              <div className="text-[#3c3028] font-black text-sm mb-3 uppercase tracking-wider">English</div>
              <form onSubmit={checkTyping} className="w-full flex flex-col gap-5">
                <input
                  ref={typingInputRef}
                  value={typingInput}
                  onChange={e => setTypingInput(e.target.value)}
                  className="w-full rounded-2xl p-4 sm:p-5 text-[#3c3028] text-2xl font-bold outline-none placeholder-[#aeb5bb]"
                  style={{
                    backgroundColor: '#e2edf3',
                    border: '3px solid #00a9ba',
                  }}
                  autoComplete="off"
                  disabled={isAnswered}
                />
                <button
                  type="submit"
                  disabled={isAnswered || !typingInput.trim()}
                  className="w-full h-16 rounded-2xl font-bold text-xl uppercase tracking-wider text-white shadow-sm transition-all disabled:opacity-50 disabled:translate-y-0 disabled:border-b-4 hover:brightness-105 active:translate-y-1"
                  style={{ backgroundColor: '#1cb0f6', borderBottom: '4px solid #1899d6', borderBottomWidth: isAnswered ? '2px' : '4px' }}
                >
                  Kiểm tra
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button (Audio) */}
      <button
        onClick={() => playAudio(currentWord.id.toString())}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-[#1cb0f6] hover:bg-gray-50 active:scale-95 transition-all z-10"
        style={{ border: '2px solid #dce0e3', borderBottom: '4px solid #c4cdd4' }}
      >
        <Volume2 size={26} strokeWidth={2.5} />
      </button>

      {/* Feedback Overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-6 flex flex-col items-center z-20"
            style={{ backgroundColor: feedback.type === 'success' ? '#d7ffb8' : '#ffdfe0', borderTop: `2px solid ${feedback.type === 'success' ? '#93d334' : '#ff4b4b'}` }}
          >
            <div className="w-full max-w-2xl flex flex-col gap-2">
              <div className={`text-2xl font-black ${feedback.type === 'success' ? 'text-[#58a700]' : 'text-[#ea2b2b]'}`}>
                {feedback.type === 'success' ? 'Chính xác!' : 'Sai rồi!'}
              </div>
              {feedback.type === 'error' && (level === 1 || level === 2 || level === 3) && (
                <div className="text-[#ea2b2b] text-lg font-bold">Từ đúng: <span className="font-black text-xl">{currentWord.english_word}</span></div>
              )}
              <div className="flex items-center gap-3 mt-1">
                {currentWord.ipa && (
                  <div className={`font-mono font-semibold text-lg opacity-90 ${feedback.type === 'success' ? 'text-[#58a700]' : 'text-[#ea2b2b]'}`}>{currentWord.ipa}</div>
                )}
                {currentWord.synonyms && (
                  <div className="inline-block px-3 py-1 rounded-md bg-white/40 border border-black/10">
                    <span className={`font-bold text-sm uppercase ${feedback.type === 'success' ? 'text-[#58a700]' : 'text-[#ea2b2b]'}`}>
                      = {currentWord.synonyms}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SrsMode;
