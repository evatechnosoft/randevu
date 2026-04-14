import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, updateDoc, doc, OperationType, handleFirestoreError } from '../lib/firebase';
import { UserProfile } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, User, Phone, Mail, FileText, Heart } from 'lucide-react';
import { toast } from 'sonner';

export function CustomerDatabase() {
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile)));
    });
    return () => unsubscribe();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phoneNumber?.includes(searchTerm)
  );

  const handleUpdateNotes = async (uid: string, notes: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { notes });
      toast.success('Notlar güncellendi.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
          <Input 
            placeholder="Müşteri Ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white rounded-xl"
          />
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
          {filteredCustomers.map(c => (
            <Button
              key={c.uid}
              variant="outline"
              onClick={() => setSelectedCustomer(c)}
              className={cn(
                "w-full justify-start h-16 glass border-white/10 text-white",
                selectedCustomer?.uid === c.uid && "border-brand-pink bg-brand-pink/10"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-brand-purple/20 flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-brand-purple" />
              </div>
              <div className="text-left">
                <p className="font-medium">{c.displayName}</p>
                <p className="text-xs text-white/60">{c.email}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        {selectedCustomer ? (
          <Card className="glass border-white/10 h-full">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-pink to-brand-purple flex items-center justify-center text-2xl font-bold">
                  {selectedCustomer.displayName?.charAt(0)}
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">{selectedCustomer.displayName}</CardTitle>
                  <p className="text-white/60">Müşteri Profili</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white/80">
                    <Mail className="w-5 h-5 text-brand-pink" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <Phone className="w-5 h-5 text-brand-purple" />
                    <span>{selectedCustomer.phoneNumber || 'Telefon belirtilmemiş'}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white/80">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span>Favori Hizmetler: {selectedCustomer.favoriteServices?.join(', ') || 'Yok'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/80">
                    <FileText className="w-5 h-5 text-brand-pink" />
                    <h4 className="font-bold">Özel Notlar</h4>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleUpdateNotes(selectedCustomer.uid, selectedCustomer.notes || '')}
                    className="btn-gradient h-8 px-4 rounded-lg text-xs"
                  >
                    Kaydet
                  </Button>
                </div>
                <Textarea 
                  value={selectedCustomer.notes || ''}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, notes: e.target.value })}
                  placeholder="Müşteri hakkında notlar ekleyin..."
                  className="min-h-[150px] bg-white/5 border-white/10 text-white rounded-xl focus:ring-brand-pink/50"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="glass border-white/10 rounded-3xl h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
            <User className="w-16 h-16 text-white/10" />
            <h3 className="text-xl font-medium">Müşteri Seçilmedi</h3>
            <p className="text-white/60">Detayları görmek için soldaki listeden bir müşteri seçin.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
