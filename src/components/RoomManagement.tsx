import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, OperationType, handleFirestoreError } from '../lib/firebase';
import { Room, WorkingHours } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Landmark, Check, X, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

const DEFAULT_SCHEDULE: Record<string, WorkingHours> = DAYS.reduce((acc, day) => ({
  ...acc,
  [day]: { start: "09:00", end: "18:00", isOpen: day !== "Pazar" }
}), {});

export function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<Room['type']>('nails');
  const [isAdding, setIsAdding] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room)));
    });
    return () => unsubscribe();
  }, []);

  const handleAddRoom = async () => {
    if (!newName) {
      toast.error('Lütfen oda/masa ismi girin.');
      return;
    }

    try {
      await addDoc(collection(db, 'rooms'), {
        name: newName,
        type: newType,
        isActive: true,
        weeklySchedule: DEFAULT_SCHEDULE
      });
      setNewName('');
      setIsAdding(false);
      toast.success('Oda/Masa başarıyla eklendi.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'rooms');
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'rooms', id));
      toast.success('Oda/Masa silindi.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'rooms');
    }
  };

  const handleUpdateSchedule = async (roomId: string, day: string, field: keyof WorkingHours, value: any) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const updatedSchedule = {
      ...room.weeklySchedule,
      [day]: { ...room.weeklySchedule[day], [field]: value }
    };

    try {
      await updateDoc(doc(db, 'rooms', roomId), { weeklySchedule: updatedSchedule });
      toast.success('Çalışma saatleri güncellendi.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'rooms');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gradient">Oda & Masa Yönetimi</h3>
        <Button onClick={() => setIsAdding(!isAdding)} className="btn-gradient rounded-xl">
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? 'İptal' : 'Yeni Oda/Masa'}
        </Button>
      </div>

      {isAdding && (
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Yeni Oda/Masa Ekle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                placeholder="Oda/Masa Adı (Örn: Masa 1, VIP Oda)" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
              <div className="flex gap-2">
                {['nails', 'skin', 'massage'].map(t => (
                  <Badge
                    key={t}
                    onClick={() => setNewType(t as Room['type'])}
                    className={cn(
                      "cursor-pointer px-4 py-1 rounded-full border-white/10",
                      newType === t ? "bg-brand-pink text-white" : "bg-white/5 text-white/60"
                    )}
                  >
                    {t === 'nails' ? 'Tırnak' : t === 'skin' ? 'Cilt' : 'Masaj'}
                  </Badge>
                ))}
              </div>
            </div>
            <Button onClick={handleAddRoom} className="w-full btn-gradient">Kaydet</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {rooms.map(room => (
          <Card key={room.id} className="glass border-white/10 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center">
                    <Landmark className="text-brand-purple w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl text-white">{room.name}</h4>
                    <Badge variant="outline" className="text-[10px] border-white/10 text-white/60">
                      {room.type === 'nails' ? 'Tırnak Masası' : room.type === 'skin' ? 'Cilt Bakım Odası' : 'Masaj Odası'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setEditingRoom(editingRoom?.id === room.id ? null : room)}
                    className="text-white/60 hover:text-white"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Saatleri Düzenle
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteRoom(room.id)}
                    className="text-white/40 hover:text-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {editingRoom?.id === room.id && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                  {DAYS.map(day => (
                    <div key={day} className="glass p-3 rounded-xl border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white/80">{day}</span>
                        <input 
                          type="checkbox" 
                          checked={room.weeklySchedule[day].isOpen}
                          onChange={(e) => handleUpdateSchedule(room.id, day, 'isOpen', e.target.checked)}
                          className="w-4 h-4 accent-brand-pink"
                          aria-label={`${day} açık/kapalı`}
                        />
                      </div>
                      {room.weeklySchedule[day].isOpen && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <p className="text-[10px] text-white/40">Başlangıç</p>
                            <Input 
                              type="time" 
                              value={room.weeklySchedule[day].start}
                              onChange={(e) => handleUpdateSchedule(room.id, day, 'start', e.target.value)}
                              className="h-8 text-xs bg-white/5 border-white/10 text-white p-1"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-white/40">Bitiş</p>
                            <Input 
                              type="time" 
                              value={room.weeklySchedule[day].end}
                              onChange={(e) => handleUpdateSchedule(room.id, day, 'end', e.target.value)}
                              className="h-8 text-xs bg-white/5 border-white/10 text-white p-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
