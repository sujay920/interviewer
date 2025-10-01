import { LogOut, BarChart3, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  currentView: 'dashboard' | 'session' | 'feedback';
  onViewChange: (view: 'dashboard') => void;
}

export function Header({ onViewChange }: HeaderProps) {
  const { profile, signOut } = useAuth();

  return (
    <header className="glass-strong border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onViewChange('dashboard')}
            className="flex items-center gap-3 text-xl font-bold hover:scale-105 transition-transform duration-300"
          >
            <div className="w-10 h-10 glass rounded-xl flex items-center justify-center glow-blue">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-gradient-blue">AI Interview Coach</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl">
              <div className="w-8 h-8 glass rounded-lg flex items-center justify-center glow-cyan">
                <User className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-medium text-gray-300">{profile?.full_name || profile?.email}</span>
            </div>

            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 glass hover:glow-purple rounded-xl transition-all duration-300 group"
            >
              <LogOut className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
              <span className="font-medium text-gray-400 group-hover:text-purple-400 transition-colors">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
