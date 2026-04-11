
import React from 'react';
import { AppView } from '../types';
import { User } from '../firebase';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  user: User | null;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  user, 
  onLogout,
  isCollapsed,
  onToggleCollapse,
  theme,
  onToggleTheme
}) => {
  const navItems = [
    { id: AppView.DASHBOARD, icon: 'dashboard', label: 'Dashboard' },
    { id: AppView.TASKS, icon: 'view_kanban', label: 'Tasks' },
    { id: AppView.WELLNESS, icon: 'favorite', label: 'Wellness' },
    { id: AppView.LOGS, icon: 'schedule', label: 'Work Log' },
    { id: AppView.FOCUS, icon: 'timer', label: 'Focus Timer' },
    { id: AppView.SETTINGS, icon: 'settings', label: 'Settings' },
  ];

  return (
    <aside className={`hidden lg:flex flex-col border-r border-border-dark bg-background-dark transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex h-full flex-col justify-between p-4">
        <div className="flex flex-col gap-8">
          <div className={`flex items-center pt-2 ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-primary/20 text-primary shrink-0">
                <span className="material-symbols-outlined text-2xl">spa</span>
              </div>
              {!isCollapsed && <span className="font-black text-xl tracking-tighter text-text-main">ZENFLOW</span>}
            </div>
            {!isCollapsed && (
              <button 
                onClick={onToggleCollapse}
                className="text-text-secondary hover:text-text-main transition-colors"
              >
                <span className="material-symbols-outlined">menu_open</span>
              </button>
            )}
          </div>

          {isCollapsed && (
            <button 
              onClick={onToggleCollapse}
              className="flex items-center justify-center size-12 rounded-xl text-text-secondary hover:bg-surface-dark hover:text-text-main transition-all"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          )}

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-4 h-12 rounded-xl transition-all duration-200 ${
                  isCollapsed ? 'justify-center w-12' : 'px-4 w-full'
                } ${
                  currentView === item.id
                    ? 'bg-border-dark text-primary shadow-lg shadow-black/20'
                    : 'text-text-secondary hover:bg-surface-dark hover:text-text-main'
                }`}
              >
                <span className="material-symbols-outlined text-[24px] shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className={`flex flex-col gap-4 ${isCollapsed ? 'items-center' : 'px-2'}`}>
          <button 
            onClick={onToggleTheme}
            className={`flex items-center gap-4 text-text-secondary hover:text-primary transition-colors ${isCollapsed ? 'justify-center p-2' : 'px-2 py-1'}`}
            title={isCollapsed ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : undefined}
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            {!isCollapsed && <span className="font-bold text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="size-10 rounded-full bg-cover bg-center border border-border-dark shrink-0" style={{ backgroundImage: `url(${user?.photoURL || 'https://picsum.photos/seed/user/100'})` }}></div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-text-main truncate">{user?.displayName || 'User'}</span>
                <span className="text-[10px] text-text-secondary truncate">{user?.email}</span>
              </div>
            )}
          </div>
          <button 
            onClick={onLogout}
            className={`flex items-center gap-4 text-text-secondary hover:text-red-400 transition-colors ${isCollapsed ? 'justify-center p-2' : 'px-2 py-1'}`}
            title={isCollapsed ? "Logout" : undefined}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            {!isCollapsed && <span className="font-bold text-sm">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
