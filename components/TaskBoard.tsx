
import React, { useState } from 'react';
import { Task, StressLevel, WellnessEntry } from '../types';
import { gemini } from '../services/geminiService';

interface TaskBoardProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onCreateTask: (status: Task['status']) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  wellness: WellnessEntry[];
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onSelectTask, onCreateTask, onUpdateTask, wellness }) => {
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const recommendation = await gemini.analyzeTasks(tasks, wellness);
    setAiRecommendation(recommendation);
    setIsAnalyzing(false);
  };

  const handleMoveTask = (taskId: string, newStatus: Task['status']) => {
    onUpdateTask(taskId, { status: newStatus });
    setMovingTaskId(null);
  };

  const columns: { title: string; status: Task['status'] }[] = [
    { title: 'Backlog', status: 'backlog' },
    { title: 'To Do', status: 'todo' },
    { title: 'In Progress', status: 'in-progress' },
    { title: 'Done', status: 'done' }
  ];

  const getStressColor = (stress: StressLevel) => {
    switch (stress) {
      case StressLevel.LOW: return 'text-primary bg-primary/10';
      case StressLevel.MEDIUM: return 'text-orange-400 bg-orange-400/10';
      case StressLevel.HIGH: return 'text-red-400 bg-red-400/10';
      default: return 'text-text-secondary bg-white/5';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 px-8 pt-4">
        <div>
          <h1 className="text-2xl font-black text-text-main">Tasks</h1>
          <p className="text-xs text-text-secondary">Manage your focus and stress levels.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-all disabled:opacity-50 text-xs font-bold"
          >
            <span className="material-symbols-outlined text-sm">psychology</span>
            {isAnalyzing ? 'Analyzing...' : 'AI Prioritizer'}
          </button>
        </div>
      </div>

      {aiRecommendation && (
        <div className="mx-8 mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-purple-400 text-sm">auto_awesome</span>
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-purple-400 mb-1 uppercase tracking-wider">AI Recommendation</h4>
            <p className="text-xs text-text-secondary leading-relaxed">{aiRecommendation}</p>
          </div>
          <button onClick={() => setAiRecommendation(null)} className="text-text-secondary hover:text-text-main">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 px-8">
        <div className="flex gap-6 h-full min-w-[1000px]">
          {columns.map(col => (
            <div key={col.status} className="flex-1 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">
                  {col.title}
                  <span className="ml-2 px-1.5 py-0.5 rounded-md bg-border-dark text-[10px]">
                    {tasks.filter(t => t.status === col.status).length}
                  </span>
                </h3>
                <button className="text-text-secondary hover:text-text-main">
                  <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                </button>
              </div>
              
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                {tasks.filter(t => t.status === col.status).map(task => (
                  <div 
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="p-4 rounded-xl bg-surface-dark border border-border-dark hover:border-primary/50 transition-all cursor-pointer group shadow-sm hover:shadow-primary/5"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${getStressColor(task.stress)}`}>
                          {task.stress}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-text-secondary font-bold">{task.dueDate}</span>
                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setMovingTaskId(movingTaskId === task.id ? null : task.id);
                              }}
                              className="text-text-secondary hover:text-text-main"
                            >
                              <span className="material-symbols-outlined text-sm">swap_horiz</span>
                            </button>
                            {movingTaskId === task.id && (
                              <div className="absolute right-0 top-6 w-32 bg-surface-dark border border-border-dark rounded-lg shadow-xl z-10 py-1 overflow-hidden">
                                {columns.filter(c => c.status !== task.status).map(col => (
                                  <button
                                    key={col.status}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveTask(task.id, col.status);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-text-secondary hover:bg-primary/10 hover:text-text-main transition-colors"
                                  >
                                    Move to {col.title}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div onClick={() => onSelectTask(task)}>
                        <h4 className="text-text-main font-bold group-hover:text-primary transition-colors leading-tight mb-1">
                          {task.title}
                        </h4>
                        
                        <p className="text-text-secondary text-xs line-clamp-2">
                          {task.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <div className="flex -space-x-2">
                           <div className="size-6 rounded-full border-2 border-surface-dark bg-cover" style={{backgroundImage: `url(https://picsum.photos/seed/${task.assignee}/50)`}}></div>
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary">
                          <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                          <span className="text-[10px] font-bold">2</span>
                          <span className="material-symbols-outlined text-[16px]">attachment</span>
                          <span className="text-[10px] font-bold">1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => onCreateTask(col.status)}
                  className="w-full py-2 border border-dashed border-border-dark rounded-xl text-text-secondary hover:text-primary hover:border-primary/30 transition-all text-xs font-bold"
                >
                  + Add Card
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskBoard;
