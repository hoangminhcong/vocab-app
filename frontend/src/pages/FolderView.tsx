import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDecks, createDeck, getFolders, deleteDeck } from '../api/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Play, Edit3 } from 'lucide-react';
import { FlowerDeckCard } from '../components/study/FlowerDeckCard';
const FolderView: React.FC = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [newDeckTitle, setNewDeckTitle] = useState('');
  
  const folderIdNum = parseInt(folderId || '0', 10);
  
  const { data: decks, isLoading } = useQuery({
    queryKey: ['decks', folderIdNum],
    queryFn: () => getDecks(folderIdNum),
    enabled: !!folderIdNum
  });

  const { data: folders } = useQuery({
    queryKey: ['folders'],
    queryFn: getFolders
  });
  
  const currentFolder = folders?.find((f: any) => f.id === folderIdNum);

  const createDeckMutation = useMutation({
    mutationFn: (title: string) => createDeck(folderIdNum, title, ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks', folderIdNum] });
      setNewDeckTitle('');
    }
  });

  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDeckTitle.trim()) {
      createDeckMutation.mutate(newDeckTitle);
    }
  };

  const deleteDeckMutation = useMutation({
    mutationFn: (id: number) => deleteDeck(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks', folderIdNum] });
    }
  });

  const handleDeleteDeck = (id: number) => {
    if (window.confirm("Bạn có chắc muốn xóa bài này không?")) {
      deleteDeckMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#fdfaf3' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border-2 border-[#e5e5e5]">
          <div>
            <h2 className="text-3xl font-extrabold text-[#3c3028]">{currentFolder?.name || 'Folder'}</h2>
            <p className="text-[#7a726d] font-bold mt-1">{currentFolder?.description || 'Manage your decks here.'}</p>
          </div>
        </div>
      
      <form onSubmit={handleCreateDeck} className="flex gap-4">
        <Input 
          placeholder="New deck title..." 
          value={newDeckTitle}
          onChange={(e) => setNewDeckTitle(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" disabled={createDeckMutation.isPending}>
          <Plus className="w-4 h-4 mr-2" />
          Create Deck
        </Button>
      </form>
      
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {decks?.map((deck: any, index: number) => (
            <div key={deck.id} className="relative group">
              <FlowerDeckCard 
                deck={deck} 
                index={index}
                onClick={() => navigate(`/dashboard/deck/${deck.id}`)}
                onEdit={(e) => {
                  e.stopPropagation();
                  navigate(`/dashboard/deck/${deck.id}`);
                }}
                onStudy={(e) => {
                  e.stopPropagation();
                  navigate(`/study/${deck.id}`);
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  handleDeleteDeck(deck.id);
                }}
              />
            </div>
          ))}
          {decks?.length === 0 && (
            <div className="col-span-full text-center py-12 text-[#7a726d] font-bold border-2 border-dashed border-[#dce0e3] rounded-2xl bg-white">
              This folder is empty. Create a deck to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderView;
