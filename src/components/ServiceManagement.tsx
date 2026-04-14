import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, OperationType, handleFirestoreError } from '../lib/firebase';
import { Service } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit2, Check, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'nails' | 'skin' | 'massage'>('nails');
  const [price, setPrice] = useState('');
  const [duration, setPriceDuration] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'services'), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
    });
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setName('');
    setCategory('nails');
    setPrice('');
    setPriceDuration('');
    setDescription('');
    setImageUrl('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!name || !price || !duration) {
      toast.error('Lütfen zorunlu alanları doldurun.');
      return;
    }

    const serviceData = {
      name,
      category,
      price: Number(price),
      duration: Number(duration),
      description,
      imageUrl: imageUrl || 'https://images.pexels.com/photos/704815/pexels-photo-704815.jpeg?auto=compress&cs=tinysrgb&w=1200'
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'services', editingId), serviceData);
        toast.success('Hizmet güncellendi.');
      } else {
        await addDoc(collection(db, 'services'), serviceData);
        toast.success('Yeni hizmet eklendi.');
      }
      resetForm();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'services');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu hizmeti silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'services', id));
      toast.success('Hizmet silindi.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'services');
    }
  };

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    setName(service.name);
    setCategory(service.category);
    setPrice(service.price.toString());
    setPriceDuration(service.duration.toString());
    setDescription(service.description);
    setImageUrl(service.imageUrl);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gradient">Hizmet Yönetimi</h3>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="btn-gradient rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Yeni Hizmet
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="glass border-brand-pink/20">
          <CardHeader>
            <CardTitle className="text-white">{editingId ? 'Hizmeti Düzenle' : 'Yeni Hizmet Ekle'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-white/60">Hizmet Adı</label>
                <Input value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/60">Kategori</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-pink/50"
                >
                  <option value="nails" className="bg-[#1a1f2f]">Tırnak</option>
                  <option value="skin" className="bg-[#1a1f2f]">Cilt Bakımı</option>
                  <option value="massage" className="bg-[#1a1f2f]">Masaj</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/60">Fiyat (TL)</label>
                <Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/60">Süre (Dakika)</label>
                <Input type="number" value={duration} onChange={e => setPriceDuration(e.target.value)} className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/60">Görsel URL</label>
              <div className="flex gap-2">
                <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="bg-white/5 border-white/10 text-white" />
                {imageUrl && <img src={imageUrl} className="w-10 h-10 rounded object-cover border border-white/10" alt="Preview" />}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/60">Açıklama</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} className="bg-white/5 border-white/10 text-white min-h-[100px]" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={resetForm} className="text-white/60 hover:text-white">İptal</Button>
              <Button onClick={handleSave} className="btn-gradient rounded-xl px-8">
                <Check className="w-4 h-4 mr-2" /> Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {services.map(service => (
          <Card key={service.id} className="glass border-white/5 hover:border-white/10 transition-colors">
            <div className="p-4 flex items-center gap-4">
              <img src={service.imageUrl} className="w-16 h-16 rounded-xl object-cover" alt={service.name} />
              <div className="flex-1">
                <h4 className="font-bold text-white">{service.name}</h4>
                <p className="text-xs text-white/40 uppercase tracking-widest">{service.category} • {service.duration} dk • {service.price} TL</p>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => startEdit(service)} className="text-white/40 hover:text-brand-purple hover:bg-brand-purple/10">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(service.id)} className="text-white/40 hover:text-red-500 hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
