import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDueVocabularies } from '../api/queries';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import SrsMode from '@/components/study/SrsMode';
import SurvivalMode from '@/components/study/SurvivalMode';

const StudyView: React.FC = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const deckIdNum = parseInt(deckId || '0', 10);
  const [mode, setMode] = useState<'selection' | 'srs' | 'survival'>('selection');

  const { data: allWords, isLoading } = useQuery({
    queryKey: ['deck-vocabularies', deckIdNum],
    queryFn: () => getDueVocabularies(deckIdNum),
    enabled: !!deckIdNum
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading words...</div>;
  if (!allWords || allWords.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 space-y-6">
        <h2 className="text-3xl font-bold text-foreground">Deck Trống!</h2>
        <p className="text-muted-foreground">Deck này chưa có từ vựng nào. Hãy thêm từ vựng trước khi học.</p>
        <Button onClick={() => navigate(-1)} variant="default">Quay lại</Button>
      </div>
    );
  }

  if (mode === 'srs') return <SrsMode allWords={allWords} onExit={() => setMode('selection')} />;
  if (mode === 'survival') return <SurvivalMode allWords={allWords} onExit={() => setMode('selection')} />;

  // Mode Selection View
  return (
    <div className="min-h-screen bg-background flex flex-col p-4">
      <header className="mb-8 flex items-center">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 w-5 h-5" /> Trở Về Deck
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-foreground tracking-tight">Chọn Chế Độ Học</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Khám phá 2 chế độ học được thiết kế đặc biệt để giúp bạn ghi nhớ từ vựng hiệu quả nhất.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <div 
              className="bg-card border-2 border-primary/20 hover:border-primary p-8 rounded-2xl cursor-pointer transition-all flex flex-col h-full items-center text-center group shadow-sm hover:shadow-md"
              onClick={() => setMode('srs')}
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Brain className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-4">SRS Mastery</h2>
              <p className="text-muted-foreground mb-8">
                Hệ thống ôn tập ngắt quãng 4 cấp độ chuyên sâu. Học từ vựng một cách khoa học, chắc chắn không thể quên.
              </p>
              <Button size="lg" className="mt-auto w-full font-semibold text-lg">
                Vào Học Ngay
              </Button>
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <div 
              className="bg-card border-2 border-orange-500/20 hover:border-orange-500 p-8 rounded-2xl cursor-pointer transition-all flex flex-col h-full items-center text-center group shadow-sm hover:shadow-md"
              onClick={() => setMode('survival')}
            >
              <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-orange-500/20 transition-colors">
                <Zap className="w-10 h-10 text-orange-500" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Survival Mode</h2>
              <p className="text-muted-foreground mb-8">
                Chế độ ôn siêu tốc độ! 10 giây mỗi từ, 3 sinh mệnh. Cực kỳ gay cấn, rèn luyện phản xạ siêu nhanh.
              </p>
              <Button size="lg" className="mt-auto w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg">
                Thử Thách
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default StudyView;
