import React, { useState, useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SurvivalModeProps {
  allWords: any[];
  onExit: () => void;
}

const SurvivalMode: React.FC<SurvivalModeProps> = ({ allWords, onExit }) => {
  const [queue, setQueue] = useState<any[]>([]);
  const [currentWord, setCurrentWord] = useState<any | null>(null);
  const [mcqOptions, setMcqOptions] = useState<any[]>([]);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isProcessingRef = useRef(false);

  // Initialize session
  useEffect(() => {
    const shuffled = [...allWords].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setVictory(false);
  }, [allWords]);

  useEffect(() => {
    if (queue.length > 0 && !currentWord && !gameOver && !victory) {
      loadNextWord(queue);
    }
  }, [queue, currentWord, gameOver, victory]);

  // Timer logic
  useEffect(() => {
    if (!currentWord || isAnswered || gameOver || victory) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentWord, isAnswered, gameOver, victory]);

  const loadNextWord = (currentQueue: any[]) => {
    if (currentQueue.length === 0) {
      setVictory(true);
      return;
    }
    const nextWord = currentQueue[0];
    const newQueue = currentQueue.slice(1);
    setQueue(newQueue);
    setCurrentWord(nextWord);
    setIsAnswered(false);
    setTimeLeft(10);
    setFeedback(null);
    isProcessingRef.current = false;
    generateOptions(nextWord);
    playAudio(nextWord.audio_url);
  };

  const generateOptions = (word: any) => {
    const pool = allWords.filter(w => w.id !== word.id);
    const shuffledPool = pool.sort(() => Math.random() - 0.5);
    const options = [word, ...shuffledPool.slice(0, 3)].sort(() => Math.random() - 0.5);
    setMcqOptions(options);
  };

  const playAudio = (url?: string) => {
    if (url) {
      new Audio(`http://localhost:8000${url}`).play().catch(e => console.log('Audio error:', e));
    }
  };

  const handleTimeout = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    const newLives = lives - 1;
    setLives(newLives);
    setFeedback({ msg: "⏰ Hết giờ! Mất 1 mạng.", type: 'error' });

    if (newLives <= 0) {
      setTimeout(() => setGameOver(true), 1500);
    } else {
      setTimeout(() => loadNextWord(queue), 1500);
    }
  };

  const checkAnswer = (selectedWord: any) => {
    if (isAnswered || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsAnswered(true);

    if (selectedWord.id === currentWord.id) {
      setScore(s => s + 10);
      setFeedback({ msg: "✅ Chính xác! +10 điểm", type: 'success' });
      setTimeout(() => loadNextWord(queue), 1000);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setFeedback({ msg: "❌ Sai rồi! Mất 1 mạng.", type: 'error' });

      if (newLives <= 0) {
        setTimeout(() => setGameOver(true), 1500);
      } else {
        setTimeout(() => loadNextWord(queue), 1500);
      }
    }
  };

  const restart = () => {
    const shuffled = [...allWords].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setCurrentWord(null);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setVictory(false);
    isProcessingRef.current = false;
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      playAudio(currentWord?.audio_url);
    }

    if (!isAnswered && !gameOver && !victory && currentWord) {
      if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key) - 1;
        if (idx < mcqOptions.length) {
          e.preventDefault();
          checkAnswer(mcqOptions[idx]);
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentWord, isAnswered, gameOver, victory, mcqOptions]);

  if (gameOver) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#fdfaf3' }}>
        <h1 className="text-[4rem] sm:text-7xl font-black text-[#da6c68] mb-4 drop-shadow-sm text-center leading-tight">💀 GAME OVER 💀</h1>
        <p className="text-2xl mb-8 font-bold text-[#3c3028]">Điểm của bạn: <span className="text-[#da6c68] text-3xl">{score}</span></p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <button onClick={restart} className="flex-1 h-16 rounded-2xl font-bold text-xl uppercase tracking-wider text-white shadow-sm hover:brightness-105 active:translate-y-1 transition-all" style={{ backgroundColor: '#1cb0f6', borderBottom: '4px solid #1899d6' }}>
            Chơi Lại
          </button>
          <button onClick={onExit} className="flex-1 h-16 rounded-2xl font-bold text-xl uppercase tracking-wider text-[#da6c68] bg-white shadow-sm hover:bg-gray-50 active:translate-y-1 transition-all" style={{ border: '2px solid #dce0e3', borderBottom: '4px solid #c4cdd4' }}>
            Thoát
          </button>
        </div>
      </div>
    );
  }

  if (victory) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#fdfaf3' }}>
        <h1 className="text-5xl sm:text-6xl font-black text-[#58a700] mb-4 text-center">🏆 HOÀN THÀNH 🏆</h1>
        <p className="text-2xl mb-8 font-bold text-[#3c3028]">Điểm: <span className="text-[#58a700] text-3xl">{score}</span> | Mạng: {lives}</p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <button onClick={restart} className="flex-1 h-16 rounded-2xl font-bold text-xl uppercase tracking-wider text-white shadow-sm hover:brightness-105 active:translate-y-1 transition-all" style={{ backgroundColor: '#1cb0f6', borderBottom: '4px solid #1899d6' }}>
            Chơi Lại
          </button>
          <button onClick={onExit} className="flex-1 h-16 rounded-2xl font-bold text-xl uppercase tracking-wider text-[#da6c68] bg-white shadow-sm hover:bg-gray-50 active:translate-y-1 transition-all" style={{ border: '2px solid #dce0e3', borderBottom: '4px solid #c4cdd4' }}>
            Thoát
          </button>
        </div>
      </div>
    );
  }

  if (!currentWord) return <div className="min-h-screen flex items-center justify-center font-bold text-xl text-[#7a726d]" style={{ backgroundColor: '#fdfaf3' }}>Đang chuẩn bị dữ liệu...</div>;

  return (
    <div className="min-h-screen flex flex-col font-sans relative" style={{ backgroundColor: '#fdfaf3' }}>
      {/* Header Banner */}
      <div className="w-full flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#da6c68' }}>
        <div className="font-extrabold text-[#7a1818] text-lg sm:text-xl tracking-wide truncate pr-4">
          [SURVIVAL] - Vocabulary
        </div>
        <button onClick={onExit} className="text-[#7a1818] hover:opacity-70 transition-opacity">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      {/* Progress Bar Area */}
      <div className="w-full max-w-2xl mx-auto px-4 py-4 flex flex-col gap-3">
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <svg key={i} width="36" height="36" viewBox="0 0 24 24" fill={i < lives ? "#da6c68" : "#e5e5e5"} stroke="none">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ))}
          </div>
          <div className="bg-white px-4 py-1.5 rounded-full font-bold text-[#3c3028] shadow-sm text-sm">
            {score}
          </div>
        </div>

        {/* Timer Bar */}
        <div className="w-full h-6 sm:h-7 rounded-full overflow-hidden flex" style={{ backgroundColor: '#e5e5e5' }}>
          <div className="h-full transition-all duration-1000 ease-linear rounded-full" style={{ width: `${(timeLeft / 10) * 100}%`, backgroundColor: '#da6c68' }}></div>
        </div>

        {/* Correct Count */}
        <div className="text-right text-sm font-bold mt-1" style={{ color: '#00a9ba' }}>
          Đúng: {Math.floor(score / 10)}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center p-4 max-w-2xl mx-auto w-full pb-32">

        {/* Word Display */}
        <div className="text-center mb-10 w-full flex flex-col items-center">
          <h2 className="text-[2.5rem] sm:text-[3.5rem] font-extrabold text-[#3c3028] leading-tight mb-2 tracking-tight">
            {currentWord.english_word}
          </h2>
          {currentWord.ipa && <p className="text-[#5e544d] font-mono text-xl font-bold mt-1 mb-4">{currentWord.ipa}</p>}

          {/* Synonyms Pill */}
          {currentWord.synonyms && (
            <div className="inline-block px-5 py-2.5 rounded-full mt-2" style={{ backgroundColor: '#52e3b5' }}>
              <span className="text-[#1e5e49] font-black uppercase text-sm sm:text-base tracking-wide">
                {currentWord.synonyms}
              </span>
            </div>
          )}
        </div>

        {/* MCQ Options */}
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
                onClick={() => checkAnswer(opt)}
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
                  {opt.vi_meaning} {opt.part_of_speech ? `(${opt.part_of_speech})` : ''}
                </span>
                {opt.ipa && (
                  <span className="text-[0.95rem] font-mono text-[#7a726d] font-bold mt-1 tracking-wide">{opt.ipa}</span>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* Floating Action Button (Audio) */}
      <button
        onClick={() => playAudio(currentWord.audio_url)}
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
                {feedback.msg}
              </div>
              {feedback.type === 'error' && (
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

export default SurvivalMode;
