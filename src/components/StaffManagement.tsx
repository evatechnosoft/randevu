import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, OperationType, handleFirestoreError } from '../lib/firebase';
import { Staff, WorkingHours } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, UserPlus, Check, X, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

const DEFAULT_SCHEDULE: Record<string, WorkingHours> = DAYS.reduce((acc, day) => ({
  ...acc,
  [day]: { start: "09:00", end: "18:00", isOpen: day !== "Pazar" }
}), {});

export function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [newName, setNewName] = useState('');
  const [newSpecialties, setNewSpecialties] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'staff'), (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)));
    });
    return () => unsubscribe();
  }, []);

  const handleAddStaff = async () => {
    if (!newName || newSpecialties.length === 0) {
      toast.error('Lütfen isim ve en az bir uzmanlık alanı girin.');
      return;
    }

    try {
      await addDoc(collection(db, 'staff'), {
        name: newName,
        specialties: newSpecialties,
        isActive: true,
        weeklySchedule: DEFAULT_SCHEDULE,
        imageUrl: `https://avatar.iran.liara.run/public/${Math.floor(Math.random() * 100)}`
      });
      setNewName('');
      setNewSpecialties([]);
      setIsAdding(false);
      toast.success('Personel başarıyla eklendi.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'staff');
    }
  };

  const handleUpdateSchedule = async (staffId: string, day: string, field: keyof WorkingHours, value: any) => {
    const person = staff.find(s => s.id === staffId);
    if (!person) return;

    const updatedSchedule = {
      ...person.weeklySchedule,
      [day]: { ...person.weeklySchedule[day], [field]: value }
    };

    try {
      await updateDoc(doc(db, 'staff', staffId), { weeklySchedule: updatedSchedule });
      toast.success('Çalışma saatleri güncellendi.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'staff');
    }
  };

  const toggleSpecialty = (s: string) => {
    setNewSpecialties(prev => 
      prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]
    );
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'staff', id));
      toast.success('Personel silindi.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'staff');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gradient">Personel Yönetimi</h3>
        <Button onClick={() => setIsAdding(!isAdding)} className="btn-gradient rounded-xl">
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
          {isAdding ? 'İptal' : 'Yeni Personel'}
        </Button>
      </div>

      {isAdding && (
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Yeni Personel Ekle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              placeholder="Personel Adı" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <div className="space-y-2">
              <p className="text-sm text-white/60">Uzmanlık Alanları</p>
              <div className="flex gap-2">
                {['nails', 'skin', 'massage'].map(s => (
                  <Badge
                    key={s}
                    onClick={() => toggleSpecialty(s)}
                    className={cn(
                      "cursor-pointer px-4 py-1 rounded-full border-white/10",
                      newSpecialties.includes(s) ? "bg-brand-pink text-white" : "bg-white/5 text-white/60"
                    )}
                  >
                    {s === 'nails' ? 'Tırnak' : s === 'skin' ? 'Cilt' : 'Masaj'}
                  </Badge>
                ))}
              </div>
            </div>
            <Button onClick={handleAddStaff} className="w-full btn-gradient">Kaydet</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {staff.map(s => (
          <Card key={s.id} className="glass border-white/10 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <img src={s.imageUrl} className="w-16 h-16 rounded-full object-cover border-2 border-brand-pink/20" />
                  <div>
                    <h4 className="font-bold text-xl text-white">{s.name}</h4>
                    <div className="flex gap-1 mt-1">
                      {s.specialties.map(spec => (
                        <Badge key={spec} variant="outline" className="text-[10px] border-white/10 text-white/60">
                          {spec === 'nails' ? 'Tırnak' : spec === 'skin' ? 'Cilt' : 'Masaj'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setEditingStaffId(editingStaffId === s.id ? null : s.id)}
                    className="text-white/60 hover:text-white"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Çalışma Saatleri
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteStaff(s.id)}
                    className="text-white/40 hover:text-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {editingStaffId === s.id && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                  {DAYS.map(day => (
                    <div key={day} className="glass p-3 rounded-xl border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white/80">{day}</span>
                        <input 
                          type="checkbox" 
                          checked={s.weeklySchedule?.[day]?.isOpen}
                          onChange={(e) => handleUpdateSchedule(s.id, day, 'isOpen', e.target.checked)}
                          className="w-4 h-4 accent-brand-pink"
                        />
                      </div>
                      {s.weeklySchedule?.[day]?.isOpen && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <p className="text-[10px] text-white/40">Başlangıç</p>
                            <Input 
                              type="time" 
                              value={s.weeklySchedule[day].start}
                              onChange={(e) => handleUpdateSchedule(s.id, day, 'start', e.target.value)}
                              className="h-8 text-xs bg-white/5 border-white/10 text-white p-1"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-white/40">Bitiş</p>
                            <Input 
                              type="time" 
                              value={s.weeklySchedule[day].end}
                              onChange={(e) => handleUpdateSchedule(s.id, day, 'end', e.target.value)}
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
