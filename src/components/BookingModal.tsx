import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, CheckCircle2, MessageCircle, Sparkles, CreditCard, Banknote, Landmark } from 'lucide-react';
import { Service, Appointment, Staff, Room } from '../types';
import { auth, db, addDoc, collection, OperationType, handleFirestoreError, onSnapshot, query, where } from '../lib/firebase';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const BANK_DETAILS = {
  bankName: "Örnek Banka",
  accountHolder: "Işıltı & Zarafet Güzellik Merkezi",
  iban: "TR00 0000 0000 0000 0000 0000 00"
};

interface BookingModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
}

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

const TR_DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const EN_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type Step = 'datetime' | 'staff' | 'payment-method' | 'payment-info' | 'success';

export function BookingModal({ service, isOpen, onClose }: BookingModalProps) {
  const [step, setStep] = useState<Step>('datetime');
  const [date, setDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookedStaffIds, setBookedStaffIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<Appointment['paymentMethod'] | null>(null);

  const getScheduleByDate = (weeklySchedule: Record<string, { start: string; end: string; isOpen: boolean }> | undefined, targetDate: Date) => {
    if (!weeklySchedule) return undefined;

    const dayIndex = targetDate.getDay();
    const keysToTry = [
      TR_DAY_NAMES[dayIndex],
      EN_DAY_NAMES[dayIndex],
      format(targetDate, 'EEEE', { locale: tr }),
      format(targetDate, 'EEEE'),
    ];

    for (const key of keysToTry) {
      const schedule = weeklySchedule[key];
      if (schedule) return schedule;
    }

    return undefined;
  };

  useEffect(() => {
    if (isOpen) {
      setStep('datetime');
      setDate(undefined);
      setSelectedTime(undefined);
      setSelectedStaff(null);
      setPaymentMethod(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (service && isOpen) {
      const qStaff = query(collection(db, 'staff'), where('isActive', '==', true));
      const unsubStaff = onSnapshot(qStaff, (snapshot) => {
        const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
        setStaffList(staff.filter(s => s.specialties.includes(service.category)));
      });

      const qRooms = query(collection(db, 'rooms'), where('isActive', '==', true), where('type', '==', service.category));
      const unsubRooms = onSnapshot(qRooms, (snapshot) => {
        setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room)));
      });

      return () => {
        unsubStaff();
        unsubRooms();
      };
    }
  }, [service, isOpen]);

  useEffect(() => {
    if (date && selectedTime && isOpen) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const q = query(
        collection(db, 'appointments'),
        where('date', '==', dateStr),
        where('time', '==', selectedTime),
        where('status', '!=', 'cancelled')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bookedIds = snapshot.docs.map(doc => (doc.data() as Appointment).staffId).filter(Boolean) as string[];
        setBookedStaffIds(bookedIds);
      });
      return () => unsubscribe();
    } else {
      setBookedStaffIds([]);
    }
  }, [date, selectedTime, isOpen]);

  const handleManualBooking = async () => {
    if (!auth.currentUser || !date || !selectedTime || !service || !paymentMethod) return;

    setIsSubmitting(true);
    
    // Find an available room
    const availableRoom = rooms.find(room => {
      const schedule = getScheduleByDate(room.weeklySchedule, date);
      return schedule && schedule.isOpen && selectedTime >= schedule.start && selectedTime < schedule.end;
    });

    const appointment: Appointment = {
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Anonim',
      userEmail: auth.currentUser.email || '',
      serviceId: service.id,
      serviceName: service.name,
      staffId: selectedStaff?.id || 'auto',
      staffName: selectedStaff?.name || 'Otomatik Atama',
      roomId: availableRoom?.id || 'auto',
      roomName: availableRoom?.name || 'Otomatik Atama',
      date: format(date, 'yyyy-MM-dd'),
      time: selectedTime,
      status: 'pending',
      paymentMethod,
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'appointments'), appointment);
      setStep('success');
      toast.success('Randevu talebiniz başarıyla oluşturuldu!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'appointments');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    if (!service || !date || !selectedTime) return;
    const paymentText = paymentMethod === 'cash' ? 'Elden' : paymentMethod === 'transfer' ? 'Havale' : 'Belirtilmedi';
    const message = `Merhaba, ${service.name} için ${format(date, 'dd MMMM yyyy', { locale: tr })} tarihinde saat ${selectedTime} için randevum oluşturuldu. Ödeme Yöntemi: ${paymentText}. Personel: ${selectedStaff?.name || 'Otomatik'}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/905000000000?text=${encodedMessage}`, '_blank');
  };

  const isSlotAvailable = (time: string) => {
    if (!date || !service) return false;

    // If rooms are not configured yet, do not block booking at slot level.
    const hasAvailableRoom = rooms.length === 0
      ? true
      : rooms.some(room => {
          const schedule = getScheduleByDate(room.weeklySchedule, date);
          if (!schedule || !schedule.isOpen) return false;
          return time >= schedule.start && time < schedule.end;
        });

    if (!hasAvailableRoom) return false;

    // If staff is not configured yet, auto-assignment still allows flow to continue.
    const hasAvailableStaff = staffList.length === 0
      ? true
      : staffList.some(staff => {
          const schedule = getScheduleByDate(staff.weeklySchedule, date);
          if (!schedule || !schedule.isOpen) return false;
          return time >= schedule.start && time < schedule.end;
        });

    return hasAvailableStaff;
  };

  const getStaffStatus = (staff: Staff) => {
    if (!date || !selectedTime) return 'unknown';
    const schedule = getScheduleByDate(staff.weeklySchedule, date);
    
    if (!schedule || !schedule.isOpen || selectedTime < schedule.start || selectedTime >= schedule.end) {
      return 'off';
    }

    if (bookedStaffIds.includes(staff.id)) {
      return 'busy';
    }

    return 'available';
  };

  const handleNextFromMethod = () => {
    if (!paymentMethod) {
      toast.error('Lütfen ödeme yöntemi seçin.');
      return;
    }

    if (paymentMethod === 'transfer') {
      setStep('payment-info');
    } else {
      handleManualBooking();
    }
  };

  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-dark border-white/10 text-white sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient">{service.name}</DialogTitle>
          <DialogDescription className="text-white/60">
            {step === 'datetime' && 'Lütfen tarih ve saat seçin.'}
            {step === 'staff' && 'Tercih ettiğiniz personeli seçin.'}
            {step === 'payment-method' && 'Ödeme yöntemi seçin.'}
            {step === 'payment-info' && 'Havale bilgilerini not edin.'}
            {step === 'success' && 'Randevunuz oluşturuldu!'}
          </DialogDescription>
        </DialogHeader>

        {step === 'datetime' && (
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Tarih Seçin</label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    "w-full inline-flex h-10 items-center rounded-md border border-white/10 bg-white/5 px-3 text-left text-sm font-normal text-white hover:bg-white/10",
                    !date && "text-white/40"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-brand-pink" />
                  {date ? format(date, "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass-dark border-white/10" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date() || date.getDay() === 0}
                    className="text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Saat Seçin</label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const available = isSlotAvailable(slot);
                  return (
                    <Button
                      key={slot}
                      variant="outline"
                      size="sm"
                      disabled={!available}
                      onClick={() => setSelectedTime(slot)}
                      className={cn(
                        "bg-white/5 border-white/10 hover:bg-white/10 text-white text-xs",
                        selectedTime === slot && "bg-brand-pink border-brand-pink text-white hover:bg-brand-pink",
                        !available && "opacity-20 grayscale cursor-not-allowed"
                      )}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {slot}
                    </Button>
                  );
                })}
              </div>
            </div>
            <Button 
              disabled={!date || !selectedTime} 
              onClick={() => setStep('staff')}
              className="w-full btn-gradient rounded-xl"
            >
              Devam Et
            </Button>
          </div>
        )}

        {step === 'staff' && (
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <Button
                variant="outline"
                disabled={staffList.length > 0 && staffList.every(s => getStaffStatus(s) !== 'available')}
                onClick={() => setSelectedStaff(null)}
                className={cn(
                  "w-full justify-start h-16 glass border-white/10 text-white",
                  selectedStaff === null && "border-brand-pink bg-brand-pink/10"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-3">
                  <Sparkles className="w-5 h-5 text-brand-pink" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Otomatik Atama</p>
                  <p className="text-xs text-white/60">En uygun personel atansın</p>
                </div>
                {staffList.length > 0 && staffList.every(s => getStaffStatus(s) !== 'available') && (
                  <Badge variant="outline" className="bg-red-500/20 text-red-500 border-red-500/30">Dolu</Badge>
                )}
              </Button>

              {staffList.map((staff) => {
                const status = getStaffStatus(staff);
                const isBusy = status === 'busy';
                const isOff = status === 'off';
                
                return (
                  <Button
                    key={staff.id}
                    variant="outline"
                    disabled={isBusy || isOff}
                    onClick={() => setSelectedStaff(staff)}
                    className={cn(
                      "w-full justify-start h-16 glass border-white/10 text-white",
                      selectedStaff?.id === staff.id && "border-brand-pink bg-brand-pink/10",
                      (isBusy || isOff) && "opacity-50 grayscale"
                    )}
                  >
                    <img
                      src={staff.imageUrl || `https://avatar.iran.liara.run/public/${staff.id}`}
                      alt={`${staff.name} profil resmi`}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.dataset.fallbackApplied === 'true') return;
                        target.dataset.fallbackApplied = 'true';
                        target.src = 'https://placehold.co/80x80/png?text=User';
                      }}
                      className="w-10 h-10 rounded-full mr-3 object-cover"
                    />
                    <div className="flex-1 text-left">
                      <p className="font-medium">{staff.name}</p>
                      <p className="text-xs text-white/60">
                        {isOff ? 'Çalışmıyor' : isBusy ? 'Dolu' : 'Müsait'}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "ml-2",
                        isBusy ? "bg-red-500/20 text-red-500 border-red-500/30" : 
                        isOff ? "bg-white/10 text-white/40 border-white/20" :
                        "bg-green-500/20 text-green-500 border-green-500/30"
                      )}
                    >
                      {isOff ? 'Mesai Dışı' : isBusy ? 'Dolu' : 'Müsait'}
                    </Badge>
                  </Button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep('datetime')} className="flex-1">Geri</Button>
              <Button 
                disabled={selectedStaff !== null && bookedStaffIds.includes(selectedStaff.id)}
                onClick={() => setStep('payment-method')} 
                className="flex-[2] btn-gradient rounded-xl"
              >
                Ödemeye Geç
              </Button>
            </div>
          </div>
        )}

        {step === 'payment-method' && (
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/40 px-1 uppercase tracking-wider">Ödeme Yöntemi Seçin</p>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setPaymentMethod('transfer')}
                    className={cn(
                      "justify-start h-16 glass border-white/10 text-white",
                      paymentMethod === 'transfer' && "border-brand-purple bg-brand-purple/10"
                    )}
                  >
                    <Landmark className="w-6 h-6 mr-3 text-brand-purple" />
                    <div className="text-left">
                      <p className="font-medium">Banka Havalesi</p>
                      <p className="text-xs text-white/60">IBAN ile ödeme yapın</p>
                    </div>
                    {paymentMethod === 'transfer' && (
                      <Badge variant="outline" className="ml-auto bg-brand-purple/20 text-brand-purple border-brand-purple/40">Seçili</Badge>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setPaymentMethod('cash')}
                    className={cn(
                      "justify-start h-16 glass border-white/10 text-white",
                      paymentMethod === 'cash' && "border-green-500 bg-green-500/10"
                    )}
                  >
                    <Banknote className="w-6 h-6 mr-3 text-green-500" />
                    <div className="text-left">
                      <p className="font-medium">Elden Ödeme</p>
                      <p className="text-xs text-white/60">Merkezimizde ödeme yapın</p>
                    </div>
                    {paymentMethod === 'cash' && (
                      <Badge variant="outline" className="ml-auto bg-green-500/20 text-green-400 border-green-500/40">Seçili</Badge>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep('staff')} className="flex-1">Geri</Button>
              <Button
                onClick={handleNextFromMethod}
                disabled={!paymentMethod}
                className="flex-[2] btn-gradient rounded-xl shadow-lg shadow-brand-pink/20"
              >
                Devam Et
              </Button>
            </div>
          </div>
        )}

        {step === 'payment-info' && (
          <div className="py-4 space-y-6">
            <div className="glass p-4 rounded-xl border-white/10 space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-white/40">Banka Adı</p>
                <p className="font-medium">{BANK_DETAILS.bankName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white/40">Alıcı Adı</p>
                <p className="font-medium">{BANK_DETAILS.accountHolder}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white/40">IBAN</p>
                <p className="font-mono text-sm break-all">{BANK_DETAILS.iban}</p>
              </div>
              <p className="text-xs text-brand-pink italic">
                * Lütfen açıklama kısmına adınızı ve randevu tarihinizi yazınız.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep('payment-method')} className="flex-1">Geri</Button>
              <Button onClick={handleManualBooking} disabled={isSubmitting} className="flex-[2] btn-gradient rounded-xl">
                {isSubmitting ? 'İşleniyor...' : 'Randevuyu Tamamla'}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-12 flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <DialogTitle className="text-2xl">Harika!</DialogTitle>
            <DialogDescription className="text-white/70">
              {paymentMethod === 'stripe' 
                ? 'Randevunuz başarıyla oluşturuldu ve ödemeniz alındı.' 
                : 'Randevu talebiniz alındı. Onay için sizinle iletişime geçeceğiz.'}
            </DialogDescription>
            <div className="flex flex-col w-full gap-2 pt-4">
              <Button onClick={handleWhatsApp} className="bg-green-600 hover:bg-green-700 text-white rounded-xl">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp ile Bilgi Al
              </Button>
              <Button variant="ghost" onClick={onClose} className="text-white/60 hover:text-white">
                Kapat
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
