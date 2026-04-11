
export enum AppView {
  DASHBOARD = 'dashboard',
  TASKS = 'tasks',
  WELLNESS = 'wellness',
  LOGS = 'logs',
  FOCUS = 'focus',
  SETTINGS = 'settings'
}

export enum StressLevel {
  LOW = 'Low Stress',
  MEDIUM = 'Med Stress',
  HIGH = 'High Stress'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  stress: StressLevel;
  status: 'backlog' | 'todo' | 'in-progress' | 'done';
  dueDate: string;
  assignee: string;
}

export interface WellnessEntry {
  id: string;
  timestamp: any;
  mood: number; // 1-5
  energy: 'low' | 'medium' | 'high';
  reflection: string;
}

export interface WorkLog {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: string;
  status: 'active' | 'completed' | 'overworked';
  isDeepWork?: boolean;
}

export interface AIInsight {
  title: string;
  content: string;
  type: 'warning' | 'info' | 'tip';
}
