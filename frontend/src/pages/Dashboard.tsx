import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFolders, createFolder } from '../api/queries';
import { FolderPlus, BookOpen, LogOut } from 'lucide-react';
import FolderView from './FolderView';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [newFolderName, setNewFolderName] = useState('');

  const { data: folders, isLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: getFolders
  });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => createFolder(name, ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setNewFolderName('');
    }
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createFolderMutation.mutate(newFolderName);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">My Library</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, <span className="font-medium text-primary">{user?.full_name || user?.email}</span>. You're on a {user?.current_streak || 0} day streak!
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Log out
          </Button>
        </header>

        <main className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-4">
            <Card className="bg-card shadow-sm border-border sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Folders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleCreateFolder} className="flex gap-2">
                  <Input 
                    placeholder="New folder..." 
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <Button type="submit" size="icon" className="h-9 w-9" disabled={createFolderMutation.isPending}>
                    <FolderPlus className="w-4 h-4" />
                  </Button>
                </form>
                
                <div className="space-y-1">
                  {isLoading ? (
                    <div className="text-sm text-muted-foreground">Loading folders...</div>
                  ) : folders?.map((folder: any) => {
                    const isActive = location.pathname === `/dashboard/folder/${folder.id}`;
                    return (
                      <Button 
                        key={folder.id} 
                        variant={isActive ? "secondary" : "ghost"} 
                        className={`w-full justify-start font-medium transition-colors ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={() => navigate(`/dashboard/folder/${folder.id}`)}
                      >
                        {folder.name}
                      </Button>
                    );
                  })}
                  {folders?.length === 0 && !isLoading && (
                    <div className="text-sm text-muted-foreground italic">No folders yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-3">
             <Routes>
                <Route path="/" element={
                   <Card className="bg-card shadow-sm border-border h-full flex items-center justify-center min-h-[400px]">
                     <div className="text-center space-y-3">
                       <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                          <BookOpen className="w-8 h-8" />
                       </div>
                       <h2 className="text-xl font-semibold">Select a folder</h2>
                       <p className="text-muted-foreground max-w-sm">
                         Choose a folder from the sidebar to view its decks, or create a new one to start organizing your vocabulary.
                       </p>
                     </div>
                   </Card>
                } />
                <Route path="/folder/:folderId" element={<FolderView />} />
             </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
