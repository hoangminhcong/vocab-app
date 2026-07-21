import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVocabularies, updateVocabulary, deleteVocabulary } from '../api/queries';
import api from '../api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ArrowLeft, Plus, Volume2, Camera, Loader2, Trash2 } from 'lucide-react';

const EditableCell = ({ value, onSave, placeholder, prefix }: { value: string, onSave: (val: string) => void, placeholder?: string, prefix?: React.ReactNode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  if (isEditing) {
    return (
      <Input
        autoFocus
        value={currentValue || ''}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={() => {
          setIsEditing(false);
          if (currentValue !== value) onSave(currentValue);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setIsEditing(false);
            if (currentValue !== value) onSave(currentValue);
          }
          if (e.key === 'Escape') {
            setIsEditing(false);
            setCurrentValue(value);
          }
        }}
        className="h-8 py-1 px-2 text-sm bg-white border-2 border-primary min-w-[100px]"
      />
    );
  }

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className="min-h-[2.5rem] flex items-center px-2 cursor-text hover:bg-black/5 rounded transition-colors whitespace-normal break-words"
      title="Click đúp để sửa"
    >
      {prefix && <span className="mr-1 opacity-70 italic font-normal">{prefix}</span>}
      {value || <span className="text-muted-foreground italic text-xs">{placeholder || 'Trống'}</span>}
    </div>
  );
};

const DeckView: React.FC = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deckIdNum = parseInt(deckId || '0', 10);
  const [isScanning, setIsScanning] = useState(false);

  const getShortPos = (pos: string | null | undefined) => {
    if (!pos) return null;
    const lower = pos.toLowerCase().trim();
    if (lower === 'noun') return 'n';
    if (lower === 'verb') return 'v';
    if (lower === 'adjective') return 'adj';
    if (lower === 'adverb') return 'adv';
    if (lower === 'preposition') return 'prep';
    if (lower === 'conjunction') return 'conj';
    if (lower === 'pronoun') return 'pron';
    if (lower === 'interjection') return 'intj';
    return pos;
  };

  const [newWord, setNewWord] = useState({
    english_word: '',
    vi_meaning: '',
    en_meaning: '',
    example: '',
    ipa: '',
    part_of_speech: ''
  });

  const { data: vocabularies, isLoading } = useQuery({
    queryKey: ['vocabularies', deckIdNum],
    queryFn: () => getVocabularies(deckIdNum),
    enabled: !!deckIdNum
  });

  const addVocabMutation = useMutation({
    mutationFn: async (vocabData: any) => {
      const { data } = await api.post(`/vocabularies/deck/${deckIdNum}`, vocabData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabularies', deckIdNum] });
      setNewWord({
        english_word: '',
        vi_meaning: '',
        en_meaning: '',
        example: '',
        ipa: '',
        part_of_speech: ''
      });
    }
  });

  const updateVocabMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return updateVocabulary(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabularies', deckIdNum] });
    }
  });

  const deleteVocabMutation = useMutation({
    mutationFn: async (id: number) => {
      return deleteVocabulary(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabularies', deckIdNum] });
    }
  });

  const handleAddVocab = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWord.english_word && newWord.vi_meaning) {
      addVocabMutation.mutate(newWord);
    }
  };

  const handleUpdateWord = (id: number, field: string, value: string) => {
    updateVocabMutation.mutate({ id, data: { [field]: value } });
  };

  const handleDeleteWord = (id: number) => {
    if (window.confirm("Bạn có chắc muốn xóa từ này không?")) {
      deleteVocabMutation.mutate(id);
    }
  };

  const playAudio = (url: string | null) => {
    if (url) {
      const audio = new Audio(`http://localhost:8000${url}`);
      audio.play().catch(() => { });
    }
  };

  const handleImageScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsScanning(true);
    try {
      await api.post(`/import/deck/${deckIdNum}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      queryClient.invalidateQueries({ queryKey: ['vocabularies', deckIdNum] });
      alert('Quét ảnh và thêm từ thành công!');
    } catch (err: any) {
      alert('Lỗi quét ảnh: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsScanning(false);
      if (e.target) e.target.value = '';
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold text-[#7a726d]" style={{ backgroundColor: '#fdfaf3' }}>Đang tải...</div>;

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ backgroundColor: '#fdfaf3' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border-2 border-[#e5e5e5]">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-gray-100 rounded-full w-10 h-10 shrink-0">
              <ArrowLeft className="w-6 h-6 text-[#7a726d]" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#3c3028]">Quản lý Từ Vựng</h1>
              <p className="text-[#7a726d] font-bold mt-1 text-sm sm:text-base">{vocabularies?.length || 0} từ trong bộ bài này</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/study/${deckIdNum}`)}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-xl uppercase tracking-wider text-white shadow-sm transition-all hover:brightness-105 active:translate-y-1 flex items-center justify-center gap-2 shrink-0"
            style={{ backgroundColor: '#1cb0f6', borderBottom: '4px solid #1899d6' }}
          >
            <Play className="w-5 h-5 fill-current" /> Study Now
          </button>
        </header>

        <div className="grid lg:grid-cols-4 gap-8 items-start">
          <div className="lg:col-span-1 space-y-6">
            <Card className="sticky top-8 border-2 border-[#e5e5e5] rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-extrabold text-[#3c3028]">Thêm từ mới</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddVocab} className="space-y-4 font-bold text-[#3c3028]">
                  <div className="space-y-2">
                    <Label>Tiếng Anh *</Label>
                    <Input
                      required
                      value={newWord.english_word}
                      onChange={e => setNewWord({ ...newWord, english_word: e.target.value })}
                      className="border-2 border-[#dce0e3] rounded-xl focus-visible:ring-[#1cb0f6]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tiếng Việt *</Label>
                    <Input
                      required
                      value={newWord.vi_meaning}
                      onChange={e => setNewWord({ ...newWord, vi_meaning: e.target.value })}
                      className="border-2 border-[#dce0e3] rounded-xl focus-visible:ring-[#1cb0f6]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Từ loại</Label>
                    <Input
                      value={newWord.part_of_speech}
                      onChange={e => setNewWord({ ...newWord, part_of_speech: e.target.value })}
                      className="border-2 border-[#dce0e3] rounded-xl focus-visible:ring-[#1cb0f6]"
                      placeholder="Vd: noun, verb"
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-xl bg-[#58cc02] hover:bg-[#46a302] text-white font-bold text-lg h-12" disabled={addVocabMutation.isPending}>
                    <Plus className="w-5 h-5 mr-2" /> Thêm Từ
                  </Button>
                </form>

                <div className="w-full h-px bg-[#e5e5e5] my-6" />

                <div className="space-y-4">
                  <h4 className="font-extrabold text-[#3c3028]">Import hàng loạt</h4>

                  {/* AI Scan Image Button */}
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageScan}
                      disabled={isScanning}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <Button
                      className="w-full rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-lg h-12 relative overflow-hidden"
                      disabled={isScanning}
                    >
                      {isScanning ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang phân tích AI...</>
                      ) : (
                        <><Camera className="w-5 h-5 mr-2" /> Scan Ảnh bằng AI 📸</>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label className="text-[#7a726d] font-bold text-xs">Hoặc Tải lên file TXT, CSV, Excel</Label>
                    <Input
                      type="file"
                      accept=".txt,.csv,.xlsx"
                      className="border-2 border-[#dce0e3] rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer text-xs sm:text-sm"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          await api.post(`/import/deck/${deckIdNum}`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });
                          queryClient.invalidateQueries({ queryKey: ['vocabularies', deckIdNum] });
                          alert('Import thành công!');
                        } catch (err: any) {
                          alert('Import thất bại: ' + (err.response?.data?.detail || err.message));
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border-2 border-[#e5e5e5] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-[#f7f7f7] text-[#7a726d] font-extrabold text-xs sm:text-sm uppercase tracking-wider border-b-2 border-[#e5e5e5]">
                      <th className="py-4 px-4 w-[25%]">Tiếng Anh</th>
                      <th className="py-4 px-4 w-[25%]">Tiếng Việt</th>
                      <th className="py-4 px-4 w-[20%]">Phiên Âm</th>
                      <th className="py-4 px-4 w-[20%]">Đồng Nghĩa</th>
                      <th className="py-4 px-4 w-[10%] text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vocabularies?.map((vocab: any) => (
                      <tr key={vocab.id} className="border-b border-[#e5e5e5] last:border-b-0 hover:bg-gray-50 transition-colors group text-[#3c3028] font-bold text-sm sm:text-base align-top">
                        <td className="py-3 px-4">
                          <EditableCell
                            value={vocab.english_word}
                            onSave={(val) => handleUpdateWord(vocab.id, 'english_word', val)}
                            placeholder="Tiếng Anh"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <EditableCell
                            value={vocab.vi_meaning}
                            onSave={(val) => handleUpdateWord(vocab.id, 'vi_meaning', val)}
                            placeholder="Tiếng Việt"
                            prefix={getShortPos(vocab.part_of_speech) ? `(${getShortPos(vocab.part_of_speech)})` : null}
                          />
                        </td>
                        <td className="py-3 px-4 font-mono text-[#7a726d] font-normal text-sm">
                          <EditableCell
                            value={vocab.ipa}
                            onSave={(val) => handleUpdateWord(vocab.id, 'ipa', val)}
                            placeholder="/ipa/"
                          />
                        </td>
                        <td className="py-3 px-4 text-[#1cb0f6] font-normal text-sm">
                          <EditableCell
                            value={vocab.synonyms}
                            onSave={(val) => handleUpdateWord(vocab.id, 'synonyms', val)}
                            placeholder="VD: a, b"
                          />
                        </td>
                        <td className="py-3 px-4 text-center shrink-0">
                          <button
                            onClick={() => handleDeleteWord(vocab.id)}
                            className="text-[#ea2b2b] opacity-50 group-hover:opacity-100 hover:scale-110 transition-all p-2 rounded-full hover:bg-red-50"
                            title="Xóa từ"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {vocabularies?.length === 0 && (
                <div className="text-center py-16 text-[#7a726d] font-bold text-lg px-4">
                  Deck này chưa có từ vựng nào. Hãy thêm hoặc Scan ảnh ở cột bên trái nhé!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckView;
