import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, updateDoc, doc, OperationType, handleFirestoreError, query, orderBy } from '../lib/firebase';
import { Appointment } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Clock, User, CheckCircle2, XCircle, CreditCard, Banknote, Landmark, ArrowUpDown, Eye, Mail, Phone, FileText, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AppointmentManagementProps {
  staffId?: string;
}

export function AppointmentManagement({ staffId }: AppointmentManagementProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);

  useEffect(() => {
    let q = query(collection(db, 'appointments'), orderBy('createdAt', sortOrder));
    
    if (staffId) {
      q = query(
        collection(db, 'appointments'), 
        where('staffId', '==', staffId),
        orderBy('createdAt', sortOrder)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
    });
    return () => unsubscribe();
  }, [sortOrder, staffId]);

  const handleStatusUpdate = async (id: string, status: Appointment['status'], paymentStatus?: Appointment['paymentStatus']) => {
    try {
      const updateData: any = { status };
      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      
      await updateDoc(doc(db, 'appointments', id), updateData);
      toast.success('Randevu güncellendi.');
      if (selectedApp?.id === id) {
        setSelectedApp({ ...selectedApp, ...updateData });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'appointments');
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'stripe': return <CreditCard className="w-4 h-4" />;
      case 'transfer': return <Landmark className="w-4 h-4" />;
      case 'cash': return <Banknote className="w-4 h-4" />;
      default: return null;
    }
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`).getTime();
    const dateB = new Date(`${b.date}T${b.time}`).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gradient">Randevu Yönetimi</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="glass border-white/10 text-white"
        >
          <ArrowUpDown className="w-4 h-4 mr-2" />
          {sortOrder === 'asc' ? 'Eskiden Yeniye' : 'Yeniden Eskiye'}
        </Button>
      </div>
      
      <div className="grid gap-4">
        {sortedAppointments.length === 0 ? (
          <div className="glass p-12 rounded-3xl text-center space-y-4">
            <Calendar className="w-12 h-12 text-white/20 mx-auto" />
            <h3 className="text-xl font-medium">Henüz Randevu Yok</h3>
          </div>
        ) : (
          sortedAppointments.map((app) => (
            <Card key={app.id} className="glass border-white/10 overflow-hidden hover:border-brand-pink/30 transition-colors">
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-pink/20 flex items-center justify-center shrink-0">
                    <User className="text-brand-pink w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg text-white">{app.userName}</h4>
                    <p className="text-white/60 text-sm flex items-center gap-2">
                      <span className="text-brand-purple font-medium">{app.serviceName}</span>
                      <span>•</span>
                      <span>{app.staffName}</span>
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-white/40 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(app.date), 'dd MMMM yyyy', { locale: tr })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {app.time}
                      </span>
                      <span className="flex items-center gap-1 text-brand-pink">
                        {getPaymentIcon(app.paymentMethod)}
                        {app.paymentMethod === 'stripe' ? 'Kredi Kartı' : app.paymentMethod === 'transfer' ? 'Havale' : 'Elden'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-col items-end gap-2 mr-4">
                    <Badge className={cn(
                      "rounded-full px-4 py-1",
                      app.status === 'confirmed' ? "bg-green-500/20 text-green-500 border-green-500/30" :
                      app.status === 'cancelled' ? "bg-red-500/20 text-red-500 border-red-500/30" :
                      "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                    )}>
                      {app.status === 'confirmed' ? 'Onaylandı' : 
                       app.status === 'cancelled' ? 'İptal Edildi' : 'Beklemede'}
                    </Badge>
                    <Badge variant="outline" className={cn(
                      "text-[10px] border-white/10",
                      app.paymentStatus === 'paid' ? "text-green-400" : "text-yellow-400"
                    )}>
                      {app.paymentStatus === 'paid' ? 'Ödendi' : 'Ödeme Bekliyor'}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => setSelectedApp(app)}
                      className="text-white/60 hover:text-white hover:bg-white/10"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {app.status !== 'confirmed' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusUpdate(app.id!, 'confirmed', 'paid')}
                        className="bg-green-600 hover:bg-green-700 text-white h-9 px-4 rounded-lg"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Onayla
                      </Button>
                    )}
                    {app.status !== 'cancelled' && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleStatusUpdate(app.id!, 'cancelled')}
                        className="text-red-400 hover:text-red-500 hover:bg-red-500/10 h-9 px-4 rounded-lg"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        İptal
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="glass-dark border-white/10 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gradient">Randevu Detayları</DialogTitle>
            <DialogDescription className="text-white/60">
              Randevu ve müşteri hakkında detaylı bilgiler.
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-white/40 uppercase tracking-wider">Müşteri</p>
                  <p className="font-bold text-lg">{selectedApp.userName}</p>
                  <div className="flex flex-col gap-1 pt-1">
                    <a href={`mailto:${selectedApp.userEmail}`} className="text-xs text-brand-pink flex items-center gap-1 hover:underline">
                      <Mail className="w-3 h-3" /> {selectedApp.userEmail}
                    </a>
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs text-white/40 uppercase tracking-wider">Durum</p>
                  <Badge className={cn(
                    "rounded-full px-3 py-0.5",
                    selectedApp.status === 'confirmed' ? "bg-green-500/20 text-green-500 border-green-500/30" :
                    selectedApp.status === 'cancelled' ? "bg-red-500/20 text-red-500 border-red-500/30" :
                    "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                  )}>
                    {selectedApp.status === 'confirmed' ? 'Onaylandı' : 
                     selectedApp.status === 'cancelled' ? 'İptal Edildi' : 'Beklemede'}
                  </Badge>
                </div>
              </div>

              <div className="glass p-4 rounded-xl border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-purple/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-brand-purple" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Hizmet</p>
                      <p className="font-medium">{selectedApp.serviceName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40">Personel</p>
                    <p className="font-medium">{selectedApp.staffName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-pink" />
                    <span className="text-sm">{format(new Date(selectedApp.date), 'dd MMMM yyyy', { locale: tr })}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Clock className="w-4 h-4 text-brand-pink" />
                    <span className="text-sm">{selectedApp.time}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-white/40 uppercase tracking-wider">Ödeme Bilgisi</p>
                <div className="flex items-center justify-between glass p-3 rounded-lg border-white/10">
                  <div className="flex items-center gap-2">
                    {getPaymentIcon(selectedApp.paymentMethod)}
                    <span className="text-sm">
                      {selectedApp.paymentMethod === 'stripe' ? 'Kredi Kartı' : selectedApp.paymentMethod === 'transfer' ? 'Havale' : 'Elden'}
                    </span>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[10px] border-white/10",
                    selectedApp.paymentStatus === 'paid' ? "text-green-400" : "text-yellow-400"
                  )}>
                    {selectedApp.paymentStatus === 'paid' ? 'Ödendi' : 'Ödeme Bekliyor'}
                  </Badge>
                </div>
              </div>

              {selectedApp.notes && (
                <div className="space-y-2">
                  <p className="text-xs text-white/40 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Randevu Notu
                  </p>
                  <p className="text-sm text-white/70 bg-white/5 p-3 rounded-lg border border-white/5 italic">
                    "{selectedApp.notes}"
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {selectedApp.status !== 'confirmed' && (
                  <Button 
                    onClick={() => handleStatusUpdate(selectedApp.id!, 'confirmed', 'paid')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                  >
                    Onayla
                  </Button>
                )}
                {selectedApp.status !== 'cancelled' && (
                  <Button 
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedApp.id!, 'cancelled')}
                    className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl"
                  >
                    İptal Et
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
