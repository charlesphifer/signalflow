export interface Contact {
  name: string;
  email: string;
  phone: string;
}

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  dueDate?: string;
}

export type ProjectType = 'Wireless Assessment' | 'Wireless Design';
export type ProjectStage = 'Kickoff' | 'Pre-Work' | 'On-Site' | 'Reporting' | 'Completed';
export type SortField = 'name' | 'number' | 'goLive' | 'stage';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'active' | 'archived';
export type ActiveTab = 'projects' | 'calendar' | 'email-vault' | 'docs-search';

export interface Project {
  id: string;
  number: string;
  name: string;
  city: string;
  state: string;
  credentials: string;
  type: ProjectType;
  stage: ProjectStage;
  travelStart: string;
  travelEnd: string;
  siteStart: string;
  siteEnd: string;
  goLiveDate: string;
  pm: { name: string };
  ae: { name: string };
  itContact: Contact;
  notes: string;
  checklist: ChecklistItem[];
  driveCreated: boolean;
  calendarSynced: boolean;
  isArchived?: boolean;
}

export interface ReferenceDoc {
  id: string;
  category: 'Work Instructions' | 'Device Specifications' | 'Network Guidelines';
  title: string;
  docNum: string;
  lastUpdated: string;
  sections: {
    title: string;
    keywords: string[];
    content: string;
  }[];
}

export interface EmailTemplate {
  id: string;
  title: string;
  desc: string;
  to: string;
  cc: string;
  subject: string;
  body: string;
}

export interface SmartAnswer {
  title: string;
  docNum: string;
  category: string;
  sectionTitle: string;
  excerpt: string;
  score: number;
}

export interface CalendarEvent {
  date: string;
  type: 'travel' | 'site' | 'golive';
  name: string;
}

export interface SyncSettings {
  enabled: boolean;
  provider: 'demo' | 'supabase';
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseTable: string;
  supabaseKey: string;
  demoKey: string;
}

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'disabled';
export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
