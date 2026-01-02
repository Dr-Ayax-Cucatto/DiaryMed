import { LayoutDashboard, Users, BookOpen, Target, LogOut, HeartPulse } from 'lucide-react';
import { blink } from '../../lib/blink';
import type { BlinkUser } from '@blinkdotnew/sdk';
import { cn } from '../../lib/utils';

interface SidebarProps {
  currentPage: 'dashboard' | 'patients' | 'reflections' | 'goals';
  setCurrentPage: (page: 'dashboard' | 'patients' | 'reflections' | 'goals') => void;
  user: BlinkUser;
}

export function Sidebar({ currentPage, setCurrentPage, user }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'patients', icon: Users, label: 'Pacientes' },
    { id: 'reflections', icon: BookOpen, label: 'Reflexiones' },
    { id: 'goals', icon: Target, label: 'Metas' },
  ] as const;

  return (
    <aside className="w-64 h-full border-r bg-sidebar flex flex-col">
      <div className="p-6 border-b flex items-center gap-3">
        <HeartPulse className="text-primary w-8 h-8" />
        <span className="font-serif font-bold text-xl text-primary">MediTrack</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              currentPage === item.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t space-y-4">
        <div className="px-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              user.displayName?.[0] || 'D'
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-medium text-sm truncate">{user.displayName || 'Doctor'}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        
        <button
          onClick={() => blink.auth.signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
