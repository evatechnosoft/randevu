import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ServiceCard } from './components/ServiceCard';
import { BookingModal } from './components/BookingModal';
import { StaffManagement } from './components/StaffManagement';
import { CustomerDatabase } from './components/CustomerDatabase';
import { AppointmentManagement } from './components/AppointmentManagement';
import { RoomManagement } from './components/RoomManagement';
import { Announcements } from './components/Announcements';
import { Service, Appointment, UserProfile, Announcement } from './types';
import { db, collection, onSnapshot, query, where, auth, doc, getDoc, setDoc } from './lib/firebase';
import { useAuthState } from './hooks/useAuthState';
import { Toaster } from '@/components/ui/sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar as CalendarIcon, History, Share2, Instagram, Facebook, LayoutDashboard, Users, UserCog, Landmark, Megaphone } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const ADMIN_EMAILS = ['deancjx@gmail.com', 'xdeancjx@gmail.com', 'eralp.yildiz@layersup.com'];

const MOCK_SERVICES: Service[] = [
  {
    id: '1',
    name: 'Protez Tırnak',
    category: 'nails',
    price: 450,
    duration: 90,
    description: 'Dayanıklı ve estetik protez tırnak uygulaması ile elleriniz her zaman bakımlı görünsün.',
    imageUrl: 'https://images.pexels.com/photos/704815/pexels-photo-704815.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    id: '2',
    name: 'HydraFacial Cilt Bakımı',
    category: 'skin',
    price: 600,
    duration: 60,
    description: 'Cildinizi derinlemesine temizleyen, nemlendiren ve canlandıran profesyonel bakım.',
    imageUrl: 'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    id: '3',
    name: 'Aromaterapi Masajı',
    category: 'massage',
    price: 500,
    duration: 50,
    description: 'Esansiyel yağlar ile ruhunuzu ve bedeninizi dinlendiren huzur dolu bir deneyim.',
    imageUrl: 'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    id: '4',
    name: 'Kalıcı Oje',
    category: 'nails',
    price: 250,
    duration: 45,
    description: 'Haftalarca bozulmayan, parlak ve pürüzsüz tırnaklar için kalıcı oje uygulaması.',
    imageUrl: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    id: '5',
    name: 'Anti-Aging Bakım',
    category: 'skin',
    price: 750,
    duration: 75,
    description: 'Yaşlanma belirtilerine karşı cildi sıkılaştıran ve yenileyen özel terapi.',
    imageUrl: 'https://images.pexels.com/photos/5069431/pexels-photo-5069431.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    id: '6',
    name: 'Sıcak Taş Masajı',
    category: 'massage',
    price: 650,
    duration: 70,
    description: 'Isıtılmış taşlar ile kas gerginliğini azaltan ve derin gevşeme sağlayan masaj.',
    imageUrl: 'https://images.pexels.com/photos/3865556/pexels-photo-3865556.jpeg?auto=compress&cs=tinysrgb&w=1200'
  }
];

export default function App() {
  const { user, loading: authLoading } = useAuthState();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    });
    return () => unsubAnnouncements();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setUserAppointments([]);
      return;
    }

    const fetchProfile = async () => {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || 'Anonim',
          email: user.email || '',
          photoURL: user.photoURL || '',
          role: 'client',
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, newProfile);
        setUserProfile(newProfile);
      }
    };
    fetchProfile();

    const q = query(collection(db, 'appointments'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setUserAppointments(appointments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });

    return () => unsubscribe();
  }, [user]);

  const handleBook = (service: Service) => {
    if (!user) {
      alert('Randevu almak için lütfen giriş yapın.');
      return;
    }
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Işıltı & Zarafet',
          text: 'Harika bir bakım için hemen randevu al!',
          url: window.location.href,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    }
  };

  const filteredServices = activeTab === 'all' 
    ? MOCK_SERVICES 
    : MOCK_SERVICES.filter(s => s.category === activeTab);

  const isAdmin =
    userProfile?.role === 'admin' ||
    (user?.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false);

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-pink/20 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -40, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-purple/20 blur-[150px] rounded-full"
        />
        <motion.div
          animate={{
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full"
        />
      </div>

      <Navbar />
      <Toaster position="top-center" richColors />

      <main className="max-w-7xl mx-auto px-6 pt-32 space-y-12">
        {/* Announcements Section */}
        {announcements.length > 0 && (
          <div className="space-y-4">
            {announcements.filter(a => a.isActive).map(a => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-4 rounded-2xl border-brand-pink/30 bg-brand-pink/5 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-brand-pink/20 flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5 text-brand-pink" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{a.title}</h4>
                  <p className="text-sm text-white/70">{a.content}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Hero Section */}
        <section className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="bg-brand-pink/20 text-brand-pink border-brand-pink/30 px-4 py-1 rounded-full mb-4">
              Yeni Nesil Güzellik Deneyimi
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Kendini <span className="text-gradient">Şımartmanın</span> <br /> Tam Zamanı
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto mt-6">
              Lüks tırnak tasarımı, profesyonel cilt bakımı ve dinlendirici masaj hizmetlerimizle 
              size özel bir güzellik yolculuğu sunuyoruz.
            </p>
          </motion.div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Button onClick={handleShare} variant="outline" className="glass border-white/10 rounded-xl">
              <Share2 className="w-4 h-4 mr-2" />
              Paylaş
            </Button>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" className="text-white/60 hover:text-brand-pink">
                <Instagram className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" className="text-white/60 hover:text-brand-purple">
                <Facebook className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

        <Tabs defaultValue="services" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="glass border-white/10 p-1 rounded-2xl">
              <TabsTrigger value="services" className="rounded-xl px-8 data-[state=active]:bg-brand-pink data-[state=active]:text-white">
                Hizmetler
              </TabsTrigger>
              <TabsTrigger value="my-appointments" className="rounded-xl px-8 data-[state=active]:bg-brand-purple data-[state=active]:text-white">
                Randevularım
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:text-black">
                  Admin Panel
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="services" className="space-y-8">
            <div className="flex justify-center gap-2 flex-wrap">
              {['all', 'nails', 'skin', 'massage'].map((cat) => (
                <Button
                  key={cat}
                  variant={activeTab === cat ? 'default' : 'outline'}
                  onClick={() => setActiveTab(cat)}
                  className={cn(
                    "rounded-full px-6 transition-all",
                    activeTab === cat 
                      ? "bg-white text-black hover:bg-white/90" 
                      : "glass border-white/10 text-white hover:bg-white/10"
                  )}
                >
                  {cat === 'all' ? 'Hepsi' : cat === 'nails' ? 'Tırnak' : cat === 'skin' ? 'Cilt Bakımı' : 'Masaj'}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredServices.map((service) => (
                  <ServiceCard 
                    key={service.id} 
                    service={service} 
                    onBook={handleBook} 
                  />
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="my-appointments">
            <div className="max-w-3xl mx-auto space-y-6">
              {!user ? (
                <div className="glass p-12 rounded-3xl text-center space-y-4">
                  <History className="w-12 h-12 text-white/20 mx-auto" />
                  <h3 className="text-xl font-medium">Giriş Yapılmadı</h3>
                  <p className="text-white/60">Randevularınızı görmek için lütfen giriş yapın.</p>
                </div>
              ) : userAppointments.length === 0 ? (
                <div className="glass p-12 rounded-3xl text-center space-y-4">
                  <CalendarIcon className="w-12 h-12 text-white/20 mx-auto" />
                  <h3 className="text-xl font-medium">Henüz Randevunuz Yok</h3>
                  <p className="text-white/60">Hemen bir hizmet seçip randevu alabilirsiniz.</p>
                </div>
              ) : (
                userAppointments.map((app) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass p-6 rounded-2xl flex items-center justify-between border-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-brand-pink/20 flex items-center justify-center">
                        <Sparkles className="text-brand-pink w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{app.serviceName}</h4>
                        <p className="text-white/60 text-sm">
                          {format(new Date(app.date), 'dd MMMM yyyy', { locale: tr })} • {app.time}
                        </p>
                        <p className="text-xs text-white/40">Personel: {app.staffName}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge className={cn(
                        "rounded-full px-4 py-1",
                        app.status === 'confirmed' ? "bg-green-500/20 text-green-500 border-green-500/30" :
                        app.status === 'cancelled' ? "bg-red-500/20 text-red-500 border-red-500/30" :
                        "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                      )}>
                        {app.status === 'confirmed' ? 'Onaylandı' : 
                         app.status === 'cancelled' ? 'İptal Edildi' : 'Beklemede'}
                      </Badge>
                      <p className="text-[10px] text-white/30">Ödeme: {app.paymentStatus === 'paid' ? 'Tamamlandı' : 'Bekliyor'}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <Tabs defaultValue="appointments" className="w-full">
                <div className="flex justify-center mb-8">
                  <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
                    <TabsTrigger value="appointments" className="rounded-lg data-[state=active]:bg-brand-pink">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Randevular
                    </TabsTrigger>
                    <TabsTrigger value="rooms" className="rounded-lg data-[state=active]:bg-brand-pink">
                      <Landmark className="w-4 h-4 mr-2" />
                      Odalar & Masalar
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="rounded-lg data-[state=active]:bg-brand-purple">
                      <UserCog className="w-4 h-4 mr-2" />
                      Personel
                    </TabsTrigger>
                    <TabsTrigger value="customers" className="rounded-lg data-[state=active]:bg-brand-purple">
                      <Users className="w-4 h-4 mr-2" />
                      Müşteriler
                    </TabsTrigger>
                    <TabsTrigger value="announcements" className="rounded-lg data-[state=active]:bg-brand-purple">
                      <Megaphone className="w-4 h-4 mr-2" />
                      Duyurular
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="appointments">
                  <AppointmentManagement />
                </TabsContent>
                <TabsContent value="rooms">
                  <RoomManagement />
                </TabsContent>
                <TabsContent value="staff">
                  <StaffManagement />
                </TabsContent>
                <TabsContent value="customers">
                  <CustomerDatabase />
                </TabsContent>
                <TabsContent value="announcements">
                  <Announcements />
                </TabsContent>
              </Tabs>
            </TabsContent>
          )}
        </Tabs>
      </main>

      <BookingModal 
        service={selectedService} 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
      />
    </div>
  );
}
