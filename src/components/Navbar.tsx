import { auth, googleProvider, signInWithPopup, signOut } from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogIn, LogOut, Calendar, User, Sparkles } from 'lucide-react';
import { useAuthState } from '../hooks/useAuthState';

export function Navbar() {
  const { user } = useAuthState();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
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
              onClick={handleLogin}
              className="btn-gradient rounded-xl px-6"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Giriş Yap
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
