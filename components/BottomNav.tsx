
import React from 'react';
import { AppView } from '../types';

interface BottomNavProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: AppView.DASHBOARD, icon: 'dashboard', label: 'Dash' },
    { id: AppView.TASKS, icon: 'view_kanban', label: 'Tasks' },
    { id: AppView.FOCUS, icon: 'timer', label: 'Focus' },
    { id: AppView.WELLNESS, icon: 'favorite', label: 'Well' },
    { id: AppView.SETTINGS, icon: 'settings', label: 'Set' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background-dark/80 backdrop-blur-lg border-t border-border-dark px-4 pb-safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            title={item.label}
            className={`flex flex-col items-center justify-center transition-all duration-200 relative ${
              currentView === item.id
                ? 'text-primary'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            <span className={`material-symbols-outlined text-[28px] ${currentView === item.id ? 'fill-1' : ''}`}>
              {item.icon}
            </span>
            {currentView === item.id && (
              <div className="absolute -bottom-2 size-1 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
