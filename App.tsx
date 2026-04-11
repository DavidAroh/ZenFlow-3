import React, { useState, useEffect } from 'react';
import { AppView, Task, WellnessEntry, WorkLog, AIInsight } from './types';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import FocusTimer from './components/FocusTimer';
import TaskBoard from './components/TaskBoard';
import TaskDetailModal from './components/TaskDetailModal';
import Settings from './components/Settings';
import WellnessHub from './components/WellnessHub';
import { gemini } from './services/geminiService';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  logOut, 
  onAuthStateChanged, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  Timestamp, 
  setDoc,
  getDoc,
  OperationType,
  handleFirestoreError,
  User,
  isFirebaseConfigured
} from './firebase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [wellness, setWellness] = useState<WellnessEntry[]>([]);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isWellnessModalOpen, setIsWellnessModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'dark';
  });
  const [authError, setAuthError] = useState<string | null>(null);

  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Auth Listener
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsAuthReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        // Ensure user profile exists in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: 'user'
            });
          }
        } catch (error) {
          console.error("Error checking user profile:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!user || !isAuthReady || !isFirebaseConfigured) return;

    const tasksQuery = query(collection(db, 'tasks'), where('authorUid', '==', user.uid));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(tasksData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tasks'));

    const logsQuery = query(collection(db, 'work_logs'), where('authorUid', '==', user.uid));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkLog));
      setLogs(logsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'work_logs'));

    const wellnessQuery = query(collection(db, 'wellness_entries'), where('authorUid', '==', user.uid));
    const unsubscribeWellness = onSnapshot(wellnessQuery, (snapshot) => {
      const wellnessData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data, 
          timestamp: data.timestamp?.toDate?.() || data.timestamp 
        } as WellnessEntry;
      });
      setWellness(wellnessData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'wellness_entries'));

    return () => {
      unsubscribeTasks();
      unsubscribeLogs();
      unsubscribeWellness();
    };
  }, [user, isAuthReady]);

  // AI Insights
  useEffect(() => {
    if (tasks.length > 0 || wellness.length > 0 || logs.length > 0) {
      const fetchInsight = async () => {
        const insight = await gemini.generateDailyInsight(tasks, wellness, logs);
        setAiInsight(insight);
      };
      fetchInsight();
    }
  }, [tasks, wellness, logs]);

  const handleUpdateTask = async (updatedTask: Task) => {
    if (!user || !isFirebaseConfigured) return;
    try {
      const taskRef = doc(db, 'tasks', updatedTask.id);
      await updateDoc(taskRef, { ...updatedTask });
      setSelectedTask(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${updatedTask.id}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user || !isFirebaseConfigured) return;
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
      setSelectedTask(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  const handleCreateTask = async (status: Task['status'] = 'todo') => {
    if (!user || !isFirebaseConfigured) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        title: 'New Task',
        description: '',
        stress: 'Low Stress',
        status: status,
        dueDate: 'Today',
        assignee: user.displayName || 'Me',
        authorUid: user.uid,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const handleLogWellness = async (entry: Omit<WellnessEntry, 'id' | 'timestamp' | 'authorUid'>) => {
    if (!user || !isFirebaseConfigured) return;
    try {
      await addDoc(collection(db, 'wellness_entries'), {
        ...entry,
        timestamp: Timestamp.now(),
        authorUid: user.uid
      });
      setIsWellnessModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'wellness_entries');
    }
  };

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Sign in error:", error);
      if (error.code === 'auth/configuration-not-found') {
        setAuthError("Google Sign-in is not enabled in your Firebase Console.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setAuthError("This domain is not authorized for Firebase Authentication.");
      } else {
        setAuthError(error.message || "An error occurred during sign in.");
      }
    }
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen w-full bg-background-dark flex items-center justify-center">
        <div className="animate-pulse text-primary font-black text-2xl">ZenFlow Loading...</div>
      </div>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="h-screen w-full bg-background-dark flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-surface-dark border border-border-dark p-12 rounded-3xl text-center shadow-2xl">
          <div className="size-20 bg-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <span className="material-symbols-outlined text-5xl">settings</span>
          </div>
          <h1 className="text-4xl font-black text-text-main mb-4">Firebase Configuration Required</h1>
          <p className="text-text-secondary mb-8 text-lg">The automated setup encountered a permission error. To use ZenFlow, please follow these steps:</p>
          
          <div className="text-left space-y-4 mb-12">
            <div className="flex gap-4">
              <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black shrink-0">1</div>
              <p className="text-text-main">Go to the <a href="https://console.firebase.google.com/" target="_blank" className="text-primary underline">Firebase Console</a> and create a project.</p>
            </div>
            <div className="flex gap-4">
              <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black shrink-0">2</div>
              <p className="text-text-main">Add a <b>Web App</b> and copy the configuration object.</p>
            </div>
            <div className="flex gap-4">
              <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black shrink-0">3</div>
              <p className="text-text-main">Open <b>firebase-applet-config.json</b> in the editor and paste your keys.</p>
            </div>
          </div>
          
          <p className="text-text-secondary text-sm italic">The app will automatically refresh once configured.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full bg-background-dark flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full bg-surface-dark border border-border-dark p-12 rounded-3xl text-center shadow-2xl">
          <div className="size-20 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mx-auto mb-8">
            <span className="material-symbols-outlined text-5xl">spa</span>
          </div>
          <h1 className="text-4xl font-black text-text-main mb-4">Welcome to ZenFlow</h1>
          <p className="text-text-secondary mb-12 text-lg">Achieve peak productivity without sacrificing your mental well-being.</p>
          
          {authError && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
              <div className="flex gap-3 items-start">
                <span className="material-symbols-outlined text-red-500">error</span>
                <div>
                  <p className="text-red-500 font-bold text-sm mb-2">{authError}</p>
                  {authError.includes("Google Sign-in") && (
                    <div className="text-xs text-text-secondary space-y-2">
                      <p>1. Go to <a href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/authentication/providers`} target="_blank" className="text-primary underline">Authentication &gt; Sign-in method</a></p>
                      <p>2. Click <b>Add new provider</b> and select <b>Google</b>.</p>
                      <p>3. Enable it and save.</p>
                    </div>
                  )}
                  {authError.includes("domain is not authorized") && (
                    <div className="text-xs text-text-secondary space-y-2">
                      <p>1. Go to <a href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/authentication/settings`} target="_blank" className="text-primary underline">Authentication &gt; Settings &gt; Authorized domains</a></p>
                      <p>2. Click <b>Add domain</b> and add these two domains:</p>
                      <code className="block bg-background-dark p-2 rounded mt-1 text-[10px] break-all">
                        ais-dev-dftieooqtmy3rtjnbsmbfa-200839630493.europe-west2.run.app
                      </code>
                      <code className="block bg-background-dark p-2 rounded mt-1 text-[10px] break-all">
                        ais-pre-dftieooqtmy3rtjnbsmbfa-200839630493.europe-west2.run.app
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={handleSignIn}
            className="w-full py-4 bg-primary hover:bg-primary-dark text-background-dark font-black rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="size-5" />
            SIGN IN WITH GOOGLE
          </button>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <Dashboard 
            insight={aiInsight} 
            onStartFocus={() => setCurrentView(AppView.FOCUS)} 
            userName={user.displayName?.split(' ')[0] || 'User'}
            onLogMood={() => setIsWellnessModalOpen(true)}
            wellness={wellness}
            logs={logs}
          />
        );
      case AppView.FOCUS:
        return <FocusTimer />;
      case AppView.TASKS:
        return (
          <TaskBoard 
            tasks={tasks} 
            onSelectTask={setSelectedTask} 
            onCreateTask={handleCreateTask} 
            onUpdateTask={handleUpdateTask}
            wellness={wellness}
          />
        );
      case AppView.LOGS:
        return (
          <div className="p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-black mb-8">Work History</h2>
            <div className="space-y-4">
              {logs.length === 0 ? (
                <div className="text-center p-12 bg-surface-dark border border-border-dark rounded-xl text-text-secondary">
                  No work logs yet. Start a focus session to track your time.
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-6 bg-surface-dark border border-border-dark rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`size-10 rounded-full flex items-center justify-center ${log.isDeepWork ? 'bg-primary/20 text-primary' : 'bg-text-secondary/10 text-text-secondary'}`}>
                        <span className="material-symbols-outlined">{log.isDeepWork ? 'eco' : 'timer'}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-text-main">{log.date}</h3>
                        <p className="text-text-secondary text-sm">{log.startTime} - {log.endTime || 'Active'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black uppercase ${log.status === 'overworked' ? 'text-red-400' : 'text-primary'}`}>
                        {log.status}
                      </p>
                      <p className="text-text-main font-mono">{log.duration || '--'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case AppView.WELLNESS:
        return (
          <WellnessHub 
            entries={wellness} 
            onLogMood={() => setIsWellnessModalOpen(true)} 
          />
        );
      case AppView.SETTINGS:
        return <Settings theme={theme} onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} />;
      default:
        return <div className="p-8">Module coming soon...</div>;
    }
  };

  return (
    <div className="flex h-screen w-full bg-background-dark text-text-main overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        user={user}
        onLogout={logOut}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
      />
      <main className="flex-1 overflow-y-auto scroll-smooth pb-20 lg:pb-0">
        {renderView()}
      </main>

      <BottomNav 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />

      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onSave={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}

      {isWellnessModalOpen && (
        <WellnessModal 
          onClose={() => setIsWellnessModalOpen(false)} 
          onSave={handleLogWellness}
        />
      )}
    </div>
  );
};

// Simple Wellness Modal Component
const WellnessModal: React.FC<{ onClose: () => void; onSave: (entry: any) => void }> = ({ onClose, onSave }) => {
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  const [reflection, setReflection] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-sm">
      <div className="bg-surface-dark border border-border-dark w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-black text-text-main mb-6">Daily Check-in</h2>
        
        <div className="space-y-6">
          <div>
            <label className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-3 block">How are you feeling?</label>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map(m => (
                <button 
                  key={m}
                  onClick={() => setMood(m)}
                  className={`size-12 rounded-xl text-2xl transition-all ${mood === m ? 'bg-primary text-background-dark scale-110 shadow-lg shadow-primary/20' : 'bg-border-dark hover:bg-border-dark/80'}`}
                >
                  {['😫', '😕', '😐', '🙂', '🤩'][m-1]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-3 block">Energy Level</label>
            <div className="grid grid-cols-3 gap-3">
              {(['low', 'medium', 'high'] as const).map(e => (
                <button 
                  key={e}
                  onClick={() => setEnergy(e)}
                  className={`py-2 rounded-xl text-xs font-black uppercase transition-all ${energy === e ? 'bg-primary text-background-dark' : 'bg-border-dark text-text-secondary hover:text-text-main'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-3 block">Brief Reflection</label>
            <textarea 
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-background-dark border border-border-dark rounded-xl p-4 text-text-main text-sm focus:border-primary focus:ring-0 transition-all h-24 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-text-secondary hover:text-text-main transition-all">CANCEL</button>
            <button 
              onClick={() => onSave({ mood, energy, reflection })}
              className="flex-1 py-3 bg-primary text-background-dark font-black rounded-xl hover:bg-primary-dark transition-all"
            >
              SAVE ENTRY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
