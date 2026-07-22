import api from './axios';

export const getFolders = async () => {
  const { data } = await api.get('/folders/');
  return data;
};

export const createFolder = async (name: string, description: string) => {
  const { data } = await api.post('/folders/', { name, description });
  return data;
};

export const getDecks = async (folderId: number) => {
  const { data } = await api.get(`/decks/folder/${folderId}`);
  return data;
};

export const createDeck = async (folderId: number, title: string, description: string) => {
  const { data } = await api.post(`/decks/folder/${folderId}`, { title, description });
  return data;
};

export const updateDeck = async (deckId: number, updateData: any) => {
  const { data } = await api.put(`/decks/${deckId}`, updateData);
  return data;
};

export const getVocabularies = async (deckId: number) => {
  const { data } = await api.get(`/vocabularies/deck/${deckId}`);
  return data;
};

export const recordSurvivalWin = async (deckId: number) => {
  const { data } = await api.post(`/decks/${deckId}/survival-win`);
  return data;
};

export const getDueVocabularies = async (deckId: number) => {
  const { data } = await api.get(`/study/due/${deckId}`);
  return data;
};

export const submitReview = async (vocabId: number, isCorrect: boolean, studyTime: number) => {
  const { data } = await api.post(`/study/${vocabId}/review`, { is_correct: isCorrect, study_time_seconds: studyTime });
  return data;
};

export const updateVocabulary = async (vocabId: number, updateData: any) => {
  const { data } = await api.put(`/vocabularies/${vocabId}`, updateData);
  return data;
};

export const deleteDeck = async (deckId: number) => {
  const { data } = await api.delete(`/decks/${deckId}`);
  return data;
};

export const deleteVocabulary = async (vocabId: number) => {
  const { data } = await api.delete(`/vocabularies/${vocabId}`);
  return data;
};
