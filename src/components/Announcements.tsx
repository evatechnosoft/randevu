import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, addDoc, deleteDoc, doc, OperationType, handleFirestoreError } from '../lib/firebase';
import { Announcement } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Megaphone, X } from 'lucide-react';
import { toast } from 'sonner';

export function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'announcements'), (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async () => {
    if (!title || !content) {
      toast.error('Lütfen başlık ve içerik girin.');
      return;
    }

    try {
      await addDoc(collection(db, 'announcements'), {
        title,
        content,
        type: 'info',
        isActive: true,
        createdAt: new Date().toISOString()
      });
      setTitle('');
      setContent('');
      setIsAdding(false);
      toast.success('Duyuru yayınlandı.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'announcements');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
      toast.success('Duyuru silindi.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'announcements');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gradient">Duyuru Yönetimi</h3>
        <Button onClick={() => setIsAdding(!isAdding)} className="btn-gradient rounded-xl">
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? 'İptal' : 'Yeni Duyuru'}
        </Button>
      </div>

      {isAdding && (
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Yeni Duyuru Yayınla</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              placeholder="Duyuru Başlığı" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <Textarea 
              placeholder="Duyuru İçeriği" 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              className="bg-white/5 border-white/10 text-white min-h-[100px]"
            />
            <Button onClick={handleAdd} className="w-full btn-gradient">Yayınla</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {announcements.map(a => (
          <Card key={a.id} className="glass border-white/10 p-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-brand-pink/20 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5 text-brand-pink" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white">{a.title}</h4>
              <p className="text-sm text-white/60 mt-1">{a.content}</p>
              <p className="text-[10px] text-white/30 mt-2">
                {new Date(a.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleDelete(a.id!)}
              className="text-white/40 hover:text-red-500"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
