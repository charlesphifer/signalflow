export interface Contact {
  name: string;
  email: string;
  phone: string;
}

export interface Person {
  id: string;
  name: string;
  roles: Array<'AM' | 'PM'>;
  email: string;
  phone: string;
  company: string;
}

export interface LineItem {
  line: number;
  qty: number;
  um: string;
  code: string;
  description: string;
  unitPrice?: number;
  extendedPrice?: number;
}

export type DraftStatus = 'pending' | 'confirmed' | 'dismissed';
export type DraftProjectType = 'Wireless Assessment' | 'Wireless Design' | 'Unknown';

export interface PendingDraft {
  id: string;
  status: DraftStatus;
  receivedAt: string;
  source: 'email';
  emailSubject: string;
  emailFrom: string;
  accountName: string;
  customerPo: string;
  quoteNumber: string;
  salesOrderNumbers: string[];
  nkProjectNumbers: string[];
  salesforceUrl: string;
  opportunityOwner: string;
  billTo: string;
  shipTo: string;
  salesRep: string;
  enteredBy: string;
  orderDate: string;
  requestedDate: string;
  orderTotal?: number;
  suggestedType: DraftProjectType;
  qualifyingLineItems: LineItem[];
  lineItems: LineItem[];
  notes: string[];
  reviewFlags: string[];
  attachments: { filename: string; soNumber?: string }[];
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
export type ActiveTab = 'projects' | 'calendar' | 'email-vault' | 'docs-search' | 'intake' | 'people';

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
  soNumber: string;
  customerPo: string;
  quoteNumber: string;
  nkProjectNumber: string;
  salesforceUrl: string;
  source: 'manual' | 'email';
  siteAddress: string;
  lat?: number;
  lon?: number;
  notes: string;
  checklist: ChecklistItem[];
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
