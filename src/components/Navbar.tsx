import { useState } from 'react';
import {
  auth,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signInWithPopup,
  signOut,
  updateProfile,
} from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LogIn, LogOut, Mail, Sparkles } from 'lucide-react';
import { useAuthState } from '../hooks/useAuthState';

export function Navbar() {
  const { user } = useAuthState();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const getAuthErrorMessage = (error: unknown) => {
    const code = (error as { code?: string })?.code;
    switch (code) {
      case 'auth/unauthorized-domain':
        return 'Bu domain Firebase yetkili değil. Firebase Console > Authentication > Settings > Authorized domains içine bu domaini ekleyin.';
      case 'auth/popup-blocked':
        return 'Popup engellendi. Tarayıcı popup izni verin veya yeniden deneyin.';
      case 'auth/popup-closed-by-user':
        return 'Google penceresi kapatıldığı için giriş tamamlanamadı.';
      case 'auth/invalid-credential':
        return 'Geçersiz giriş bilgisi. E-posta/şifreyi kontrol edin.';
      case 'auth/user-not-found':
        return 'Bu e-posta için kullanıcı bulunamadı. Önce kayıt olmayı deneyin.';
      case 'auth/wrong-password':
        return 'Şifre hatalı. Tekrar deneyin.';
      case 'auth/email-already-in-use':
        return 'Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.';
      case 'auth/weak-password':
        return 'Şifre çok zayıf. En az 6 karakter kullanın.';
      case 'auth/operation-not-allowed':
        return 'Bu giriş yöntemi Firebase Console içinde aktif değil.';
      default:
        return `Giriş başarısız. ${code ? `(${code})` : ''}`.trim();
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
      setIsAuthOpen(false);
    } catch (error) {
      const code = (error as { code?: string })?.code;
      // Fallback for popup-restricted environments (mobile/Safari/some browsers)
      if (code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          setAuthError(getAuthErrorMessage(redirectError));
          console.error('Google redirect error:', redirectError);
          return;
        }
      }
      setAuthError(getAuthErrorMessage(error));
      console.error('Google login error:', error);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError('');

    if (!email || !password) {
      setAuthError('E-posta ve şifre zorunludur.');
      return;
    }

    if (isRegisterMode && !displayName.trim()) {
      setAuthError('Kayıt için ad soyad zorunludur.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegisterMode) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: displayName.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      setIsAuthOpen(false);
      setDisplayName('');
      setEmail('');
      setPassword('');
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
      console.error('Email auth error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass rounded-2xl px-6 py-3 border-white/10 shadow-[0_0_30px_rgba(255,0,128,0.1)]">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-pink to-brand-purple flex items-center justify-center shadow-[0_0_20px_rgba(255,0,128,0.4)]">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
            Işıltı & Zarafet
          </span>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-white">{user.displayName}</p>
                  <p className="text-xs text-white/60">{user.email}</p>
                </div>
                <Avatar className="border-2 border-brand-pink/50">
                  <AvatarImage src={user.photoURL || ''} />
                  <AvatarFallback className="bg-brand-purple text-white">
                    {user.displayName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setIsAuthOpen(true)}
              className="btn-gradient rounded-xl px-6"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Giriş Yap
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="glass-dark border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {isRegisterMode ? 'Hesap Oluştur' : 'Giriş Yap'}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Google ile tek tık giriş yapabilir veya e-posta/şifre kullanabilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-lg p-2">
            Not: Google giriş kapanıyorsa Firebase tarafında authorized domain ayarı eksik olabilir.
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white text-black hover:bg-white/90"
            >
              Google ile Devam Et
            </Button>

            <div className="relative py-1">
              <div className="border-t border-white/10" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#141824] px-2 text-xs text-white/50">
                veya
              </span>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              {isRegisterMode && (
                <Input
                  type="text"
                  placeholder="Ad Soyad"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              )}

              <Input
                type="email"
                placeholder="E-posta"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />

              <Input
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />

              {authError && (
                <p className="text-xs text-rose-300">{authError}</p>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full btn-gradient rounded-xl">
                <Mail className="w-4 h-4 mr-2" />
                {isSubmitting ? 'İşleniyor...' : isRegisterMode ? 'Kayıt Ol' : 'E-posta ile Giriş'}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => {
                setAuthError('');
                setIsRegisterMode((prev) => !prev);
              }}
              className="w-full text-xs text-white/70 hover:text-white"
            >
              {isRegisterMode ? 'Zaten hesabım var, giriş yap' : 'Hesabım yok, kayıt ol'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
