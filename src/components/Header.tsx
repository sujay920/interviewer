import { LogOut, BarChart3, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  currentView: 'dashboard' | 'session' | 'feedback';
  onViewChange: (view: 'dashboard') => void;
}

export function Header({ currentView, onViewChange }: HeaderProps) {
  const { profile, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onViewChange('dashboard')}
            className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition"
          >
            <BarChart3 className="w-7 h-7 text-blue-600" />
            AI Interview Coach
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <User className="w-5 h-5" />
              <span className="font-medium">{profile?.full_name || profile?.email}</span>
            </div>

            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
