
import React, { useState } from 'react';
import { Task, StressLevel } from '../types';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onSave, onDelete }) => {
  const [editedTask, setEditedTask] = useState<Task>({ ...task });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({ ...prev, [name]: value }));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-2xl bg-surface-dark border border-border-dark rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-border-dark flex items-center justify-between bg-surface-darker">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">task_alt</span>
            <h3 className="text-xl font-black text-text-main tracking-tight">Task Details</h3>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-main transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Title</label>
            <input 
              name="title"
              value={editedTask.title}
              onChange={handleChange}
              className="bg-background-dark border-border-dark rounded-xl text-text-main font-bold focus:ring-primary focus:border-primary transition-all p-3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Stress Level</label>
              <select 
                name="stress"
                value={editedTask.stress}
                onChange={handleChange}
                className="bg-background-dark border-border-dark rounded-xl text-text-main focus:ring-primary focus:border-primary transition-all p-3"
              >
                <option value={StressLevel.LOW}>{StressLevel.LOW}</option>
                <option value={StressLevel.MEDIUM}>{StressLevel.MEDIUM}</option>
                <option value={StressLevel.HIGH}>{StressLevel.HIGH}</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</label>
              <select 
                name="status"
                value={editedTask.status}
                onChange={handleChange}
                className="bg-background-dark border-border-dark rounded-xl text-text-main focus:ring-primary focus:border-primary transition-all p-3"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Assignee</label>
              <div className="relative">
                <input 
                  name="assignee"
                  value={editedTask.assignee}
                  onChange={handleChange}
                  className="w-full bg-background-dark border-border-dark rounded-xl text-text-main focus:ring-primary focus:border-primary transition-all p-3 pl-10"
                />
                <span className="material-symbols-outlined absolute left-3 top-3.5 text-text-secondary text-[18px]">person</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Due Date</label>
              <div className="relative">
                <input 
                  name="dueDate"
                  value={editedTask.dueDate}
                  onChange={handleChange}
                  placeholder="e.g. Oct 24 or Today"
                  className="w-full bg-background-dark border-border-dark rounded-xl text-text-main focus:ring-primary focus:border-primary transition-all p-3 pl-10"
                />
                <span className="material-symbols-outlined absolute left-3 top-3.5 text-text-secondary text-[18px]">calendar_today</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Description</label>
            <textarea 
              name="description"
              rows={4}
              value={editedTask.description}
              onChange={handleChange}
              className="bg-background-dark border-border-dark rounded-xl text-text-main text-sm focus:ring-primary focus:border-primary transition-all p-3 resize-none"
              placeholder="Detail the work to be done..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-dark flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-darker">
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this task?')) {
                onDelete(task.id);
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all font-bold text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
            Delete Task
          </button>
          
          <div className="w-full sm:w-auto flex items-center gap-3">
            <button 
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-text-secondary font-bold hover:bg-primary/10 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => onSave(editedTask)}
              className="flex-1 sm:flex-none px-8 py-2.5 bg-primary text-background-dark font-black rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
