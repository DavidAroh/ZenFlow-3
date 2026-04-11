
import { Task, StressLevel, WorkLog } from './types';

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Update team roster',
    description: 'Add the two new interns to the system and assign permissions.',
    stress: StressLevel.LOW,
    status: 'backlog',
    dueDate: 'Oct 24',
    assignee: 'JD'
  },
  {
    id: '2',
    title: 'Weekly Sync Prep',
    description: 'Gather updates from engineering and design teams.',
    stress: StressLevel.MEDIUM,
    status: 'backlog',
    dueDate: 'Oct 25',
    assignee: 'AM'
  },
  {
    id: '3',
    title: 'Q4 Financial Report',
    description: 'Compile all departmental spend and forecast for next year.',
    stress: StressLevel.HIGH,
    status: 'todo',
    dueDate: 'Due Tomorrow',
    assignee: 'AM'
  },
  {
    id: '4',
    title: 'Email Newsletter',
    description: 'Writing copy for the monthly product update.',
    stress: StressLevel.LOW,
    status: 'in-progress',
    dueDate: 'Today',
    assignee: 'AM'
  }
];

export const INITIAL_LOGS: WorkLog[] = [
  { id: 'l1', date: 'Oct 26', startTime: '09:00 AM', status: 'active' },
  { id: 'l2', date: 'Oct 25', startTime: '08:30 AM', endTime: '08:45 PM', duration: '12h 15m', status: 'overworked' },
  { id: 'l3', date: 'Oct 24', startTime: '09:00 AM', endTime: '05:00 PM', duration: '08h 00m', status: 'completed' }
];

export const MOOD_EMOJIS = ['😫', '😕', '😐', '🙂', '🤩'];
