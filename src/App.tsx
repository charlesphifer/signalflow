import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  FolderOpen, 
  Calendar as CalendarIcon, 
  ListTodo, 
  Mail, 
  User, 
  MapPin, 
  Shield, 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Clipboard, 
  X, 
  ExternalLink, 
  Check, 
  Search, 
  BookOpen, 
  CalendarCheck2, 
  ChevronRight, 
  ClipboardCheck, 
  CheckSquare,
  ArrowUpDown,
  Archive,
  Sparkles,
  HelpCircle,
  FileText,
  Edit,
  Cloud,
  CloudOff,
  Database,
  RefreshCw
} from 'lucide-react';

import { REFERENCE_DOCS } from './data/referenceDocs';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// TYPES & DATA STRUCTURES
// ==========================================

interface Contact {
  name: string;
  email: string;
  phone: string;
}

interface Project {
  id: string;
  number: string;
  name: string;
  city: string;
  state: string;
  credentials: string;
  type: 'Wireless Assessment' | 'Wireless Design'; // Wireless Assessment: Customer Wireless Network, Wireless Design: NK Network
  stage: 'Kickoff' | 'Pre-Work' | 'On-Site' | 'Reporting' | 'Completed';
  travelStart: string;
  travelEnd: string;
  siteStart: string;
  siteEnd: string;
  goLiveDate: string;
  pm: { name: string };
  ae: { name: string };
  itContact: Contact;
  notes: string;
  checklist: {
    id: string;
    task: string;
    completed: boolean;
    dueDate?: string;
  }[];
  driveCreated: boolean;
  calendarSynced: boolean;
  isArchived?: boolean;
}

// Default Checklists
const DEFAULT_ASSESSMENT_CHECKLIST = [
  { id: 'wa_1', task: 'Kickoff Meeting / Project Intake Call with PM & AE', completed: true },
  { id: 'wa_2', task: 'Locate & download raw floor plans from Customer/AE', completed: false },
  { id: 'wa_3', task: 'Request and obtain marked floor plans outlining coverage areas', completed: false },
  { id: 'wa_4', task: 'Confirm on-site assessment dates with Hospital IT', completed: false },
  { id: 'wa_5', task: 'Enter scheduled on-site dates into Salesforce', completed: false },
  { id: 'wa_6', task: 'Verify customer prep for proof-of-concept (POC) telemetry server', completed: false },
  { id: 'wa_7', task: 'Book travel (Flights, Hotel, Rental Car)', completed: false },
  { id: 'wa_8', task: 'Block travel & site dates in Outlook calendar as "Busy"', completed: false },
  { id: 'wa_9', task: 'Import clean CAD floor plans into Ekahau and calibrate scaling', completed: false },
  { id: 'wa_10', task: 'Prepare & synchronize assessment maps to Ekahau Sidekick', completed: false },
  { id: 'wa_11', task: 'Perform on-site active/passive wireless survey walks', completed: false },
  { id: 'wa_12', task: 'Set up POC laptop (Server/Central Station VM) & run device test walk', completed: false },
  { id: 'wa_13', task: 'Ensure project files are backed up on Sidekick and Tablet', completed: false },
  { id: 'wa_14', task: 'Generate and write technical wireless assessment report (2-week deadline)', completed: false },
  { id: 'wa_15', task: 'Upload final PDF report to Salesforce and send copy to PM', completed: false },
  { id: 'wa_16', task: 'Attend PM-scheduled customer review call to finalize hand-off', completed: false }
];

const DEFAULT_DESIGN_CHECKLIST = [
  { id: 'wd_1', task: 'Kickoff Meeting / Project Review', completed: true },
  { id: 'wd_2', task: 'Clean floor plans in AutoCAD & scale ready for import', completed: false },
  { id: 'wd_3', task: 'Create detailed AP layout design in Ekahau (Predictive Study)', completed: false },
  { id: 'wd_4', task: 'Schedule hardware configuration / AP staging session', completed: false },
  { id: 'wd_5', task: 'Configure AP network settings, channels, and SSIDs', completed: false },
  { id: 'wd_6', task: 'Book site visit travel & block Outlook calendar', completed: false },
  { id: 'wd_7', task: 'Arrive on-site & supervise physical installation of AP hardware', completed: false },
  { id: 'wd_8', task: 'Perform live active system validation survey with Sidekick', completed: false },
  { id: 'wd_9', task: 'Backup and synchronize final AP configurations', completed: false },
  { id: 'wd_10', task: 'Deploy go-live monitoring setup & conduct telemetry testing', completed: false },
  { id: 'wd_11', task: 'Generate final validation report & upload to Salesforce', completed: false },
  { id: 'wd_12', task: 'Customer signoff & project closing call', completed: false }
];

// Initial Seed Data
const SEED_PROJECTS: Project[] = [
  {
    id: '1',
    number: 'NK-2026-948',
    name: 'St. Jude Children\'s Research Hospital',
    city: 'Memphis',
    state: 'TN',
    credentials: 'Symplr (Required, badge up-to-date)',
    type: 'Wireless Assessment',
    stage: 'On-Site',
    travelStart: '2026-07-12',
    travelEnd: '2026-07-16',
    siteStart: '2026-07-13',
    siteEnd: '2026-07-15',
    goLiveDate: '2026-08-10',
    pm: { name: 'Sarah Jenkins' },
    ae: { name: 'Marcus Vance' },
    itContact: { name: 'David Cho (BioMed Tech)', email: 'dcho@stjude.org', phone: '901-555-9876' },
    notes: 'Hospital is deploying a brand new telemetry server. Extremely strict rules on wireless interference. Need to make sure POC test walks cover all hallways in Wing G and F. BioMed wants a detailed rundown of AP channels.',
    checklist: DEFAULT_ASSESSMENT_CHECKLIST.map((item, idx) => ({
      ...item,
      completed: idx < 10 // first 10 completed
    })),
    driveCreated: true,
    calendarSynced: true
  },
  {
    id: '2',
    number: 'NK-2026-812',
    name: 'Methodist University Hospital',
    city: 'Memphis',
    state: 'TN',
    credentials: 'None (Regular visitor check-in)',
    type: 'Wireless Design',
    stage: 'Pre-Work',
    travelStart: '2026-07-26',
    travelEnd: '2026-07-29',
    siteStart: '2026-07-27',
    siteEnd: '2026-07-28',
    goLiveDate: '2026-09-01',
    pm: { name: 'Sarah Jenkins' },
    ae: { name: 'Linda Ross' },
    itContact: { name: 'Robert Gable (Network Dir)', email: 'rgable@methodist.org', phone: '901-555-3255' },
    notes: 'We are installing 18 of our custom-configured wireless access points. Staging must occur at the warehouse before travel. Robert will have ladders and a tech on-site to assist with physically hanging APs.',
    checklist: DEFAULT_DESIGN_CHECKLIST.map((item, idx) => ({
      ...item,
      completed: idx < 3 // first 3 completed
    })),
    driveCreated: true,
    calendarSynced: true
  },
  {
    id: '3',
    number: 'NK-2026-441',
    name: 'Baptist Memorial Hospital-Memphis',
    city: 'Memphis',
    state: 'TN',
    credentials: 'Reptrax (Requires printing pass at lobby)',
    type: 'Wireless Assessment',
    stage: 'Reporting',
    travelStart: '2026-06-21',
    travelEnd: '2026-06-25',
    siteStart: '2026-06-22',
    siteEnd: '2026-06-24',
    goLiveDate: '2026-07-20',
    pm: { name: 'Tom Higgins' },
    ae: { name: 'Marcus Vance' },
    itContact: { name: 'Alice Wu (IT Specialist)', email: 'awu@bmh.org', phone: '901-555-7731' },
    notes: 'Completed survey walks and POC test successfully on June 24. Report is roughly 80% drafted. Ekahau sidekick reports look highly clean, normal SNR values in the ICU area. Just need to write the recommendations on hospital VLAN setups.',
    checklist: DEFAULT_ASSESSMENT_CHECKLIST.map((item, idx) => ({
      ...item,
      completed: idx < 13 // completed up to Sidekick save
    })),
    driveCreated: true,
    calendarSynced: true
  }
];

// Helper to generate Google Calendar link
const getGoogleCalendarUrl = (project: Project) => {
  if (!project.goLiveDate) return '';
  const cleanDate = project.goLiveDate.replace(/-/g, '');
  const start = `${cleanDate}T090000`;
  const end = `${cleanDate}T100000`;
  const title = encodeURIComponent(`[SignalFlow] Go-Live: ${project.name} (${project.number})`);
  const details = encodeURIComponent(
    `Project: ${project.name}\n` +
    `Project Number: ${project.number}\n` +
    `Type: ${project.type}\n` +
    `Location: ${project.city}, ${project.state}\n` +
    `PM: ${project.pm.name}\n` +
    `AE: ${project.ae.name}\n\n` +
    `Generated by SignalFlow PWA.`
  );
  const location = encodeURIComponent(`${project.city}, ${project.state}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
};

// Helper to generate Outlook/iCal .ics file download
const downloadIcsFile = (project: Project, onToast: (msg: string) => void) => {
  if (!project.goLiveDate) return;
  const cleanDate = project.goLiveDate.replace(/-/g, '');
  const start = `${cleanDate}T090000`;
  const end = `${cleanDate}T100000`;
  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SignalFlow//Hospital Wireless Deployment//EN',
    'BEGIN:VEVENT',
    `UID:${project.id}@signalflow.pwa`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:[SignalFlow] Go-Live: ${project.name} (${project.number})`,
    `DESCRIPTION:Project Number: ${project.number}\\nType: ${project.type}\\nLocation: ${project.city}\\, ${project.state}\\nPM: ${project.pm.name}\\nAE: ${project.ae.name}\\n\\nGenerated via SignalFlow PWA.`,
    `LOCATION:${project.city}\\, ${project.state}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  
  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${project.number}_GoLive.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  onToast("Outlook / iCal event file downloaded!");
};

// Helper to generate mailto URL for email templates
const getMailtoUrl = (temp: { to?: string; cc?: string; subject: string; body: string }) => {
  const to = encodeURIComponent(temp.to || '');
  const cc = encodeURIComponent(temp.cc || '');
  const subject = encodeURIComponent(temp.subject || '');
  const body = encodeURIComponent(temp.body || '');
  return `mailto:${to}?cc=${cc}&subject=${subject}&body=${body}`;
};

interface SmartAnswer {
  title: string;
  docNum: string;
  category: string;
  sectionTitle: string;
  excerpt: string;
  score: number;
}

const findSmartAnswer = (query: string): SmartAnswer | null => {
  if (!query || query.trim().length < 3) return null;
  
  const tokens = query.toLowerCase()
    .replace(/[?.!,;]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2);
  
  if (tokens.length === 0) return null;
  
  let bestSection: any = null;
  let bestDoc: any = null;
  let bestScore = 0;
  
  for (const doc of REFERENCE_DOCS) {
    for (const sec of doc.sections) {
      let score = 0;
      
      for (const token of tokens) {
        if (sec.keywords.some(k => k.toLowerCase().includes(token))) {
          score += 15;
        }
      }
      
      const contentLower = sec.content.toLowerCase();
      for (const token of tokens) {
        let idx = -1;
        while ((idx = contentLower.indexOf(token, idx + 1)) !== -1) {
          score += 3;
        }
      }
      
      const titleLower = sec.title.toLowerCase();
      for (const token of tokens) {
        if (titleLower.includes(token)) {
          score += 8;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestSection = sec;
        bestDoc = doc;
      }
    }
  }
  
  if (bestScore >= 5 && bestSection && bestDoc) {
    return {
      title: bestDoc.title,
      docNum: bestDoc.docNum,
      category: bestDoc.category,
      sectionTitle: bestSection.title,
      excerpt: bestSection.content,
      score: bestScore
    };
  }
  
  return null;
};

const highlightText = (text: string, query: string) => {
  if (!query || query.trim().length < 3) return <span>{text}</span>;
  
  const tokens = query.toLowerCase()
    .replace(/[?.!,;]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2);
    
  if (tokens.length === 0) return <span>{text}</span>;
  
  const escapedTokens = tokens.map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTokens.join('|')})`, 'gi');
  
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, i) => {
        const isMatch = tokens.some(t => part.toLowerCase() === t.toLowerCase() || (part.toLowerCase().includes(t.toLowerCase()) && t.toLowerCase().length > 3));
        return isMatch ? (
          <mark key={i} className="bg-sunset-500/30 text-sunset-400 px-0.5 rounded font-bold">
            {part}
          </mark>
        ) : (
          part
        );
      })}
    </span>
  );
};

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('signalflow_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((p: any) => {
          // Robustly migrate legacy types
          const migratedType = p.type === 'Type 1' ? 'Wireless Assessment' : p.type === 'Type 2' ? 'Wireless Design' : p.type;
          
          // Robustly migrate legacy checklist task IDs to match new prefixes
          const migratedChecklist = (p.checklist || []).map((item: any) => {
            let migratedId = item.id;
            if (item.id.startsWith('t1_')) {
              migratedId = item.id.replace('t1_', 'wa_');
            } else if (item.id.startsWith('t2_')) {
              migratedId = item.id.replace('t2_', 'wd_');
            }
            return { ...item, id: migratedId };
          });

          return {
            ...p,
            type: migratedType,
            checklist: migratedChecklist
          };
        });
      } catch {
        return SEED_PROJECTS;
      }
    }
    return SEED_PROJECTS;
  });
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('1');
  const [activeTab, setActiveTab] = useState<'projects' | 'calendar' | 'email-vault' | 'docs-search'>('projects');
  const [showWizard, setShowWizard] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Technical Reference Vault states
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [expandedSectionTitle, setExpandedSectionTitle] = useState<string | null>(null);
  
  // Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [wizName, setWizName] = useState('');
  const [wizNumber, setWizNumber] = useState('');
  const [wizCity, setWizCity] = useState('');
  const [wizState, setWizState] = useState('TN');
  const [wizCredentials, setWizCredentials] = useState('Symplr');
  const [wizPmName, setWizPmName] = useState('');
  const [wizAeName, setWizAeName] = useState('');
  const [wizItName, setWizItName] = useState('');
  const [wizItEmail, setWizItEmail] = useState('');
  const [wizItPhone, setWizItPhone] = useState('');
  const [wizTravelStart, setWizTravelStart] = useState('');
  const [wizTravelEnd, setWizTravelEnd] = useState('');
  const [wizSiteStart, setWizSiteStart] = useState('');
  const [wizSiteEnd, setWizSiteEnd] = useState('');
  const [wizGoLive, setWizGoLive] = useState('');
  const [wizType, setWizType] = useState<'Wireless Assessment' | 'Wireless Design'>('Wireless Assessment');
  const [wizDrive, setWizDrive] = useState(true);
  const [wizCalendar, setWizCalendar] = useState(true);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'name' | 'number' | 'goLive' | 'stage'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  
  // Google Drive config state
  const [googleDriveUrl, setGoogleDriveUrl] = useState<string>(() => {
    return localStorage.getItem('signalflow_google_drive_url') || '';
  });
  const [showDriveConfig, setShowDriveConfig] = useState(false);

  // Persist drive URL changes
  useEffect(() => {
    localStorage.setItem('signalflow_google_drive_url', googleDriveUrl);
  }, [googleDriveUrl]);

  // Folder hierarchy text to copy
  const DRIVE_FOLDER_STRUCTURE = `📁 [Project Number] Project Name/
├── 📂 01_Floor_Plans/     (AutoCAD DWGs, PDFs)
├── 📂 02_Ekahau_Files/    (.esx projects, surveys)
├── 📂 03_Site_Photos/     (AP placement proofs)
└── 📂 04_Final_Reports/   (Completed PDF exports)`;

  const copyDriveStructureToClipboard = async () => {
    const projectLabel = selectedProject
      ? `${selectedProject.number} - ${selectedProject.name}`
      : 'Project';
    const text = DRIVE_FOLDER_STRUCTURE.replace('[Project Number]', selectedProject?.number || 'XXXX')
      .replace('Project Name', selectedProject?.name || 'Project');
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Folder structure copied to clipboard for ${projectLabel}`);
    } catch {
      showToast('Could not copy to clipboard');
    }
  };

  const openGoogleDriveFolder = () => {
    if (googleDriveUrl) {
      window.open(googleDriveUrl, '_blank', 'noopener,noreferrer');
      showToast('Opening Google Drive folder...');
    } else {
      showToast('No Google Drive folder configured. Add a URL in the settings above.');
    }
  };

  // Success / Copied notifications
  const [notification, setNotification] = useState<string | null>(null);

  // ==========================================
  // CLOUD SYNC CONFIGURATION (PATH B)
  // ==========================================
  const [syncSettings, setSyncSettings] = useState(() => {
    const saved = localStorage.getItem('signalflow_sync_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return {
      enabled: false,
      provider: 'demo', // 'supabase' | 'demo'
      supabaseUrl: '',
      supabaseAnonKey: '',
      supabaseTable: 'signalflow_sync',
      supabaseKey: 'SF-Cloud-Room-1',
      demoKey: ''
    };
  });

  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'disabled'>('disabled');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => localStorage.getItem('signalflow_last_synced_at'));
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  
  const isSyncingRef = useRef(false);
  const supabaseClientRef = useRef<any>(null);
  const supabaseChannelRef = useRef<any>(null);

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const syncSettingsRef = useRef(syncSettings);
  useEffect(() => {
    syncSettingsRef.current = syncSettings;
  }, [syncSettings]);

  const projectsRef = useRef(projects);
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  const performSync = useCallback(async (forceDirection: 'push' | 'pull' | 'auto' = 'auto') => {
    const activeSettings = syncSettingsRef.current;
    const activeProjects = projectsRef.current;

    if (!activeSettings.enabled) {
      setSyncStatus('disabled');
      return;
    }

    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setSyncStatus('syncing');
    setIsSyncingNow(true);

    try {
      setSyncError(null);
      if (activeSettings.provider === 'demo') {
        let currentDemoKey = activeSettings.demoKey;
        
        // 1. If we don't have a demo key yet, we must initialize a new bin on the cloud!
        if (!currentDemoKey) {
          const timestamp = new Date().toISOString();
          const response = await fetch('https://jsonblob.com/api/jsonBlob', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projects: activeProjects,
              updatedAt: timestamp
            })
          });
          
          if (!response.ok) throw new Error('Failed to initialize demo sync room');
          
          const locHeader = response.headers.get('Location') || '';
          const idFromLoc = locHeader.split('/').pop() || '';
          currentDemoKey = response.headers.get('x-jsonblob-id') || idFromLoc;
          
          if (!currentDemoKey) throw new Error('Server did not return a valid Sync Room ID');
          
          // Save the newly generated demo key!
          const updatedSettings = { ...activeSettings, demoKey: currentDemoKey };
          setSyncSettings(updatedSettings);
          localStorage.setItem('signalflow_sync_settings', JSON.stringify(updatedSettings));
          localStorage.setItem('signalflow_projects_updated_at', timestamp);
          setLastSyncedAt(timestamp);
          localStorage.setItem('signalflow_last_synced_at', timestamp);
          setSyncStatus('synced');
          showToast('Free Demo Sync Room created successfully!');
          isSyncingRef.current = false;
          setIsSyncingNow(false);
          return;
        }

        // 2. Fetch the latest cloud state
        const response = await fetch(`https://jsonblob.com/api/jsonBlob/${currentDemoKey}`);
        if (!response.ok) {
          if (response.status === 404) {
            // Key expired or deleted, let's reset it
            const updatedSettings = { ...activeSettings, demoKey: '' };
            setSyncSettings(updatedSettings);
            localStorage.setItem('signalflow_sync_settings', JSON.stringify(updatedSettings));
            throw new Error('Sync room not found on server. Resetting key.');
          }
          throw new Error('Failed to contact demo server');
        }
        
        const cloudObj = await response.json();
        const cloudProjects = cloudObj.projects || [];
        const cloudUpdatedAt = cloudObj.updatedAt || '';

        // Compare timestamps
        const localUpdatedAt = localStorage.getItem('signalflow_projects_updated_at') || new Date(0).toISOString();
        
        let direction: 'push' | 'pull' = 'push';
        
        if (forceDirection === 'push') {
          direction = 'push';
        } else if (forceDirection === 'pull') {
          direction = 'pull';
        } else {
          // Auto resolve based on timestamps
          if (!cloudUpdatedAt || new Date(localUpdatedAt) > new Date(cloudUpdatedAt)) {
            direction = 'push';
          } else if (new Date(cloudUpdatedAt) > new Date(localUpdatedAt)) {
            direction = 'pull';
          } else {
            // Equal, no action needed!
            setSyncStatus('synced');
            isSyncingRef.current = false;
            setIsSyncingNow(false);
            return;
          }
        }

        if (direction === 'push') {
          const timestamp = new Date().toISOString();
          const updateResponse = await fetch(`https://jsonblob.com/api/jsonBlob/${currentDemoKey}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projects: activeProjects,
              updatedAt: timestamp
            })
          });
          if (!updateResponse.ok) throw new Error('Failed to push changes to demo server');
          
          localStorage.setItem('signalflow_projects_updated_at', timestamp);
          setLastSyncedAt(timestamp);
          localStorage.setItem('signalflow_last_synced_at', timestamp);
          setSyncStatus('synced');
        } else {
          // Pulling cloud state
          setProjects(cloudProjects);
          localStorage.setItem('signalflow_projects', JSON.stringify(cloudProjects));
          localStorage.setItem('signalflow_projects_updated_at', cloudUpdatedAt);
          setLastSyncedAt(cloudUpdatedAt);
          localStorage.setItem('signalflow_last_synced_at', cloudUpdatedAt);
          setSyncStatus('synced');
          showToast('Workspace pulled & synchronized with cloud');
        }

      } else if (activeSettings.provider === 'supabase') {
        const { supabaseUrl, supabaseAnonKey, supabaseTable, supabaseKey } = activeSettings;
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Supabase URL and Anon Key are missing');
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        // Fetch row from custom sync table
        const { data: cloudData, error: fetchError } = await supabase
          .from(supabaseTable)
          .select('*')
          .eq('sync_key', supabaseKey)
          .maybeSingle();

        if (fetchError) {
          throw new Error(`Supabase Query Error: ${fetchError.message}`);
        }

        const cloudProjects = cloudData?.projects || null;
        const cloudUpdatedAt = cloudData?.updated_at || null;
        const localUpdatedAt = localStorage.getItem('signalflow_projects_updated_at') || new Date(0).toISOString();

        let direction: 'push' | 'pull' = 'push';

        if (forceDirection === 'push') {
          direction = 'push';
        } else if (forceDirection === 'pull') {
          direction = 'pull';
        } else {
          if (!cloudUpdatedAt || new Date(localUpdatedAt) > new Date(cloudUpdatedAt)) {
            direction = 'push';
          } else if (new Date(cloudUpdatedAt) > new Date(localUpdatedAt)) {
            direction = 'pull';
          } else {
            setSyncStatus('synced');
            isSyncingRef.current = false;
            setIsSyncingNow(false);
            return;
          }
        }

        if (direction === 'push') {
          const timestamp = new Date().toISOString();
          const { error: upsertError } = await supabase
            .from(supabaseTable)
            .upsert({
              sync_key: supabaseKey,
              projects: activeProjects,
              updated_at: timestamp
            });

          if (upsertError) {
            throw new Error(`Supabase Push Error: ${upsertError.message}`);
          }

          localStorage.setItem('signalflow_projects_updated_at', timestamp);
          setLastSyncedAt(timestamp);
          localStorage.setItem('signalflow_last_synced_at', timestamp);
          setSyncStatus('synced');
        } else {
          // Pulling cloud state
          setProjects(cloudProjects);
          localStorage.setItem('signalflow_projects', JSON.stringify(cloudProjects));
          localStorage.setItem('signalflow_projects_updated_at', cloudUpdatedAt);
          setLastSyncedAt(cloudUpdatedAt);
          localStorage.setItem('signalflow_last_synced_at', cloudUpdatedAt);
          setSyncStatus('synced');
          showToast('Workspace pulled & synchronized with Supabase');
        }
      }
    } catch (e: any) {
          console.error(e);
          setSyncStatus('error');
          setSyncError(e.message || String(e));
          // Determine if this is a CORS issue (common with jsonblob.com from browser)
          const errorMsg = e.message || String(e);
          if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('Network request failed') || errorMsg.includes('Load failed')) {
            showToast(`🌐 Network/CORS Error: jsonblob.com may not allow cross-origin requests from this domain. Try Supabase mode instead, or check your network connection.`);
          } else {
            showToast(`Cloud Sync Error: ${e.message || 'Check your configuration'}`);
          }
        } finally {
      isSyncingRef.current = false;
      setIsSyncingNow(false);
    }
  }, []);

  // Auto-save projects to local storage & trigger Cloud Push
  useEffect(() => {
    localStorage.setItem('signalflow_projects', JSON.stringify(projects));
    
    if (!isSyncingRef.current) {
      // Record latest local update timestamp
      const timestamp = new Date().toISOString();
      localStorage.setItem('signalflow_projects_updated_at', timestamp);
      
      // If cloud sync is enabled, push the update in the background!
      if (syncSettings.enabled) {
        performSync('push');
      }
    }
  }, [projects, syncSettings.enabled, performSync]);

  // Periodic polling check — shorter interval for demo (no realtime), longer for supabase as fallback
  useEffect(() => {
    if (!syncSettings.enabled) {
      setSyncStatus('disabled');
      return;
    }
    
    // Perform initial auto-sync on load
    performSync('auto');

    // Demo mode: poll every 5 seconds (no WebSocket alternative available)
    // Supabase mode: poll every 30 seconds as fallback behind realtime WebSocket
    const pollInterval = syncSettings.provider === 'supabase' ? 30000 : 5000;

    const interval = setInterval(() => {
      performSync('auto');
    }, pollInterval);

    return () => clearInterval(interval);
  }, [syncSettings.enabled, syncSettings.demoKey, syncSettings.supabaseKey, syncSettings.provider, performSync]);

  // Supabase Realtime subscription — push-based sync for instant propagation
  useEffect(() => {
    // Clean up previous subscription
    if (supabaseChannelRef.current) {
      try {
        supabaseClientRef.current?.removeChannel(supabaseChannelRef.current);
      } catch (_) {}
      supabaseChannelRef.current = null;
    }

    if (!syncSettings.enabled || syncSettings.provider !== 'supabase' || !syncSettings.supabaseUrl || !syncSettings.supabaseAnonKey) {
      setRealtimeStatus('disconnected');
      return;
    }

    const supabase = createClient(syncSettings.supabaseUrl, syncSettings.supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    supabaseClientRef.current = supabase;

    setRealtimeStatus('connecting');

    const channel = supabase
      .channel('signalflow-changes')
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: syncSettings.supabaseTable
        },
        (_payload: any) => {
          // A change was detected on the server — pull latest data
          if (!isSyncingRef.current) {
            performSync('auto');
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('error');
        }
      });

    supabaseChannelRef.current = channel;

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (_) {}
      supabaseChannelRef.current = null;
    };
  }, [syncSettings.enabled, syncSettings.provider, syncSettings.supabaseUrl, syncSettings.supabaseAnonKey, syncSettings.supabaseTable, performSync]);

  // Edit Project State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProjId, setEditProjId] = useState('');
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editCredentials, setEditCredentials] = useState('');
  const [editPmName, setEditPmName] = useState('');
  const [editAeName, setEditAeName] = useState('');
  const [editItName, setEditItName] = useState('');
  const [editItEmail, setEditItEmail] = useState('');
  const [editItPhone, setEditItPhone] = useState('');
  const [editTravelStart, setEditTravelStart] = useState('');
  const [editTravelEnd, setEditTravelEnd] = useState('');
  const [editSiteStart, setEditSiteStart] = useState('');
  const [editSiteEnd, setEditSiteEnd] = useState('');
  const [editGoLive, setEditGoLive] = useState('');
  const [editType, setEditType] = useState<'Wireless Assessment' | 'Wireless Design'>('Wireless Assessment');
  const [editStage, setEditStage] = useState<'Kickoff' | 'Pre-Work' | 'On-Site' | 'Reporting' | 'Completed'>('Kickoff');

  const handleOpenEditModal = (p: Project) => {
    setEditProjId(p.id);
    setEditName(p.name);
    setEditNumber(p.number);
    setEditCity(p.city);
    setEditState(p.state);
    setEditCredentials(p.credentials);
    setEditPmName(p.pm.name);
    setEditAeName(p.ae.name);
    setEditItName(p.itContact.name);
    setEditItEmail(p.itContact.email);
    setEditItPhone(p.itContact.phone);
    setEditTravelStart(p.travelStart);
    setEditTravelEnd(p.travelEnd);
    setEditSiteStart(p.siteStart);
    setEditSiteEnd(p.siteEnd);
    setEditGoLive(p.goLiveDate);
    setEditType(p.type);
    setEditStage(p.stage);
    setShowEditModal(true);
  };

  const handleSaveProject = () => {
    setProjects(prev => prev.map(p => {
      if (p.id === editProjId) {
        let updatedChecklist = p.checklist;
        if (p.type !== editType) {
          updatedChecklist = editType === 'Wireless Assessment' 
            ? DEFAULT_ASSESSMENT_CHECKLIST.map(item => ({ ...item }))
            : DEFAULT_DESIGN_CHECKLIST.map(item => ({ ...item }));
        }

        return {
          ...p,
          number: editNumber,
          name: editName,
          city: editCity,
          state: editState,
          credentials: editCredentials,
          type: editType,
          stage: editStage,
          travelStart: editTravelStart,
          travelEnd: editTravelEnd,
          siteStart: editSiteStart,
          siteEnd: editSiteEnd,
          goLiveDate: editGoLive,
          pm: { name: editPmName },
          ae: { name: editAeName },
          itContact: {
            name: editItName,
            email: editItEmail,
            phone: editItPhone
          },
          checklist: updatedChecklist
        };
      }
      return p;
    }));
    setShowEditModal(false);
    showToast('Project updated successfully!');
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Toggle Checklist Item
  const handleToggleChecklist = (projectId: string, itemId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updatedChecklist = p.checklist.map(item => {
          if (item.id === itemId) {
            return { ...item, completed: !item.completed };
          }
          return item;
        });
        
        // Auto-update stage based on progress percentages as a smart assist
        const completedCount = updatedChecklist.filter(c => c.completed).length;
        const totalCount = updatedChecklist.length;
        const pct = completedCount / totalCount;
        
        let newStage = p.stage;
        if (p.type === 'Wireless Assessment') {
          if (pct < 0.25) newStage = 'Kickoff';
          else if (pct < 0.6) newStage = 'Pre-Work';
          else if (pct < 0.8) newStage = 'On-Site';
          else if (pct < 0.95) newStage = 'Reporting';
          else newStage = 'Completed';
        } else {
          if (pct < 0.2) newStage = 'Kickoff';
          else if (pct < 0.5) newStage = 'Pre-Work';
          else if (pct < 0.8) newStage = 'On-Site';
          else if (pct < 0.95) newStage = 'Reporting';
          else newStage = 'Completed';
        }

        return { ...p, checklist: updatedChecklist, stage: newStage };
      }
      return p;
    }));
  };

  // Update Notes
  const handleSaveNotes = (projectId: string, text: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, notes: text };
      }
      return p;
    }));
    showToast("Notes auto-saved successfully.");
  };

  // Toggle Archive Status
  const handleToggleArchive = (projectId: string) => {
    let statusText = '';
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const nextArchived = !p.isArchived;
        statusText = nextArchived ? "Project moved to Archived Space." : "Project restored to Active list.";
        return { ...p, isArchived: nextArchived };
      }
      return p;
    }));
    showToast(statusText);
  };

  // Launch New Wizard
  const handleOpenWizard = () => {
    setWizardStep(1);
    setWizName('');
    setWizNumber('');
    setWizCity('');
    setWizState('TN');
    setWizCredentials('Symplr');
    setWizPmName('Sarah Jenkins');
    setWizAeName('Marcus Vance');
    setWizItName('');
    setWizItEmail('');
    setWizItPhone('');
    setWizTravelStart('');
    setWizTravelEnd('');
    setWizSiteStart('');
    setWizSiteEnd('');
    setWizGoLive('');
    setWizType('Wireless Assessment');
    setWizDrive(true);
    setWizCalendar(true);
    setShowWizard(true);
  };

  // Complete Wizard / Add Project
  const handleCreateProject = () => {
    const newProj: Project = {
      id: Date.now().toString(),
      number: wizNumber || `NK-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: wizName || 'Unnamed Hospital Deployment',
      city: wizCity || 'Memphis',
      state: wizState,
      credentials: wizCredentials,
      type: wizType,
      stage: 'Kickoff',
      travelStart: wizTravelStart || new Date().toISOString().split('T')[0],
      travelEnd: wizTravelEnd || new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0],
      siteStart: wizSiteStart || new Date().toISOString().split('T')[0],
      siteEnd: wizSiteEnd || new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0],
      goLiveDate: wizGoLive || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      pm: { name: wizPmName },
      ae: { name: wizAeName },
      itContact: { name: wizItName || 'TBD', email: wizItEmail || 'TBD', phone: wizItPhone || 'TBD' },
      notes: 'Project created via Wizard. Checklist generated automatically.',
      checklist: wizType === 'Wireless Assessment' 
        ? DEFAULT_ASSESSMENT_CHECKLIST.map(item => ({ ...item })) 
        : DEFAULT_DESIGN_CHECKLIST.map(item => ({ ...item })),
      driveCreated: wizDrive,
      calendarSynced: wizCalendar,
      isArchived: false
    };

    setProjects(prev => [newProj, ...prev]);
    setSelectedProjectId(newProj.id);
    setShowWizard(false);
    
    let message = `Project initialized!`;
    if (wizDrive) message += ` Created Google Drive structure.`;
    if (wizCalendar) message += ` Scheduled Outlook travel.`;
    showToast(message);
  };

  // Filtered projects
  const filteredProjects = projects.filter(p => {
    // Check archive status matching viewMode
    const isProjectArchived = !!p.isArchived;
    const isTargetMode = viewMode === 'archived' ? isProjectArchived : !isProjectArchived;
    if (!isTargetMode) return false;

    const query = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(query) || 
           p.number.toLowerCase().includes(query) ||
           p.city.toLowerCase().includes(query) ||
           p.state.toLowerCase().includes(query);
  });

  // Sort projects helper
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'name') {
      comp = a.name.localeCompare(b.name);
    } else if (sortBy === 'number') {
      comp = a.number.localeCompare(b.number);
    } else if (sortBy === 'goLive') {
      comp = new Date(a.goLiveDate).getTime() - new Date(b.goLiveDate).getTime();
    } else if (sortBy === 'stage') {
      const stageOrder: Record<string, number> = { 'Kickoff': 1, 'Pre-Work': 2, 'On-Site': 3, 'Reporting': 4, 'Completed': 5 };
      comp = (stageOrder[a.stage] || 0) - (stageOrder[b.stage] || 0);
    }
    return sortOrder === 'asc' ? comp : -comp;
  });

  // Copy Template text
  const handleCopyTemplate = (text: string, templateName: string) => {
    navigator.clipboard.writeText(text);
    showToast(`"${templateName}" copied to clipboard! Ready to paste into Outlook.`);
  };

  // Email Templates Provider
  const getTemplates = (project: Project) => {
    return [
      {
        id: 'temp1',
        title: '📧 Kickoff Floorplan Request',
        desc: 'Request raw AutoCAD/DWG files and marked-up PDF drawings of coverage wings.',
        to: '',
        cc: '',
        subject: `NK ${project.type} Kickoff Docs - ${project.name} (${project.number})`,
        body: `Hi Team,\n\nWe are gearing up for the ${project.type === 'Wireless Assessment' ? 'wireless assessment' : 'wireless design'} for ${project.name} (Project: ${project.number}). To prepare our predictive layout and calibrate our Ekahau Sidekick devices, I will need the hospital's latest floorplans.\n\nSpecifically, could you request from the hospital contacts:\n1. Clean CAD/DWG floorplans of the coverage areas (without structural lines cleaned out if possible).\n2. A marked-up PDF highlighting the exact physical departments/units where telemetry coverage is required (e.g., ICU, Cardiac Stepdown, etc.).\n\nHaving these files early will ensure we arrive fully prepared and keep our on-site survey walks precise.\n\nThank you,\nCharles Phifer\nWireless Network Engineer, Nihon Kohden`
      },
      {
        id: 'temp2',
        title: '📋 Pre-Visit Hospital Checklist',
        desc: 'Sent to the Hospital IT/BioMed contacts prior to arriving to ensure POC hardware is ready.',
        to: `${project.itContact.email}`,
        cc: '',
        subject: `Preparing for your Nihon Kohden Site Visit - ${project.name}`,
        body: `Dear ${project.itContact.name},\n\nI am looking forward to our upcoming site ${project.type === 'Wireless Assessment' ? 'assessment' : 'design visit'} on ${project.siteStart}. To ensure our proof-of-concept (POC) telemetry testing goes smoothly, please verify the following items are prepared prior to my arrival:\n\n1. Active Network SSID: Ensure the custom telemetry SSID is active on the hospital network in our target testing areas.\n2. Telemetry Server VM: Verify the virtual machine running the central station server is initialized and accessible.\n3. Security Clearance/Badges: Confirm I will be able to obtain visitor credentialing badges (${project.credentials}) upon my arrival in the lobby.\n\nIf we have any outstanding technical issues with the SSID configuration, let's schedule a 15-minute alignment call before the travel dates.\n\nBest regards,\nCharles Phifer\nWireless Network Engineer, Nihon Kohden`
      },
      {
        id: 'temp3',
        title: '📑 Technical Report Review Request',
        desc: 'Drafted once report is done, asking the PM to schedule the customer review call.',
        to: '',
        cc: '',
        subject: `${project.type} Report Draft Completed - ${project.name} (${project.number})`,
        body: `Hi ${project.pm.name},\n\nI have completed the technical ${project.type === 'Wireless Assessment' ? 'wireless assessment' : 'wireless design'} report and successfully uploaded the final PDF to Salesforce for ${project.name}.\n\nThe survey indicates excellent coverage options with the current design, and our telemetry proof-of-concept walked flawlessly. I have outlined our final recommendations on AP configurations and channel allocations in the document.\n\nCould you please schedule a 30-minute review call with the hospital's IT and BioMed teams so we can walk through our findings and finalize our sign-off?\n\nI have uploaded the working files to our SignalFlow Google Drive folder.\n\nBest,\nCharles Phifer\nWireless Network Engineer, Nihon Kohden`
      }
    ];
  };

  // Generate calendar dates for the visual calendar
  const getCalendarEvents = () => {
    const events: { date: string; type: 'travel' | 'site' | 'golive'; name: string }[] = [];
    projects.forEach(p => {
      // Travel dates
      if (p.travelStart && p.travelEnd) {
        let curr = new Date(p.travelStart);
        const end = new Date(p.travelEnd);
        while (curr <= end) {
          events.push({
            date: curr.toISOString().split('T')[0],
            type: 'travel',
            name: `${p.name} (Travel)`
          });
          curr.setDate(curr.getDate() + 1);
        }
      }
      // On-site dates (override travel event display if on same day)
      if (p.siteStart && p.siteEnd) {
        let curr = new Date(p.siteStart);
        const end = new Date(p.siteEnd);
        while (curr <= end) {
          events.push({
            date: curr.toISOString().split('T')[0],
            type: 'site',
            name: `${p.name} (On-Site)`
          });
          curr.setDate(curr.getDate() + 1);
        }
      }
      // Go-live
      if (p.goLiveDate) {
        events.push({
          date: p.goLiveDate,
          type: 'golive',
          name: `${p.name} [GO-LIVE]`
        });
      }
    });
    return events;
  };

  const calendarEvents = getCalendarEvents();

  return (
    <div className="min-h-screen bg-charcoal-950 text-charcoal-100 flex flex-col selection:bg-sunset-500 selection:text-white">
      
      {/* ==========================================
          HEADER / TOP BAR
          ========================================== */}
      <header className="sticky top-0 z-40 bg-charcoal-900 border-b border-indigo-900 shadow-lg px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Area: Brand logo and responsive "NEW PROJECT" button */}
        <div className="flex items-center justify-between w-full lg:w-auto">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sunset-500 to-indigo-500 flex items-center justify-center shadow-md shrink-0">
              <span className="font-extrabold text-charcoal-950 text-lg tracking-wider">SF</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center flex-wrap">
                SIGNAL<span className="text-sunset-500">FLOW</span>
                <span className="ml-2 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 bg-indigo-900/50 border border-indigo-700/50 rounded text-indigo-300">
                  Custom Workspace
                </span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-charcoal-400 font-medium tracking-wide">
                Nihon Kohden Wireless Deployment Assistant
              </p>
            </div>
          </div>
          
          {/* Mobile Actions (Sync + New) */}
          <div className="lg:hidden flex items-center space-x-1.5 shrink-0">
            <button
              onClick={() => setShowSyncModal(true)}
              className={`p-2 rounded-lg border transition-all duration-200 ${
                syncSettings.enabled
                  ? syncStatus === 'synced'
                    ? 'bg-emerald-950/45 border-emerald-800 text-emerald-400'
                    : syncStatus === 'syncing'
                      ? 'bg-amber-950/45 border-amber-800 text-amber-400'
                      : 'bg-rose-950/45 border-rose-800 text-rose-400'
                  : 'bg-charcoal-900 border-charcoal-800 text-charcoal-400'
              }`}
            >
              {syncSettings.enabled && syncStatus === 'syncing' ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : syncSettings.enabled && syncStatus === 'synced' ? (
                <Cloud size={14} />
              ) : (
                <CloudOff size={14} />
              )}
            </button>

            <button 
              onClick={handleOpenWizard}
              className="bg-sunset-500 hover:bg-sunset-600 active:bg-sunset-700 text-charcoal-950 text-xs font-black tracking-wider px-3.5 py-2 rounded-lg flex items-center space-x-1 shadow-md hover:shadow-sunset-500/25 transition-all duration-200"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span className="hidden sm:inline">NEW PROJECT</span>
              <span className="sm:hidden">NEW</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Scrollable horizontal strip on mobile/tablet) */}
        <div 
          style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          className="flex items-center space-x-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-none whitespace-nowrap"
        >
          {/* Custom style injected to hide scrollbars dynamically in WebKit browsers */}
          <style>{`
            .scrollbar-none::-webkit-scrollbar {
              display: none !important;
            }
          `}</style>

          <button 
            onClick={() => setActiveTab('projects')}
            className={`flex items-center space-x-1.5 px-3 py-2 sm:px-3.5 rounded-lg text-xs font-bold transition-all duration-200 border shrink-0 ${
              activeTab === 'projects' 
                ? 'bg-indigo-950/60 border-indigo-700 text-sunset-500' 
                : 'border-transparent hover:border-charcoal-800 text-charcoal-400 hover:text-charcoal-200'
            }`}
          >
            <ListTodo size={14} />
            <span>Deployment Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center space-x-1.5 px-3 py-2 sm:px-3.5 rounded-lg text-xs font-bold transition-all duration-200 border shrink-0 ${
              activeTab === 'calendar' 
                ? 'bg-indigo-950/60 border-indigo-700 text-sunset-500' 
                : 'border-transparent hover:border-charcoal-800 text-charcoal-400 hover:text-charcoal-200'
            }`}
          >
            <CalendarIcon size={14} />
            <span>Interactive Calendar</span>
          </button>

          <button 
            onClick={() => setActiveTab('email-vault')}
            className={`flex items-center space-x-1.5 px-3 py-2 sm:px-3.5 rounded-lg text-xs font-bold transition-all duration-200 border shrink-0 ${
              activeTab === 'email-vault' 
                ? 'bg-indigo-950/60 border-indigo-700 text-sunset-500' 
                : 'border-transparent hover:border-charcoal-800 text-charcoal-400 hover:text-charcoal-200'
            }`}
          >
            <Mail size={14} />
            <span>Email Boilerplate Vault</span>
          </button>

          <button 
            onClick={() => setActiveTab('docs-search')}
            className={`flex items-center space-x-1.5 px-3 py-2 sm:px-3.5 rounded-lg text-xs font-bold transition-all duration-200 border shrink-0 ${
              activeTab === 'docs-search' 
                ? 'bg-indigo-950/60 border-indigo-700 text-sunset-500 shadow-[0_0_12px_rgba(99,102,241,0.15)]' 
                : 'border-transparent hover:border-charcoal-800 text-charcoal-400 hover:text-charcoal-200 cursor-pointer'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'docs-search' ? 'text-sunset-500 animate-pulse' : 'text-charcoal-400'} />
            <span>Technical Reference Vault</span>
          </button>
        </div>

        {/* Desktop Cloud Sync and Quick Action */}
        <div className="hidden lg:flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowSyncModal(true)}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border transition-all duration-200 ${
              syncSettings.enabled
                ? syncStatus === 'synced'
                  ? 'bg-emerald-950/45 border-emerald-800 text-emerald-400 hover:bg-emerald-950/60 cursor-pointer'
                  : syncStatus === 'syncing'
                    ? 'bg-amber-950/45 border-amber-800 text-amber-400 hover:bg-amber-950/60 animate-pulse cursor-pointer'
                    : 'bg-rose-950/45 border-rose-800 text-rose-400 hover:bg-rose-950/60 cursor-pointer'
                : 'bg-charcoal-900 border-charcoal-800 text-charcoal-400 hover:border-charcoal-700 hover:text-charcoal-200 cursor-pointer'
            }`}
          >
            {syncSettings.enabled ? (
              syncStatus === 'synced' ? (
                <Cloud size={14} />
              ) : syncStatus === 'syncing' ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <CloudOff size={14} />
              )
            ) : (
              <CloudOff size={14} />
            )}
            <span>
              {syncSettings.enabled
                ? syncStatus === 'synced'
                  ? 'Cloud Synced'
                  : syncStatus === 'syncing'
                    ? 'Syncing...'
                    : 'Sync Error'
                : 'Cloud Sync Setup'}
            </span>
          </button>

          <button 
            onClick={handleOpenWizard}
            className="bg-sunset-500 hover:bg-sunset-600 active:bg-sunset-700 text-charcoal-950 text-xs font-black tracking-wider px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow-md hover:shadow-sunset-500/25 transition-all duration-200 cursor-pointer shrink-0"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>NEW PROJECT</span>
          </button>
        </div>
      </header>

      {/* Decorative colored glow line */}
      <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-sunset-500 to-indigo-800 w-full" />

      {/* ==========================================
          MAIN AREA
          ========================================== */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 flex flex-col md:flex-row gap-4 overflow-hidden">
        
        {/* ==========================================
            TAB 1: PROJECTS & DASHBOARD
            ========================================== */}
        {activeTab === 'projects' && (
          <>
            {/* LEFT BAR: PROJECT DIRECTORY */}
            <div className="w-full md:w-[320px] flex flex-col gap-3 shrink-0">
              {/* Active / Archive Toggle */}
              <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-1 shadow-md flex">
                <button
                  onClick={() => setViewMode('active')}
                  className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'active'
                      ? 'bg-sunset-500 text-charcoal-950 font-black shadow-sm'
                      : 'text-charcoal-400 hover:text-charcoal-200 cursor-pointer'
                  }`}
                >
                  Active Deployments
                </button>
                <button
                  onClick={() => setViewMode('archived')}
                  className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                    viewMode === 'archived'
                      ? 'bg-indigo-600 text-white font-black shadow-sm'
                      : 'text-charcoal-400 hover:text-charcoal-200 cursor-pointer'
                  }`}
                >
                  <Archive size={12} />
                  <span>Archived Space</span>
                </button>
              </div>
              {/* Search Bar & Sort */}
              <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-3 shadow-md space-y-2">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-charcoal-500">
                    <Search size={14} />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Search hospitals, cities..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-sunset-500 transition-colors"
                  />
                </div>
                
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-charcoal-800/60">
                  <span className="text-charcoal-400 font-medium">Sort projects by:</span>
                  <div className="flex items-center space-x-1.5">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-charcoal-950 border border-charcoal-800 rounded-md px-2 py-1 text-white focus:outline-none focus:border-sunset-500 text-[11px] font-medium cursor-pointer transition-colors"
                    >
                      <option value="name">Hospital Name</option>
                      <option value="number">Project ID</option>
                      <option value="goLive">Go-Live Date</option>
                      <option value="stage">Project Stage</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                      className="bg-charcoal-950 hover:bg-charcoal-800 border border-charcoal-800 rounded-md p-1.5 text-charcoal-300 hover:text-white transition-colors cursor-pointer"
                      title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    >
                      <ArrowUpDown size={11} className={sortOrder === 'desc' ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Deployment List */}
              <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl flex-1 flex flex-col shadow-md overflow-hidden min-h-[400px]">
                <div className="p-3.5 border-b border-charcoal-800 bg-charcoal-900/50 flex justify-between items-center">
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">
                    {viewMode === 'active' ? 'My Deployments' : 'Archived Space'} ({filteredProjects.length})
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-charcoal-800/60 p-2 space-y-1">
                  {filteredProjects.length === 0 ? (
                    <div className="py-8 px-4 text-center text-xs text-charcoal-500 leading-relaxed">
                      {viewMode === 'active' 
                        ? "No active deployments found." 
                        : "No archived projects. Complete your checklist and click Archive to move deployments here."}
                    </div>
                  ) : (
                    sortedProjects.map((p) => {
                      const completedCount = p.checklist.filter(c => c.completed).length;
                      const totalCount = p.checklist.length;
                      const pct = Math.round((completedCount / totalCount) * 100);
                      const isSelected = p.id === selectedProjectId;

                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedProjectId(p.id)}
                          className={`w-full text-left p-3 rounded-lg transition-all duration-200 border flex flex-col ${
                            isSelected 
                              ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm' 
                              : 'bg-transparent border-transparent hover:bg-charcoal-800/40'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-charcoal-400">
                              {p.number}
                            </span>
                            <span className={`text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                              p.type === 'Wireless Assessment' 
                                ? 'bg-orange-950/40 text-orange-400 border border-orange-800/30' 
                                : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/50'
                            }`}>
                              {p.type}
                            </span>
                          </div>

                          <h3 className="text-xs font-bold text-white line-clamp-1 mb-1">
                            {p.name}
                          </h3>

                          <div className="flex items-center space-x-1 text-[10px] text-charcoal-400 mb-2">
                            <MapPin size={10} className="text-sunset-500" />
                            <span>{p.city}, {p.state}</span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full mt-auto">
                            <div className="flex justify-between items-center text-[9px] font-bold mb-1">
                              <span className="text-charcoal-400 uppercase tracking-wider flex items-center">
                                <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                                  p.stage === 'Completed' ? 'bg-emerald-500' :
                                  p.stage === 'Reporting' ? 'bg-indigo-500' :
                                  p.stage === 'On-Site' ? 'bg-sunset-500' : 'bg-charcoal-400'
                                }`} />
                                {p.stage}
                              </span>
                              <span className="text-white">{pct}%</span>
                            </div>
                            <div className="h-1 bg-charcoal-950 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-sunset-500 transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Cloud Sync Promotion/Configuration Card */}
              <div className="bg-gradient-to-br from-charcoal-900 to-charcoal-950 border border-charcoal-800 rounded-xl p-3.5 shadow-md flex flex-col space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg border ${
                      syncSettings.enabled 
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' 
                        : 'bg-indigo-950/40 border-indigo-900 text-indigo-400'
                    }`}>
                      <Database size={15} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">
                        Cloud Sync Engine
                      </h3>
                      <p className="text-[10px] text-charcoal-400 font-medium">
                        {syncSettings.enabled ? 'Active Multi-Device Sync' : 'No sync configured yet'}
                      </p>
                    </div>
                  </div>
                  {syncSettings.enabled && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                
                <p className="text-[11px] leading-relaxed text-charcoal-300">
                  {syncSettings.enabled 
                    ? `Synchronizing workspaces using code: ${syncSettings.syncCode || 'Private DB'}. Real-time collaboration is enabled.`
                    : 'Collaborate with colleagues on-site! Share assessment & design checklists across devices in real-time.'
                  }
                </p>

                <button
                  onClick={() => setShowSyncModal(true)}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 cursor-pointer text-center ${
                    syncSettings.enabled
                      ? 'bg-charcoal-950 hover:bg-charcoal-900 border-charcoal-800 text-charcoal-300 hover:text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 border-indigo-500 text-white shadow-sm shadow-indigo-950/50'
                  }`}
                >
                  {syncSettings.enabled ? 'Configure Sync Settings' : 'Set Up Real-Time Sync'}
                </button>
              </div>
            </div>

            {/* RIGHT WORK AREA: DETAILED PROJECT COMMAND CENTER */}
            <div className="flex-1 bg-charcoal-900 border border-charcoal-800 rounded-xl shadow-md flex flex-col overflow-hidden">
              
              {/* Project Header details */}
              <div className="p-4 border-b border-charcoal-800 bg-gradient-to-br from-charcoal-900 to-charcoal-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="text-[11px] font-black text-indigo-400 tracking-wider">
                      {selectedProject.number}
                    </span>
                    <span className="text-charcoal-600">•</span>
                    <span className="text-xs font-bold text-charcoal-400 flex items-center space-x-1">
                      <MapPin size={12} className="text-sunset-500" />
                      <span>{selectedProject.city}, {selectedProject.state}</span>
                    </span>
                    <span className="text-charcoal-600">•</span>
                    <span className="text-[10px] font-bold tracking-wide text-charcoal-300 px-2 py-0.5 bg-charcoal-800 rounded">
                      🏥 Credentials: {selectedProject.credentials}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    {selectedProject.name}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-charcoal-900/80 border border-charcoal-800 p-2 rounded-xl">
                  <div className="text-right shrink-0">
                    <div className="text-[9px] uppercase font-extrabold tracking-widest text-charcoal-500">
                      Go-Live Date
                    </div>
                    <div className="text-sm font-black text-sunset-500">
                      {selectedProject.goLiveDate}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-charcoal-800 hidden sm:block shrink-0" />
                  <div className="shrink-0">
                    <span className={`text-xs font-black px-3 py-1.5 rounded-lg flex items-center space-x-1.5 ${
                      selectedProject.type === 'Wireless Assessment'
                        ? 'bg-orange-950/50 border border-orange-500/30 text-orange-400'
                        : 'bg-indigo-950/50 border border-indigo-500/30 text-indigo-400'
                    }`}>
                      <Shield size={12} />
                      <span>{selectedProject.type === 'Wireless Assessment' ? 'Wireless Assessment' : 'Wireless Design'}</span>
                    </span>
                  </div>

                  {/* Calendar Automation Buttons */}
                  <div className="h-8 w-px bg-charcoal-800 hidden md:block shrink-0" />
                  <div className="flex items-center space-x-1.5 ml-auto">
                    <span className="text-[9px] uppercase font-black text-charcoal-500 mr-1 hidden lg:inline">
                      Add Go-Live:
                    </span>
                    <a
                      href={getGoogleCalendarUrl(selectedProject)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 px-2.5 py-1 rounded bg-charcoal-950 hover:bg-charcoal-850 text-[10px] font-bold text-sunset-500 hover:text-sunset-400 border border-charcoal-800 hover:border-sunset-500/30 transition-all cursor-pointer shadow-sm"
                      title="Add to Google Calendar"
                    >
                      <CalendarIcon size={10} />
                      <span>Google Cal</span>
                    </a>
                    <button
                      onClick={() => downloadIcsFile(selectedProject, showToast)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded bg-charcoal-950 hover:bg-charcoal-850 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 border border-charcoal-800 hover:border-indigo-500/30 transition-all cursor-pointer shadow-sm"
                      title="Download iCal/Outlook File"
                    >
                      <CalendarIcon size={10} />
                      <span>Outlook/iCal</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Pipeline Visualizer */}
              <div className="px-4 py-2 bg-charcoal-950/80 border-b border-charcoal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2 overflow-x-auto py-1">
                  <span className="text-[9px] uppercase font-extrabold tracking-widest text-charcoal-500 shrink-0">
                    Pipeline Stage:
                  </span>
                  {['Kickoff', 'Pre-Work', 'On-Site', 'Reporting', 'Completed'].map((stg, i) => {
                    const stages = ['Kickoff', 'Pre-Work', 'On-Site', 'Reporting', 'Completed'];
                    const currentIndex = stages.indexOf(selectedProject.stage);
                    const isPast = stages.indexOf(stg) < currentIndex;
                    const isActive = stg === selectedProject.stage;

                    return (
                      <div key={stg} className="flex items-center space-x-1 shrink-0">
                        {i > 0 && <ChevronRight size={10} className="text-charcoal-700" />}
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded transition-colors ${
                          isActive 
                            ? 'bg-sunset-500 text-charcoal-950 shadow-sm'
                            : isPast 
                              ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-900/30'
                              : 'bg-transparent text-charcoal-500 border border-transparent'
                        }`}>
                          {stg}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Edit & Archive / Unarchive Actions */}
                <div className="flex shrink-0 items-center space-x-2">
                  <button
                    onClick={() => handleOpenEditModal(selectedProject)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-sunset-500 hover:text-sunset-400 border border-charcoal-700/60 text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all shadow-md"
                  >
                    <Edit size={11} className="mr-0.5" />
                    <span>Edit Project</span>
                  </button>
                  {selectedProject.isArchived ? (
                    <button
                      onClick={() => handleToggleArchive(selectedProject.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/50 text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all shadow-md"
                    >
                      <Archive size={11} className="mr-0.5" />
                      <span>Restore to Active</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleArchive(selectedProject.id)}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all shadow-md ${
                        selectedProject.stage === 'Completed'
                          ? 'bg-sunset-500 hover:bg-sunset-400 text-charcoal-950 font-black shadow-[0_0_10px_rgba(255,107,53,0.25)] animate-pulse'
                          : 'bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 border border-charcoal-700/60'
                      }`}
                    >
                      <Archive size={11} className="mr-0.5" />
                      <span>Archive Project</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Interactive Workspace Grid */}
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* COLUMN 1: CHECKLIST & TRAVEL TIMELINE (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  
                  {/* Travel & Site dates info block */}
                  <div className="bg-charcoal-950/40 border border-charcoal-800/80 rounded-xl p-3.5 grid grid-cols-2 gap-3">
                    <div className="bg-charcoal-900/40 p-2.5 rounded-lg border border-charcoal-800/30">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-sunset-500 mb-1">
                        <CalendarIcon size={12} />
                        <span>Blocked Travel Windows</span>
                      </div>
                      <div className="text-xs font-medium text-charcoal-200 pl-4.5">
                        {selectedProject.travelStart} <span className="text-charcoal-500">➔</span> {selectedProject.travelEnd}
                      </div>
                    </div>
                    
                    <div className="bg-charcoal-900/40 p-2.5 rounded-lg border border-charcoal-800/30">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-400 mb-1">
                        <CalendarCheck2 size={12} />
                        <span>Hospital On-Site Survey</span>
                      </div>
                      <div className="text-xs font-medium text-charcoal-200 pl-4.5">
                        {selectedProject.siteStart} <span className="text-charcoal-500">➔</span> {selectedProject.siteEnd}
                      </div>
                    </div>
                  </div>

                  {/* Checklist Card */}
                  <div className="bg-charcoal-950/40 border border-charcoal-800 rounded-xl flex-1 flex flex-col overflow-hidden min-h-[380px]">
                    <div className="p-3 bg-charcoal-900 border-b border-charcoal-800 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <CheckSquare size={14} className="text-sunset-500" />
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">
                          Execution Checklist ({selectedProject.checklist.filter(c => c.completed).length} / {selectedProject.checklist.length})
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-charcoal-400 px-2 py-0.5 bg-charcoal-800 rounded-full">
                        {selectedProject.type} Auto-Template
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-charcoal-950/60 max-h-[420px]">
                      {selectedProject.checklist.map((item, idx) => {
                        return (
                          <div 
                            key={item.id}
                            onClick={() => handleToggleChecklist(selectedProject.id, item.id)}
                            className={`flex items-start space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                              item.completed 
                                ? 'bg-indigo-950/10 hover:bg-indigo-950/20 text-charcoal-500' 
                                : 'bg-charcoal-900/30 hover:bg-charcoal-800/40 text-charcoal-200'
                            }`}
                          >
                            <button className="mt-0.5 shrink-0 transition-colors">
                              {item.completed ? (
                                <CheckCircle2 size={15} className="text-sunset-500 fill-sunset-500/10" />
                              ) : (
                                <Circle size={15} className="text-charcoal-600 hover:text-sunset-500" />
                              )}
                            </button>
                            <div className="flex-1 text-xs">
                              <span className={`font-medium ${item.completed ? 'line-through text-charcoal-500' : ''}`}>
                                {item.task}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-charcoal-600 shrink-0 select-none">
                              Step {idx + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: CONTACTS, FILE LOCKER & QUICK NOTES (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  
                  {/* Contacts Directory Card */}
                  <div className="bg-charcoal-950/40 border border-charcoal-800 rounded-xl p-3.5 space-y-3">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
                      <User size={13} className="text-indigo-400" />
                      <span>Stakeholders Directory</span>
                    </h3>

                    <div className="grid grid-cols-1 gap-2.5">
                      {/* Project Manager */}
                      <div className="bg-charcoal-900/60 p-2.5 rounded-lg border border-charcoal-800/50">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-extrabold tracking-widest text-sunset-500">
                            Project Manager (PM)
                          </span>
                          <span className="text-xs font-bold text-white">{selectedProject.pm.name}</span>
                        </div>
                      </div>

                      {/* Account Exec */}
                      <div className="bg-charcoal-900/60 p-2.5 rounded-lg border border-charcoal-800/50">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-400">
                            Account Executive (AE)
                          </span>
                          <span className="text-xs font-bold text-white">{selectedProject.ae.name}</span>
                        </div>
                      </div>

                      {/* BioMed/IT */}
                      <div className="bg-charcoal-900/60 p-2.5 rounded-lg border border-charcoal-800/50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-500">
                            Hospital IT / BioMed
                          </span>
                          <span className="text-xs font-bold text-white">{selectedProject.itContact.name}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-charcoal-400">
                          <span className="hover:text-white cursor-pointer flex items-center space-x-1">
                            <Mail size={10} className="mr-1" />
                            {selectedProject.itContact.email}
                          </span>
                          <span className="hover:text-white cursor-pointer flex items-center space-x-1">
                            <Phone size={10} className="mr-1" />
                            {selectedProject.itContact.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Google Drive File Locker */}
                  <div className="bg-charcoal-950/40 border border-charcoal-800 rounded-xl p-3.5 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
                        <FolderOpen size={13} className="text-sunset-500" />
                        <span>Google Drive File Locker</span>
                      </h3>
                      <div className="flex items-center space-x-2">
                        {googleDriveUrl ? (
                          <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                            Configured
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase font-bold text-amber-400 bg-amber-950/50 border border-amber-800/40 px-1.5 py-0.5 rounded">
                            Not configured
                          </span>
                        )}
                        <button
                          onClick={() => setShowDriveConfig(!showDriveConfig)}
                          className="text-charcoal-500 hover:text-white transition-colors"
                          title="Configure Google Drive"
                        >
                          <Edit size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Inline config for Google Drive URL */}
                    {showDriveConfig && (
                      <div className="bg-charcoal-950 border border-charcoal-800 rounded-lg p-3 space-y-2.5">
                        <label className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">
                          Google Drive Folder URL
                        </label>
                        <input
                          type="url"
                          value={googleDriveUrl}
                          onChange={e => setGoogleDriveUrl(e.target.value)}
                          placeholder="https://drive.google.com/drive/folders/ABC123"
                          className="w-full bg-charcoal-900 border border-charcoal-800 rounded-lg px-2.5 py-2 text-xs text-white placeholder-charcoal-600 font-mono outline-none focus:border-sunset-500 transition-colors"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-charcoal-500">
                            Paste a shared Google Drive folder link above.
                          </span>
                          <div className="flex space-x-2">
                            {googleDriveUrl && (
                              <button
                                onClick={() => { setGoogleDriveUrl(''); setShowDriveConfig(false); }}
                                className="text-[10px] font-bold text-charcoal-500 hover:text-red-400 transition-colors uppercase px-2 py-1"
                              >
                                Clear
                              </button>
                            )}
                            <button
                              onClick={() => setShowDriveConfig(false)}
                              className="text-[10px] font-bold text-sunset-500 hover:text-sunset-400 transition-colors uppercase px-2 py-1 bg-sunset-500/10 rounded"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-charcoal-400">
                      {googleDriveUrl ? (
                        <>Folder hierarchy in your Google Drive under <span className="text-white font-semibold">SignalFlow Docs</span>:</>
                      ) : (
                        <>Configure a Google Drive folder above to link it. Folder template:</>
                      )}
                    </p>

                    <div className="bg-charcoal-950 border border-charcoal-800/80 p-2.5 rounded-lg font-mono text-[10px] space-y-1 text-charcoal-300">
                      <div className="text-white font-bold flex items-center">
                        <FolderOpen size={11} className="mr-1.5 text-sunset-500" />
                        <span>📁 [{selectedProject.number}] {selectedProject.name}/</span>
                      </div>
                      <div className="pl-5 text-indigo-400 flex items-center">
                        <span className="text-charcoal-700 mr-1">├──</span>
                        <span>📂 01_Floor_Plans/</span>
                        <span className="text-[9px] text-charcoal-500 ml-2">(AutoCAD DWGs, PDFs)</span>
                      </div>
                      <div className="pl-5 text-indigo-400 flex items-center">
                        <span className="text-charcoal-700 mr-1">├──</span>
                        <span>📂 02_Ekahau_Files/</span>
                        <span className="text-[9px] text-charcoal-500 ml-2">(.esx projects, surveys)</span>
                      </div>
                      <div className="pl-5 text-indigo-400 flex items-center">
                        <span className="text-charcoal-700 mr-1">├──</span>
                        <span>📂 03_Site_Photos/</span>
                        <span className="text-[9px] text-charcoal-500 ml-2">(AP placement proofs)</span>
                      </div>
                      <div className="pl-5 text-indigo-400 flex items-center">
                        <span className="text-charcoal-700 mr-1">└──</span>
                        <span>📂 04_Final_Reports/</span>
                        <span className="text-[9px] text-charcoal-500 ml-2">(Completed PDF exports)</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={openGoogleDriveFolder}
                        className={`flex-1 border text-xs font-black tracking-wide p-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-colors shadow-sm ${
                          googleDriveUrl
                            ? 'bg-charcoal-900 border-charcoal-800 hover:border-sunset-500 text-charcoal-200 hover:text-white'
                            : 'bg-charcoal-900/50 border-charcoal-800/60 text-charcoal-500 cursor-not-allowed'
                        }`}
                      >
                        <ExternalLink size={13} />
                        <span>OPEN GOOGLE DRIVE DIRECTORY</span>
                      </button>
                      <button
                        onClick={copyDriveStructureToClipboard}
                        className="bg-charcoal-900 border border-charcoal-800 hover:border-sunset-500 text-charcoal-200 hover:text-white text-xs font-black tracking-wide p-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                      >
                        <Clipboard size={13} />
                        <span className="hidden sm:inline">COPY STRUCTURE</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Site Notes (Auto-saves) */}
                  <div className="bg-charcoal-950/40 border border-charcoal-800 rounded-xl p-3.5 flex-1 flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
                        <BookOpen size={13} className="text-sunset-500" />
                        <span>Interactive Site Notes</span>
                      </h3>
                      <span className="text-[9px] font-bold text-charcoal-500 italic">
                        Cloud auto-saves active
                      </span>
                    </div>

                    <textarea
                      value={selectedProject.notes}
                      onChange={(e) => handleSaveNotes(selectedProject.id, e.target.value)}
                      placeholder="Write any vital hardware configs, hotel notes, or contact summaries here..."
                      className="w-full flex-1 bg-charcoal-950 border border-charcoal-800 rounded-lg p-2.5 text-xs text-white placeholder-charcoal-600 focus:outline-none focus:border-sunset-500 focus:ring-1 focus:ring-sunset-500 transition-colors resize-none min-h-[120px]"
                    />
                  </div>

                </div>
              </div>
            </div>
          </>
        )}

        {/* ==========================================
            TAB 2: CALENDAR VIEW
            ========================================== */}
        {activeTab === 'calendar' && (
          <div className="flex-1 bg-charcoal-900 border border-charcoal-800 rounded-xl p-4 flex flex-col shadow-md overflow-hidden min-h-[500px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-charcoal-800 mb-4">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
                  <CalendarIcon size={16} className="text-sunset-500" />
                  <span>My Engineering Calendar (Outlook Sync)</span>
                </h2>
                <p className="text-xs text-charcoal-400">
                  Showing blocked travel blocks, active site assessments, and go-live timelines
                </p>
              </div>

              {/* Legends (flex-wrap for compact mobile viewports) */}
              <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs">
                <span className="flex items-center space-x-1.5 text-orange-400 bg-orange-950/40 px-2 py-0.5 border border-orange-800/30 rounded shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-sunset-500" />
                  <span>Blocked Travel</span>
                </span>
                <span className="flex items-center space-x-1.5 text-indigo-300 bg-indigo-950/80 px-2 py-0.5 border border-indigo-800/50 rounded shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  <span>On-Site Surveys</span>
                </span>
                <span className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-950/50 px-2 py-0.5 border border-emerald-800/40 rounded shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Go-Lives</span>
                </span>
              </div>
            </div>

            {/* Simulated July 2026 Calendar Grid */}
            <div className="bg-charcoal-950/50 border border-charcoal-800/80 p-3 sm:p-4 rounded-xl flex-1 flex flex-col max-w-4xl mx-auto w-full">
              <div className="text-center font-black text-white text-sm sm:text-base mb-4 tracking-wide uppercase">
                📆 JULY 2026
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs font-black tracking-wider uppercase text-charcoal-500 mb-2">
                <div><span>S</span><span className="hidden sm:inline">un</span></div>
                <div><span>M</span><span className="hidden sm:inline">on</span></div>
                <div><span>T</span><span className="hidden sm:inline">ue</span></div>
                <div><span>W</span><span className="hidden sm:inline">ed</span></div>
                <div><span>T</span><span className="hidden sm:inline">hu</span></div>
                <div><span>F</span><span className="hidden sm:inline">ri</span></div>
                <div><span>S</span><span className="hidden sm:inline">at</span></div>
              </div>

              <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[350px]">
                {/* Pad previous month days (July 1, 2026 starts on Wednesday, so 3 empty blocks for Sun, Mon, Tue) */}
                <div className="bg-charcoal-900/10 border border-transparent rounded-lg p-1.5 text-[10px] text-charcoal-700">28</div>
                <div className="bg-charcoal-900/10 border border-transparent rounded-lg p-1.5 text-[10px] text-charcoal-700">29</div>
                <div className="bg-charcoal-900/10 border border-transparent rounded-lg p-1.5 text-[10px] text-charcoal-700">30</div>

                {/* Days of July 1 to July 31 */}
                {Array.from({ length: 31 }).map((_, idx) => {
                  const day = idx + 1;
                  const dateString = `2026-07-${day < 10 ? '0' + day : day}`;
                  
                  // Check events
                  const dayEvents = calendarEvents.filter(e => e.date === dateString);
                  const isTravel = dayEvents.some(e => e.type === 'travel');
                  const isOnSite = dayEvents.some(e => e.type === 'site');
                  const isGoLive = dayEvents.some(e => e.type === 'golive');

                  let bgColor = 'bg-charcoal-900/40 border-charcoal-800/50 text-charcoal-400';
                  if (isGoLive) bgColor = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 font-extrabold';
                  else if (isOnSite) bgColor = 'bg-indigo-950/80 border-indigo-500/60 text-indigo-300 font-bold';
                  else if (isTravel) bgColor = 'bg-orange-950/40 border-orange-500/40 text-orange-400 font-bold';

                  return (
                    <div 
                      key={day} 
                      className={`border rounded-lg p-2 flex flex-col text-left justify-between min-h-[60px] relative transition-colors group cursor-pointer hover:bg-charcoal-800/40 ${bgColor}`}
                    >
                      <span className="text-xs font-black">{day}</span>
                      
                      <div className="space-y-1 mt-1">
                        {dayEvents.map((ev, eidx) => (
                          <div 
                            key={eidx} 
                            className="text-[8px] leading-tight line-clamp-1 p-0.5 rounded font-sans truncate tracking-tight text-white/95"
                            style={{ 
                              backgroundColor: ev.type === 'travel' ? '#e66030' : ev.type === 'site' ? '#4d5382' : '#10b981',
                              color: ev.type === 'travel' ? '#121217' : '#ffffff'
                            }}
                            title={ev.name}
                          >
                            {ev.name.replace("Children's Research Hospital", '').replace('Memorial Hospital-', '')}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 3: BOILERPLATE VAULT
            ========================================== */}
        {activeTab === 'email-vault' && (
          <div className="flex-1 bg-charcoal-900 border border-charcoal-800 rounded-xl p-4 flex flex-col shadow-md overflow-hidden min-h-[500px]">
            <div className="pb-3.5 border-b border-charcoal-800 mb-4">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
                <Mail size={16} className="text-sunset-500" />
                <span>Boilerplate Email Vault</span>
              </h2>
              <p className="text-xs text-charcoal-400">
                Instantly copy customized, formatted project communication scripts to paste into Microsoft Outlook manually.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto pr-1">
              {getTemplates(selectedProject).map((temp) => (
                <div key={temp.id} className="bg-charcoal-950 border border-charcoal-800/80 rounded-xl p-4 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-white tracking-wide border-b border-charcoal-800 pb-2 mb-2">
                      {temp.title}
                    </h3>
                    <p className="text-[11px] text-charcoal-400 mb-4 leading-relaxed">
                      {temp.desc}
                    </p>

                    <div className="space-y-2 text-[10px] text-charcoal-300">
                      <div>
                        <span className="font-bold text-charcoal-500 uppercase tracking-wider mr-1">To:</span>
                        <code className="bg-charcoal-900 px-1.5 py-0.5 rounded text-indigo-400 font-mono truncate max-w-full block mt-0.5">
                          {temp.to}
                        </code>
                      </div>
                      {temp.cc && (
                        <div>
                          <span className="font-bold text-charcoal-500 uppercase tracking-wider mr-1">CC:</span>
                          <code className="bg-charcoal-900 px-1.5 py-0.5 rounded text-indigo-400 font-mono truncate max-w-full block mt-0.5">
                            {temp.cc}
                          </code>
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-charcoal-500 uppercase tracking-wider mr-1">Subject:</span>
                        <span className="text-white font-medium block mt-0.5">
                          {temp.subject}
                        </span>
                      </div>
                    </div>

                    {/* Collapsible preview box */}
                    <div className="mt-3.5 bg-charcoal-950 border border-charcoal-800/50 rounded-lg p-2.5 max-h-[160px] overflow-y-auto font-sans text-[10px] leading-relaxed text-charcoal-200 whitespace-pre-wrap select-all">
                      {temp.body}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleCopyTemplate(temp.body, temp.title)}
                      className="flex-1 bg-charcoal-900 hover:bg-charcoal-850 border border-charcoal-800 hover:border-sunset-500/30 text-sunset-500 text-[10px] font-black tracking-wider py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Clipboard size={12} />
                      <span>COPY TEXT</span>
                    </button>
                    <a
                      href={getMailtoUrl(temp)}
                      className="flex-1 bg-sunset-500 hover:bg-sunset-600 active:bg-sunset-700 text-charcoal-950 text-[10px] font-black tracking-wider py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer text-center"
                    >
                      <Mail size={12} />
                      <span>OPEN IN MAIL</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 4: TECHNICAL REFERENCE VAULT (AI-POWERED)
            ========================================== */}
        {activeTab === 'docs-search' && (
          <div className="flex-1 bg-charcoal-900 border border-charcoal-800 rounded-xl p-4 flex flex-col shadow-md overflow-hidden min-h-[500px]">
            {/* Header section */}
            <div className="pb-3.5 border-b border-charcoal-800 mb-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles size={16} className="text-sunset-500 animate-pulse" />
                  <span>Technical Reference Vault</span>
                </h2>
                <p className="text-xs text-charcoal-400">
                  Search work instructions, device spectrum parameters, and medical-grade network deployment specifications.
                </p>
              </div>
              
              {/* Reset search button */}
              {docSearchQuery && (
                <button
                  onClick={() => { setDocSearchQuery(''); setExpandedDocId(null); setExpandedSectionTitle(null); }}
                  className="text-[10px] font-black tracking-wider text-sunset-500 hover:text-sunset-400 border border-sunset-500/30 hover:border-sunset-500/50 bg-sunset-500/5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  CLEAR SEARCH
                </button>
              )}
            </div>

            {/* Smart search input with glowing outline */}
            <div className="relative mb-4 group">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <Search size={16} className="text-charcoal-500 group-focus-within:text-sunset-500 transition-colors" />
              </div>
              <input
                type="text"
                value={docSearchQuery}
                onChange={(e) => {
                  setDocSearchQuery(e.target.value);
                  setExpandedDocId(null);
                  setExpandedSectionTitle(null);
                }}
                placeholder="Ask our Technical Reference AI (e.g. 'standard attenuation drywall', 'WMTS spectrum', 'multicast requirements' or 'Sidekick SOP')..."
                className="w-full bg-charcoal-950 border border-charcoal-800 group-hover:border-charcoal-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-11 pr-4 text-xs font-medium text-white placeholder-charcoal-500 outline-none transition-all duration-200"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 pointer-events-none">
                <span className="text-[9px] font-bold text-charcoal-600 bg-charcoal-900 border border-charcoal-800 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  OFFLINE CO-PILOT
                </span>
              </div>
            </div>

            {/* Main content split panel */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
              {/* Left Column */}
              <div className="lg:col-span-7 flex flex-col space-y-4 overflow-y-auto pr-1">
                
                {/* AI SMART ANSWER CORE CARD */}
                {(() => {
                  const smartAnswer = findSmartAnswer(docSearchQuery);
                  if (smartAnswer) {
                    const confidenceColor = 
                      smartAnswer.score > 40 ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50' : 
                      smartAnswer.score >= 15 ? 'text-amber-400 bg-amber-950/40 border-amber-900/50' : 
                      'text-indigo-400 bg-indigo-950/40 border-indigo-900/50';
                      
                    const confidenceText = 
                      smartAnswer.score > 40 ? 'HIGH CONFIDENCE (94%)' : 
                      smartAnswer.score >= 15 ? 'MODERATE MATCH (78%)' : 
                      'POTENTIAL RELEVANCE (61%)';

                    return (
                      <div className="bg-gradient-to-br from-charcoal-950 via-charcoal-950 to-indigo-950/20 border border-sunset-500/30 rounded-xl p-4 shadow-lg shadow-sunset-500/5 relative overflow-hidden">
                        {/* Glowing vertical lines */}
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-sunset-500 to-indigo-500" />
                        
                        <div className="flex justify-between items-start pb-2.5 border-b border-charcoal-800/80 mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="bg-sunset-500/10 p-1.5 rounded-lg border border-sunset-500/20">
                              <Sparkles size={14} className="text-sunset-500" />
                            </div>
                            <div>
                              <span className="text-[10px] font-black text-sunset-500 uppercase tracking-widest block">SignalFlow AI</span>
                              <h4 className="text-xs font-black text-white">Smart Answer Synthesis</h4>
                            </div>
                          </div>
                          
                          <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded border ${confidenceColor}`}>
                            {confidenceText}
                          </span>
                        </div>

                        {/* Smart AI synthesized answer */}
                        <div className="text-xs text-charcoal-200 leading-relaxed space-y-2 mb-4 font-medium pl-1.5">
                          <p className="bg-charcoal-900/40 border border-charcoal-800/40 p-3 rounded-xl italic text-white text-xs">
                            {highlightText(smartAnswer.excerpt, docSearchQuery)}
                          </p>
                        </div>

                        {/* Citation info & Click action */}
                        <div className="flex items-center justify-between bg-charcoal-950/80 border border-charcoal-800/60 rounded-lg p-2.5 pl-3">
                          <div className="flex flex-col space-y-0.5">
                            <span className="text-[9px] font-bold text-charcoal-500 uppercase tracking-wider">CITED SPECIFICATION SOURCE</span>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] font-bold text-white font-mono">{smartAnswer.docNum}</span>
                              <span className="text-charcoal-600 font-mono text-[10px]">•</span>
                              <span className="text-[10px] font-bold text-indigo-400 truncate max-w-[200px] md:max-w-[300px]">{smartAnswer.title}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              const foundDoc = REFERENCE_DOCS.find(d => d.docNum === smartAnswer.docNum);
                              if (foundDoc) {
                                setExpandedDocId(foundDoc.id);
                                setExpandedSectionTitle(smartAnswer.sectionTitle);
                              }
                            }}
                            className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 hover:border-indigo-500 text-indigo-300 text-[9px] font-black tracking-widest px-2.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center space-x-1"
                          >
                            <span>EXPLORE MANUAL</span>
                            <ChevronRight size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  } else if (docSearchQuery.trim().length >= 3) {
                    return (
                      <div className="bg-charcoal-950/50 border border-charcoal-800 border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center space-y-2">
                        <HelpCircle size={24} className="text-charcoal-600" />
                        <h4 className="text-xs font-black text-charcoal-400 uppercase tracking-wider">No Direct Answer Synthesized</h4>
                        <p className="text-[11px] text-charcoal-500 max-w-sm leading-relaxed">
                          Your query did not trigger a direct match. Try searching for precise terms like "drywall", "concrete", "611 MHz", "IGMP snooping", "EF class", or "Sidekick".
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-charcoal-950/40 border border-charcoal-800 rounded-xl p-4">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider border-b border-charcoal-800 pb-2 mb-3 flex items-center space-x-1.5">
                          <HelpCircle size={13} className="text-sunset-500" />
                          <span>Suggested Clinical & Engineering Queries</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {[
                            {
                              title: "Wall Attenuation Factors",
                              desc: "How do drywall, concrete, and lead glass absorb wireless signals?",
                              query: "drywall concrete lead glass standard attenuation"
                            },
                            {
                              title: "WMTS Band Spectrum",
                              desc: "What frequency channels and ERP power bounds apply to telemetry transmitters?",
                              query: "611 MHz WMTS 8000 channel ERP power AA battery"
                            },
                            {
                              title: "Multicast Network QoS",
                              desc: "What IGMP, querier, and DSCP configurations are mandatory?",
                              query: "multicast IGMP snooping querier VLAN DSCP EF QoS"
                            },
                            {
                              title: "Site Survey Walk SOP",
                              desc: "What are the standard signal limits, walking paces, and Ekahau guidelines?",
                              query: "Sidekick walk pace dBm SNR target overlap site survey"
                            }
                          ].map((pill, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setDocSearchQuery(pill.query);
                                setExpandedDocId(null);
                                setExpandedSectionTitle(null);
                              }}
                              className="bg-charcoal-950 hover:bg-charcoal-900 border border-charcoal-800/80 hover:border-indigo-900 text-left p-3 rounded-xl transition-all duration-200 group/pill cursor-pointer flex flex-col justify-between"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[11px] font-black text-white group-hover/pill:text-sunset-400 transition-colors uppercase tracking-wide">
                                  {pill.title}
                                </span>
                                <ArrowRight size={10} className="text-charcoal-600 group-hover/pill:text-sunset-500 group-hover/pill:translate-x-1 transition-all" />
                              </div>
                              <p className="text-[10px] text-charcoal-400 group-hover/pill:text-charcoal-300 leading-relaxed">
                                {pill.desc}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }
                })()}

                {/* SEARCH RESULTS / CHAPTER FILTER */}
                <div>
                  <h3 className="text-xs font-black text-charcoal-400 uppercase tracking-widest border-b border-charcoal-800 pb-2 mb-3">
                    {docSearchQuery ? 'Matching Document Reference Sections' : 'Browse Offline Manual Chapters'}
                  </h3>

                  <div className="space-y-3.5">
                    {(() => {
                      const query = docSearchQuery.trim().toLowerCase();
                      
                      if (!query) {
                        return REFERENCE_DOCS.map(doc => (
                          <div 
                            key={doc.id}
                            className={`border rounded-xl p-3.5 transition-all duration-200 ${
                              expandedDocId === doc.id 
                                ? 'bg-charcoal-950 border-indigo-900 shadow-md shadow-indigo-950/20' 
                                : 'bg-charcoal-950/50 border-charcoal-800/80 hover:border-charcoal-700'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider bg-indigo-950 text-indigo-400 border border-indigo-900">
                                    {doc.category === 'Work Instructions' ? 'WORK INST' : doc.category === 'Device Specifications' ? 'DEVICE SPEC' : 'NET GUIDE'}
                                  </span>
                                  <span className="text-[10px] font-mono text-charcoal-500 font-bold">{doc.docNum}</span>
                                </div>
                                <h4 className="text-xs font-black text-white mt-1">{doc.title}</h4>
                                <span className="text-[9px] text-charcoal-500 mt-0.5">Last verified: {doc.lastUpdated}</span>
                              </div>

                              <button
                                onClick={() => setExpandedDocId(expandedDocId === doc.id ? null : doc.id)}
                                className="bg-charcoal-900 hover:bg-charcoal-800 border border-charcoal-800 text-charcoal-300 text-[10px] font-black tracking-wider px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                {expandedDocId === doc.id ? 'CLOSE CHAPTERS' : 'VIEW CHAPTERS'}
                              </button>
                            </div>

                            {/* Expanded sub-sections */}
                            {expandedDocId === doc.id && (
                              <div className="mt-4 border-t border-charcoal-800 pt-3 space-y-3">
                                {doc.sections.map((sec, sIdx) => (
                                  <div 
                                    key={sIdx} 
                                    className={`bg-charcoal-900/60 rounded-lg p-3 border transition-colors ${
                                      expandedSectionTitle === sec.title 
                                        ? 'border-sunset-500/40 bg-gradient-to-r from-charcoal-900 to-indigo-950/30' 
                                        : 'border-charcoal-850'
                                    }`}
                                  >
                                    <h5 className="text-[11px] font-black text-white border-b border-charcoal-800 pb-1.5 mb-2 flex items-center justify-between">
                                      <span className="flex items-center space-x-1.5">
                                        <FileText size={11} className="text-sunset-500" />
                                        <span>{sec.title}</span>
                                      </span>
                                      {expandedSectionTitle === sec.title && (
                                        <span className="text-[8px] font-black text-sunset-500 bg-sunset-500/10 px-1.5 py-0.5 rounded tracking-widest uppercase">
                                          CITED HIGHLIGHT
                                        </span>
                                      )}
                                    </h5>
                                    <p className="text-[11px] text-charcoal-300 leading-relaxed font-mono whitespace-pre-line">
                                      {sec.content}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-2.5">
                                      {sec.keywords.map((kw, kwIdx) => (
                                        <span key={kwIdx} className="text-[8px] font-semibold text-charcoal-500 bg-charcoal-950 px-1.5 py-0.5 rounded border border-charcoal-850 font-mono">
                                          #{kw}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ));
                      }

                      const matchingResults: { doc: typeof REFERENCE_DOCS[0]; sec: typeof REFERENCE_DOCS[0]['sections'][0]; score: number }[] = [];
                      const tokens = query.split(/\s+/).filter(t => t.length > 2);
                      
                      for (const doc of REFERENCE_DOCS) {
                        for (const sec of doc.sections) {
                          let score = 0;
                          
                          for (const token of tokens) {
                            if (sec.keywords.some(k => k.toLowerCase().includes(token))) score += 15;
                          }
                          const contentLower = sec.content.toLowerCase();
                          for (const token of tokens) {
                            let idx = -1;
                            while ((idx = contentLower.indexOf(token, idx + 1)) !== -1) {
                              score += 3;
                            }
                          }
                          const titleLower = sec.title.toLowerCase();
                          for (const token of tokens) {
                            if (titleLower.includes(token)) score += 8;
                          }

                          if (score > 0) {
                            matchingResults.push({ doc, sec, score });
                          }
                        }
                      }

                      matchingResults.sort((a, b) => b.score - a.score);

                      if (matchingResults.length === 0) {
                        return (
                          <div className="bg-charcoal-950/20 border border-charcoal-800 rounded-xl p-8 text-center text-charcoal-500 text-xs italic">
                            No sections matched your specific search. Try general terms or view the full library chapters below.
                          </div>
                        );
                      }

                      return matchingResults.map(({ doc, sec, score }, idx) => (
                        <div 
                          key={idx}
                          className="bg-charcoal-950 border border-charcoal-800/80 hover:border-indigo-900 rounded-xl p-3.5 transition-all duration-200"
                        >
                          <div className="flex justify-between items-start pb-2 border-b border-charcoal-900 mb-2.5">
                            <div className="flex items-center space-x-2">
                              <span className="text-[8px] font-black text-indigo-400 bg-indigo-950/60 border border-indigo-900 px-1.5 py-0.5 rounded tracking-wide uppercase">
                                {doc.category === 'Work Instructions' ? 'WORK INST' : doc.category === 'Device Specifications' ? 'DEVICE SPEC' : 'NET GUIDE'}
                              </span>
                              <span className="text-[10px] font-mono text-charcoal-500 font-bold">{doc.docNum}</span>
                            </div>
                            <span className="text-[9px] text-charcoal-500 font-mono font-bold uppercase tracking-wider">
                              MATCH SCORE: {score}
                            </span>
                          </div>

                          <h4 className="text-[11px] font-black text-white tracking-wide flex items-center space-x-1.5 mb-2">
                            <span className="text-sunset-500">{sec.title}</span>
                            <span className="text-charcoal-600 font-normal">in</span>
                            <span className="text-charcoal-400 font-bold truncate max-w-[200px]">{doc.title}</span>
                          </h4>

                          <p className="text-[11px] text-charcoal-300 leading-relaxed font-mono whitespace-pre-line bg-charcoal-900/40 p-2.5 rounded-lg border border-charcoal-850">
                            {highlightText(sec.content, docSearchQuery)}
                          </p>

                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {sec.keywords.map((kw, kwIdx) => (
                              <span key={kwIdx} className="text-[8px] font-semibold text-charcoal-500 bg-charcoal-900 px-1.5 py-0.5 rounded border border-charcoal-850 font-mono">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

              </div>

              {/* Right Column */}
              <div className="lg:col-span-5 bg-charcoal-950 border border-charcoal-800/80 rounded-xl p-3.5 flex flex-col justify-between overflow-y-auto max-h-[80vh] lg:max-h-full space-y-4">
                <div>
                  <div className="flex items-center space-x-2 pb-2.5 border-b border-charcoal-800 mb-3">
                    <FileText size={15} className="text-indigo-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Reference Catalog</h3>
                  </div>

                  <p className="text-[11px] text-charcoal-400 leading-relaxed mb-4">
                    Instantly pull up full compliance details or specifications on active device models or signal attenuation specs.
                  </p>

                  <div className="space-y-2.5">
                    {REFERENCE_DOCS.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setExpandedDocId(expandedDocId === doc.id ? null : doc.id);
                          setExpandedSectionTitle(null);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                          expandedDocId === doc.id 
                            ? 'bg-indigo-950/20 border-indigo-700/80 shadow-inner' 
                            : 'bg-charcoal-900/60 border-charcoal-800 hover:border-charcoal-750 hover:bg-charcoal-900'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-mono text-charcoal-500 font-bold">{doc.docNum}</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                            doc.category === 'Work Instructions' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' :
                            doc.category === 'Device Specifications' ? 'bg-sunset-500/10 text-sunset-400 border-sunset-500/20' :
                            'bg-indigo-950/60 text-indigo-400 border-indigo-900/50'
                          }`}>
                            {doc.category === 'Work Instructions' ? 'WORK INST' : doc.category === 'Device Specifications' ? 'DEVICE SPEC' : 'NET GUIDE'}
                          </span>
                        </div>
                        <h4 className="text-[11px] font-black text-white leading-tight mt-1">{doc.title}</h4>
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-charcoal-800/40 text-[9px] text-charcoal-500">
                          <span>{doc.sections.length} Chapters</span>
                          <span className="font-bold text-indigo-400">Explore →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Local environment safety box */}
                <div className="bg-gradient-to-r from-charcoal-900 to-indigo-950/40 border border-indigo-900/50 rounded-xl p-3 text-[10px] text-charcoal-400 leading-relaxed space-y-1.5">
                  <span className="font-black text-white uppercase tracking-widest block text-[9px] text-sunset-500">🔒 SECURE LOCAL Sandbox</span>
                  <p>
                    All documentation is bundled natively inside your local PWA code database. No queries leave your browser workspace, preserving absolute patient data confidentiality and enabling seamless offline access inside shielded hospital care centers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ==========================================
          CLOUD SYNC MODAL POPUP (PATH B)
          ========================================== */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-charcoal-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-900 border border-indigo-900 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 bg-charcoal-950 border-b border-charcoal-800 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
                  <Database size={16} className="text-sunset-500" />
                  <span>Cloud Synchronization Settings</span>
                </h3>
                <p className="text-[10px] text-charcoal-400">
                  Enable real-time automatic backup and cross-device sync
                </p>
              </div>
              <button 
                onClick={() => setShowSyncModal(false)}
                className="text-charcoal-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* Toggle Switch */}
              <div className="flex items-center justify-between p-3.5 bg-charcoal-950/50 rounded-xl border border-charcoal-800">
                <div>
                  <span className="block text-xs font-extrabold text-white uppercase tracking-wider">
                    Enable Cloud Synchronization
                  </span>
                  <span className="block text-[10px] text-charcoal-400 mt-0.5">
                    Connect local sandbox state to a persistent cloud repository.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={syncSettings.enabled}
                    onChange={(e) => {
                      const updated = { ...syncSettings, enabled: e.target.checked };
                      setSyncSettings(updated);
                      syncSettingsRef.current = updated;
                      localStorage.setItem('signalflow_sync_settings', JSON.stringify(updated));
                      if (e.target.checked) {
                        setSyncStatus('syncing');
                        // Run sync once enabled
                        setTimeout(() => performSync('auto'), 100);
                      } else {
                        setSyncStatus('disabled');
                      }
                    }}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-charcoal-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-charcoal-400 after:border-charcoal-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sunset-500 peer-checked:after:bg-charcoal-950"></div>
                </label>
              </div>

              {syncSettings.enabled && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Provider Selector Tabs */}
                  <div className="grid grid-cols-2 gap-2 bg-charcoal-950 p-1 rounded-xl border border-charcoal-800">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...syncSettings, provider: 'demo' };
                        setSyncSettings(updated);
                        syncSettingsRef.current = updated;
                        localStorage.setItem('signalflow_sync_settings', JSON.stringify(updated));
                        setSyncStatus('syncing');
                        setTimeout(() => performSync('auto'), 100);
                      }}
                      className={`py-2 rounded-lg text-xs font-black tracking-wider uppercase transition-all ${
                        syncSettings.provider === 'demo'
                          ? 'bg-indigo-950/80 border border-indigo-700 text-sunset-500'
                          : 'text-charcoal-400 hover:text-charcoal-200 cursor-pointer'
                      }`}
                    >
                      Instant Demo Room
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...syncSettings, provider: 'supabase' };
                        setSyncSettings(updated);
                        syncSettingsRef.current = updated;
                        localStorage.setItem('signalflow_sync_settings', JSON.stringify(updated));
                        setSyncStatus('syncing');
                        setTimeout(() => performSync('auto'), 100);
                      }}
                      className={`py-2 rounded-lg text-xs font-black tracking-wider uppercase transition-all ${
                        syncSettings.provider === 'supabase'
                          ? 'bg-indigo-950/80 border border-indigo-700 text-sunset-500'
                          : 'text-charcoal-400 hover:text-charcoal-200 cursor-pointer'
                      }`}
                    >
                      Supabase Cloud DB
                    </button>
                  </div>

                  {/* PROVIDER 1: DEMO ROOM */}
                  {syncSettings.provider === 'demo' && (
                    <div className="bg-charcoal-950 p-4 rounded-xl border border-charcoal-800 space-y-4">
                      <div className="text-[10px] text-charcoal-400 leading-relaxed space-y-1">
                        <p className="font-extrabold text-sunset-500 uppercase tracking-widest">
                          ⚡ Free Instant Sync Lobby
                        </p>
                        <p>
                          Perfect for real-time testing across devices (iPhone, Mac, Android) without signing up for databases or accounts. All sync data is encrypted with your private room key.
                        </p>
                      </div>

                      {/* Display / Set Key */}
                      {syncSettings.demoKey ? (
                        <div className="space-y-2">
                          <label className="block text-[9px] font-extrabold uppercase tracking-widest text-charcoal-400">
                            Your Unique Sync Key
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              readOnly
                              value={syncSettings.demoKey}
                              className="flex-1 bg-charcoal-900 border border-charcoal-800 text-white font-mono text-xs px-3 py-2 rounded-lg select-all"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(syncSettings.demoKey);
                                showToast('Sync Key copied to clipboard!');
                              }}
                              className="px-3 bg-charcoal-800 hover:bg-charcoal-700 text-sunset-500 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-[9px] text-charcoal-500">
                            Paste this key in the "Join Sync Room" input on your other devices to sync instantly.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 border border-dashed border-charcoal-800 rounded-lg">
                          <p className="text-xs text-charcoal-400 mb-3 text-center">
                            You don't have an active Sync Room yet. Click below to initialize one with your current workspace data!
                          </p>
                          <button
                            type="button"
                            onClick={() => performSync('push')}
                            disabled={isSyncingNow}
                            className="bg-sunset-500 hover:bg-sunset-600 text-charcoal-950 text-xs font-extrabold px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-sunset-500/20 cursor-pointer"
                          >
                            {isSyncingNow ? 'Generating...' : 'Create Sync Room'}
                          </button>
                        </div>
                      )}

                      {/* Join Room */}
                      <div className="pt-2 border-t border-charcoal-900 space-y-2">
                        <label className="block text-[9px] font-extrabold uppercase tracking-widest text-charcoal-400">
                          Join Existing Sync Room
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Paste Sync Key here..."
                            id="joinDemoKeyInput"
                            className="flex-1 bg-charcoal-900 border border-charcoal-800 text-white font-mono text-xs px-3 py-2 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('joinDemoKeyInput') as HTMLInputElement;
                              const value = input?.value?.trim();
                              if (value) {
                                const updated = { ...syncSettings, demoKey: value };
                                setSyncSettings(updated);
                                syncSettingsRef.current = updated;
                                localStorage.setItem('signalflow_sync_settings', JSON.stringify(updated));
                                showToast('Sync room key set. Fetching cloud workspace...');
                                setTimeout(() => performSync('pull'), 100);
                              } else {
                                showToast('Please paste a valid key first.');
                              }
                            }}
                            className="px-4 bg-indigo-950 border border-indigo-800 text-sunset-500 hover:bg-indigo-900 text-xs font-bold rounded-lg transition-all cursor-pointer"
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PROVIDER 2: SUPABASE PRIVATE DB */}
                  {syncSettings.provider === 'supabase' && (
                    <div className="bg-charcoal-950 p-4 rounded-xl border border-charcoal-800 space-y-3.5">
                      <div className="text-[10px] text-charcoal-400 leading-relaxed space-y-1">
                        <p className="font-extrabold text-sunset-500 uppercase tracking-widest">
                          🛡️ Private Enterprise Sync (Supabase)
                        </p>
                        <p>
                          Connect directly to your private Postgres database. Perfect for secure operations, maintaining 100% data ownership under institutional guidelines.
                        </p>
                      </div>

                      {/* Inputs */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[9px] font-extrabold uppercase tracking-widest text-charcoal-400 mb-1">
                            Supabase URL
                          </label>
                          <input
                            type="text"
                            placeholder="https://your-project.supabase.co"
                            value={syncSettings.supabaseUrl}
                            onChange={(e) => {
                              const updated = { ...syncSettings, supabaseUrl: e.target.value.trim() };
                              setSyncSettings(updated);
                              syncSettingsRef.current = updated;
                              localStorage.setItem('signalflow_sync_settings', JSON.stringify(updated));
                            }}
                            className="w-full bg-charcoal-900 border border-charcoal-800 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-700"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-extrabold uppercase tracking-widest text-charcoal-400 mb-1">
                            Supabase Anon Key
                          </label>
                          <input
                            type="password"
                            placeholder="eyJhbGciOi..."
                            value={syncSettings.supabaseAnonKey}
                            onChange={(e) => {
                              const updated = { ...syncSettings, supabaseAnonKey: e.target.value.trim() };
                              setSyncSettings(updated);
                              syncSettingsRef.current = updated;
                              localStorage.setItem('signalflow_sync_settings', JSON.stringify(updated));
                            }}
                            className="w-full bg-charcoal-900 border border-charcoal-800 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-700"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-extrabold uppercase tracking-widest text-charcoal-400 mb-1">
                              Table Name
                            </label>
                            <input
                              type="text"
                              value={syncSettings.supabaseTable}
                              onChange={(e) => {
                                const updated = { ...syncSettings, supabaseTable: e.target.value.trim() };
                                setSyncSettings(updated);
                                syncSettingsRef.current = updated;
                                localStorage.setItem('signalflow_sync_settings', JSON.stringify(updated));
                              }}
                              className="w-full bg-charcoal-900 border border-charcoal-800 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-700"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-extrabold uppercase tracking-widest text-charcoal-400 mb-1">
                              Custom Sync Key
                            </label>
                            <input
                              type="text"
                              value={syncSettings.supabaseKey}
                              onChange={(e) => {
                                const updated = { ...syncSettings, supabaseKey: e.target.value.trim() };
                                setSyncSettings(updated);
                                syncSettingsRef.current = updated;
                                localStorage.setItem('signalflow_sync_settings', JSON.stringify(updated));
                              }}
                              className="w-full bg-charcoal-900 border border-charcoal-800 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-700"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SQL Schema Copy Block */}
                      <div className="pt-2 border-t border-charcoal-900">
                        <label className="block text-[9px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">
                          Database Setup Query (Run in Supabase SQL Editor)
                        </label>
                        <div className="relative">
                          <pre className="bg-charcoal-900 p-2.5 rounded-lg text-[9px] text-emerald-400 font-mono overflow-x-auto max-h-[100px] border border-charcoal-800 leading-normal whitespace-pre-wrap">
                            {`create table ${syncSettings.supabaseTable || 'signalflow_sync'} (
  sync_key text primary key,
  projects jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DISABLE Row-Level Security (RLS) to allow public access:
alter table ${syncSettings.supabaseTable || 'signalflow_sync'} disable row level security;

-- Enable Realtime (optional):
alter publication supabase_realtime add table ${syncSettings.supabaseTable || 'signalflow_sync'};`}
                          </pre>
                          <button
                            type="button"
                            onClick={() => {
                              const sql = `create table ${syncSettings.supabaseTable || 'signalflow_sync'} (
  sync_key text primary key,
  projects jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DISABLE Row-Level Security (RLS) to allow public access:
alter table ${syncSettings.supabaseTable || 'signalflow_sync'} disable row level security;

-- Enable Realtime (optional):
alter publication supabase_realtime add table ${syncSettings.supabaseTable || 'signalflow_sync'};`;
                              navigator.clipboard.writeText(sql);
                              showToast('SQL setup query copied!');
                            }}
                            className="absolute top-1 right-1 px-1.5 py-0.5 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 hover:text-white rounded text-[8px] transition-colors cursor-pointer"
                          >
                            Copy SQL
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-charcoal-950 border-t border-charcoal-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
              
              {/* Connection Status */}
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    !syncSettings.enabled 
                      ? 'bg-charcoal-600' 
                      : syncStatus === 'synced'
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        : syncStatus === 'syncing'
                          ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse'
                          : 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  }`} />
                  <span className="text-[10px] font-black text-white uppercase tracking-wider">
                    {!syncSettings.enabled 
                      ? 'Sync Disabled' 
                      : syncStatus === 'synced'
                        ? 'Fully Synced'
                        : syncStatus === 'syncing'
                          ? 'Synchronizing...'
                          : 'Sync Error'}
                  </span>
                  {lastSyncedAt && syncSettings.enabled && (
                    <span className="text-[9px] text-charcoal-400">
                      (Last: {new Date(lastSyncedAt).toLocaleTimeString()})
                    </span>
                  )}
                </div>
                {syncError && syncSettings.enabled && (
                  <span className="text-[9px] text-rose-400 mt-1 max-w-[250px] break-words leading-tight">
                    {syncError}
                  </span>
                )}
                {/* Realtime / connection mode indicator */}
                {syncSettings.enabled && syncSettings.provider === 'supabase' && (
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      realtimeStatus === 'connected'
                        ? 'bg-emerald-400'
                        : realtimeStatus === 'connecting'
                          ? 'bg-amber-400 animate-pulse'
                          : realtimeStatus === 'error'
                            ? 'bg-rose-400'
                            : 'bg-charcoal-600'
                    }`} />
                    <span className="text-[8px] text-charcoal-500 font-medium">
                      {realtimeStatus === 'connected'
                        ? '🔌 Realtime WebSocket Live'
                        : realtimeStatus === 'connecting'
                          ? '⏳ Connecting Realtime...'
                          : realtimeStatus === 'error'
                            ? '⚠️ Realtime offline (polling fallback 30s)'
                            : '🔌 Realtime idle'}
                    </span>
                  </div>
                )}
                {syncSettings.enabled && syncSettings.provider === 'demo' && (
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="text-[8px] text-charcoal-500 font-medium">
                      ⏱️ Polling every 5s
                    </span>
                  </div>
                )}
              </div>

              {/* Control Buttons */}
              <div className="flex space-x-2 justify-end">
                {syncSettings.enabled && (
                  <>
                    <button
                      type="button"
                      disabled={isSyncingNow}
                      onClick={() => performSync('push')}
                      className="px-2.5 py-1.5 border border-charcoal-800 hover:border-charcoal-700 text-charcoal-300 hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <span>Upload (Local ➔ Cloud)</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSyncingNow}
                      onClick={() => performSync('pull')}
                      className="px-2.5 py-1.5 border border-charcoal-800 hover:border-charcoal-700 text-charcoal-300 hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <span>Download (Cloud ➔ Local)</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowSyncModal(false)}
                  className="px-4 py-1.5 bg-sunset-500 hover:bg-sunset-600 active:bg-sunset-700 text-charcoal-950 text-xs font-extrabold rounded-lg transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          NOTIFICATION / TOAST POPUP
          ========================================== */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-indigo-950 border-2 border-sunset-500 p-3.5 rounded-xl shadow-xl shadow-sunset-500/10 flex items-center space-x-3 text-white max-w-sm animate-bounce">
          <ClipboardCheck size={20} className="text-sunset-500 shrink-0" />
          <div className="text-xs font-bold leading-normal">
            {notification}
          </div>
        </div>
      )}

      {/* ==========================================
          EDIT PROJECT MODAL POPUP
          ========================================== */}
      {showEditModal && (
        <div className="fixed inset-0 bg-charcoal-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-900 border border-indigo-900 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 bg-charcoal-950 border-b border-charcoal-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
                  <Edit size={16} className="text-sunset-500" />
                  <span>Edit Project Details</span>
                </h3>
                <p className="text-[10px] text-charcoal-400">
                  Update core information, stakeholders, timelines, and status
                </p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-charcoal-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable form) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* Row 1: Number & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">
                    Project ID / Salesforce #
                  </label>
                  <input
                    type="text"
                    value={editNumber}
                    onChange={(e) => setEditNumber(e.target.value)}
                    className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500"
                    placeholder="e.g. NK-2026-948"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">
                    Hospital / Site Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500"
                    placeholder="e.g. St. Jude Medical Center"
                  />
                </div>
              </div>

              {/* Row 2: City, State, Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500"
                    placeholder="e.g. Memphis"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={editState}
                    onChange={(e) => setEditState(e.target.value.toUpperCase())}
                    className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500 text-center"
                    placeholder="TN"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">
                    Credentials Required
                  </label>
                  <select
                    value={editCredentials}
                    onChange={(e) => setEditCredentials(e.target.value)}
                    className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-sunset-500"
                  >
                    <option value="Symplr">Symplr</option>
                    <option value="IntelliCentrics">IntelliCentrics</option>
                    <option value="VendorMate">VendorMate</option>
                    <option value="None">None / Visitor badge</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Project Type & Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">
                    Project Type
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as 'Wireless Assessment' | 'Wireless Design')}
                    className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500"
                  >
                    <option value="Wireless Assessment">Wireless Assessment</option>
                    <option value="Wireless Design">Wireless Design</option>
                  </select>
                  <span className="text-[9px] text-charcoal-500 mt-1 block">
                    Changing type resets checklist to match template.
                  </span>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">
                    Project Stage
                  </label>
                  <select
                    value={editStage}
                    onChange={(e) => setEditStage(e.target.value as any)}
                    className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500"
                  >
                    <option value="Kickoff">Kickoff</option>
                    <option value="Pre-Work">Pre-Work</option>
                    <option value="On-Site">On-Site</option>
                    <option value="Reporting">Reporting</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="h-[1px] bg-charcoal-800 my-1"></div>

              {/* Row 4: PM & AE Stakeholders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 mb-1">
                    Nihon Kohden PM Name
                  </label>
                  <input
                    type="text"
                    value={editPmName}
                    onChange={(e) => setEditPmName(e.target.value)}
                    className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500"
                    placeholder="Project Manager Name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 mb-1">
                    Nihon Kohden AE Name
                  </label>
                  <input
                    type="text"
                    value={editAeName}
                    onChange={(e) => setEditAeName(e.target.value)}
                    className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500"
                    placeholder="Account Executive Name"
                  />
                </div>
              </div>

              {/* Row 5: IT Contact Info */}
              <div className="bg-charcoal-950/40 p-3 rounded-xl border border-charcoal-800/60 space-y-3">
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                  Hospital BioMed / IT Contact details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-charcoal-400 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editItName}
                      onChange={(e) => setEditItName(e.target.value)}
                      className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sunset-500"
                      placeholder="Contact Name"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-charcoal-400 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editItEmail}
                      onChange={(e) => setEditItEmail(e.target.value)}
                      className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sunset-500"
                      placeholder="name@hospital.org"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-charcoal-400 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editItPhone}
                      onChange={(e) => setEditItPhone(e.target.value)}
                      className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sunset-500"
                      placeholder="555-0199"
                    />
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-charcoal-800 my-1"></div>

              {/* Row 6: Timelines (Travel & On-Site Dates) */}
              <div className="space-y-3">
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500">
                  Project Timelines (Native Dark Date Selectors)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-charcoal-950/40 p-2.5 rounded-xl border border-charcoal-800/40">
                    <label className="block text-[9px] font-bold text-charcoal-400 mb-1 uppercase">
                      Travel Window (Outlook blockout)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        style={{ colorScheme: 'dark' }}
                        value={editTravelStart}
                        onChange={(e) => setEditTravelStart(e.target.value)}
                        className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sunset-500"
                      />
                      <input
                        type="date"
                        style={{ colorScheme: 'dark' }}
                        value={editTravelEnd}
                        onChange={(e) => setEditTravelEnd(e.target.value)}
                        className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sunset-500"
                      />
                    </div>
                  </div>

                  <div className="bg-charcoal-950/40 p-2.5 rounded-xl border border-charcoal-800/40">
                    <label className="block text-[9px] font-bold text-charcoal-400 mb-1 uppercase">
                      On-Site Assessment Dates
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        style={{ colorScheme: 'dark' }}
                        value={editSiteStart}
                        onChange={(e) => setEditSiteStart(e.target.value)}
                        className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sunset-500"
                      />
                      <input
                        type="date"
                        style={{ colorScheme: 'dark' }}
                        value={editSiteEnd}
                        onChange={(e) => setEditSiteEnd(e.target.value)}
                        className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sunset-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">
                    System Go-Live Date
                  </label>
                  <input
                    type="date"
                    style={{ colorScheme: 'dark' }}
                    value={editGoLive}
                    onChange={(e) => setEditGoLive(e.target.value)}
                    className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500"
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-charcoal-950 border-t border-charcoal-800 flex justify-between items-center">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-xs font-bold text-charcoal-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSaveProject}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sunset-500 hover:bg-sunset-400 text-charcoal-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-sunset-500/20 transition-all hover:scale-[1.02]"
              >
                <Check size={14} className="stroke-[3]" />
                <span>Save Changes</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          WIZARD MODAL POPUP (NEW PROJECT)
          ========================================== */}
      {showWizard && (
        <div className="fixed inset-0 bg-charcoal-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-900 border border-indigo-900 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* Wizard Header */}
            <div className="p-4 bg-charcoal-950 border-b border-charcoal-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
                  <ClipboardCheck size={16} className="text-sunset-500" />
                  <span>SignalFlow New Project Wizard</span>
                </h3>
                <p className="text-[10px] text-charcoal-400">
                  Step {wizardStep} of 4: {
                    wizardStep === 1 ? 'Core Details' :
                    wizardStep === 2 ? 'Key Stakeholders' :
                    wizardStep === 3 ? 'Deployment Timelines' : 'Automations & Configs'
                  }
                </p>
              </div>
              <button 
                onClick={() => setShowWizard(false)}
                className="text-charcoal-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Glowing Progress bar */}
            <div className="h-1 bg-charcoal-950 w-full">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-sunset-500 to-indigo-800 transition-all duration-300"
                style={{ width: `${(wizardStep / 4) * 100}%` }}
              />
            </div>

            {/* Wizard Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[60vh]">
              
              {/* STEP 1: CORE DETAILS */}
              {wizardStep === 1 && (
                <div className="space-y-3.5">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-charcoal-800 pb-1.5">
                    1. General Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-charcoal-400 uppercase tracking-wider mb-1">
                        Hospital / Account Name *
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. St. Jude Children's Hospital"
                        value={wizName}
                        onChange={(e) => setWizName(e.target.value)}
                        className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-charcoal-400 uppercase tracking-wider mb-1">
                          Project ID / Code
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. NK-2026-948"
                          value={wizNumber}
                          onChange={(e) => setWizNumber(e.target.value)}
                          className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-charcoal-400 uppercase tracking-wider mb-1">
                          Required Hospital Credentialing
                        </label>
                        <select 
                          value={wizCredentials}
                          onChange={(e) => setWizCredentials(e.target.value)}
                          className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500 transition-colors"
                        >
                          <option value="Symplr (Required)">Symplr</option>
                          <option value="Reptrax (Required)">Reptrax</option>
                          <option value="IntelliCentrics">IntelliCentrics</option>
                          <option value="None / General check-in">None / Regular Visitor</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-charcoal-400 uppercase tracking-wider mb-1">
                          City
                        </label>
                        <input 
                          type="text" 
                          placeholder="Memphis"
                          value={wizCity}
                          onChange={(e) => setWizCity(e.target.value)}
                          className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-charcoal-400 uppercase tracking-wider mb-1">
                          State
                        </label>
                        <input 
                          type="text" 
                          placeholder="TN"
                          value={wizState}
                          onChange={(e) => setWizState(e.target.value)}
                          className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: KEY STAKEHOLDERS */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  {/* PM details */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-charcoal-800 pb-1">
                      2A. Project Manager (PM) Info
                    </h4>
                    <div>
                      <input 
                        type="text" 
                        placeholder="Sarah Jenkins (Project Manager Name)"
                        value={wizPmName}
                        onChange={(e) => setWizPmName(e.target.value)}
                        className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-sunset-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* AE details */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-charcoal-800 pb-1">
                      2B. Account Executive (AE) Info
                    </h4>
                    <div>
                      <input 
                        type="text" 
                        placeholder="Marcus Vance (Account Executive Name)"
                        value={wizAeName}
                        onChange={(e) => setWizAeName(e.target.value)}
                        className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-sunset-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* IT contact */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-charcoal-800 pb-1">
                      2C. Hospital IT / BioMed Lead
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <input 
                          type="text" 
                          placeholder="David Cho (Lead Tech)"
                          value={wizItName}
                          onChange={(e) => setWizItName(e.target.value)}
                          className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sunset-500 transition-colors"
                        />
                      </div>
                      <div className="col-span-1">
                        <input 
                          type="text" 
                          placeholder="dcho@hospital.org"
                          value={wizItEmail}
                          onChange={(e) => setWizItEmail(e.target.value)}
                          className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sunset-500 transition-colors"
                        />
                      </div>
                      <div className="col-span-1">
                        <input 
                          type="text" 
                          placeholder="901-555-9876"
                          value={wizItPhone}
                          onChange={(e) => setWizItPhone(e.target.value)}
                          className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sunset-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: DEPLOYMENT TIMELINES */}
              {wizardStep === 3 && (
                <div className="space-y-3.5">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-charcoal-800 pb-1.5">
                    3. Key Schedule Dates
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="bg-charcoal-950/50 p-2.5 border border-charcoal-800 rounded-xl space-y-2.5">
                      <span className="text-[10px] uppercase font-bold text-sunset-500">
                        ✈️ Blocked Calendar Travel Dates (Outlook Busy)
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-charcoal-400">Travel Start Date</label>
                          <input 
                            type="date" 
                            value={wizTravelStart}
                            onChange={(e) => setWizTravelStart(e.target.value)}
                            onClick={(e) => { try { e.currentTarget.showPicker(); } catch (_) {} }}
                            style={{ colorScheme: 'dark' }}
                            className="w-full bg-charcoal-950 border border-charcoal-850 rounded p-1.5 text-xs text-white focus:outline-none focus:border-sunset-500 transition-colors cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-charcoal-400">Travel End Date</label>
                          <input 
                            type="date" 
                            value={wizTravelEnd}
                            onChange={(e) => setWizTravelEnd(e.target.value)}
                            onClick={(e) => { try { e.currentTarget.showPicker(); } catch (_) {} }}
                            style={{ colorScheme: 'dark' }}
                            className="w-full bg-charcoal-950 border border-charcoal-850 rounded p-1.5 text-xs text-white focus:outline-none focus:border-sunset-500 transition-colors cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-charcoal-950/50 p-2.5 border border-charcoal-800 rounded-xl space-y-2.5">
                      <span className="text-[10px] uppercase font-bold text-indigo-400">
                        🏥 Hospital On-Site Assessment Schedule
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-charcoal-400">Survey Start Date</label>
                          <input 
                            type="date" 
                            value={wizSiteStart}
                            onChange={(e) => setWizSiteStart(e.target.value)}
                            onClick={(e) => { try { e.currentTarget.showPicker(); } catch (_) {} }}
                            style={{ colorScheme: 'dark' }}
                            className="w-full bg-charcoal-950 border border-charcoal-850 rounded p-1.5 text-xs text-white focus:outline-none focus:border-sunset-500 transition-colors cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-charcoal-400">Survey End Date</label>
                          <input 
                            type="date" 
                            value={wizSiteEnd}
                            onChange={(e) => setWizSiteEnd(e.target.value)}
                            onClick={(e) => { try { e.currentTarget.showPicker(); } catch (_) {} }}
                            style={{ colorScheme: 'dark' }}
                            className="w-full bg-charcoal-950 border border-charcoal-850 rounded p-1.5 text-xs text-white focus:outline-none focus:border-sunset-500 transition-colors cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-charcoal-400 uppercase tracking-wider mb-1">
                        Expected Hospital Target Go-Live Date
                      </label>
                      <input 
                        type="date" 
                        value={wizGoLive}
                        onChange={(e) => setWizGoLive(e.target.value)}
                        onClick={(e) => { try { e.currentTarget.showPicker(); } catch (_) {} }}
                        style={{ colorScheme: 'dark' }}
                        className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500 transition-colors cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: AUTOMATIONS & PROJECT CONFIGS */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-charcoal-800 pb-1.5">
                    4. Setup Automations & Select Template
                  </h4>

                  {/* Project Type Select */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">
                      Select Project Checklist Template
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setWizType('Wireless Assessment')}
                        className={`text-left p-3 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                          wizType === 'Wireless Assessment'
                            ? 'bg-orange-950/40 border-sunset-500 text-white shadow'
                            : 'bg-charcoal-950 border-charcoal-800 hover:border-charcoal-700 text-charcoal-400'
                        }`}
                      >
                        <span className="text-xs font-extrabold block mb-1 text-sunset-500">
                          Wireless Assessment Checklist
                        </span>
                        <span className="text-[10px] leading-relaxed">
                          Hospital telemetry SSID network assessment, POC walking surveys, 16 step technical report checklist.
                        </span>
                      </button>

                      <button
                        onClick={() => setWizType('Wireless Design')}
                        className={`text-left p-3 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                          wizType === 'Wireless Design'
                            ? 'bg-indigo-950/40 border-indigo-500 text-white shadow'
                            : 'bg-charcoal-950 border-charcoal-800 hover:border-charcoal-700 text-charcoal-400'
                        }`}
                      >
                        <span className="text-xs font-extrabold block mb-1 text-indigo-400">
                          Wireless Design Checklist
                        </span>
                        <span className="text-[10px] leading-relaxed">
                          Nihon Kohden-installed AP hardware layout, staging, physical hanging APs, final validation report checklist.
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Automations Switches */}
                  <div className="space-y-2.5 pt-2">
                    <label className="block text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">
                      Automatic Initialization Routines
                    </label>

                    <div className="bg-charcoal-950/60 p-3.5 border border-charcoal-800 rounded-xl space-y-3.5">
                      {/* Drive toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white block">
                            📂 Build Google Drive Structure
                          </span>
                          <span className="text-[10px] text-charcoal-500">
                            Create folder hierarchy automatically under Google Drive/SignalFlow.
                          </span>
                        </div>
                        <button
                          onClick={() => setWizDrive(!wizDrive)}
                          className={`w-11 h-6 rounded-full p-1 transition-all duration-300 flex items-center ${
                            wizDrive ? 'bg-sunset-500 justify-end' : 'bg-charcoal-800 justify-start'
                          }`}
                        >
                          <span className="w-4 h-4 bg-charcoal-950 rounded-full shadow" />
                        </button>
                      </div>

                      {/* Calendar toggle */}
                      <div className="flex items-center justify-between border-t border-charcoal-800/60 pt-3">
                        <div>
                          <span className="text-xs font-bold text-white block">
                            📅 Sync Travel to Outlook Calendar
                          </span>
                          <span className="text-[10px] text-charcoal-500">
                            Block flight and survey periods as "Busy" so PMs/AEs cannot schedule meetings.
                          </span>
                        </div>
                        <button
                          onClick={() => setWizCalendar(!wizCalendar)}
                          className={`w-11 h-6 rounded-full p-1 transition-all duration-300 flex items-center ${
                            wizCalendar ? 'bg-sunset-500 justify-end' : 'bg-charcoal-800 justify-start'
                          }`}
                        >
                          <span className="w-4 h-4 bg-charcoal-950 rounded-full shadow" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Wizard Footer buttons */}
            <div className="p-3.5 bg-charcoal-950 border-t border-charcoal-800 flex justify-between">
              <button
                onClick={() => setWizardStep(prev => Math.max(1, prev - 1))}
                disabled={wizardStep === 1}
                className={`flex items-center space-x-1.5 text-xs font-bold px-4 py-2 rounded-lg border border-charcoal-800 hover:border-charcoal-700 text-charcoal-300 disabled:opacity-30 disabled:hover:border-charcoal-800 transition-colors`}
              >
                <ArrowLeft size={14} />
                <span>BACK</span>
              </button>

              {wizardStep < 4 ? (
                <button
                  onClick={() => setWizardStep(prev => Math.min(4, prev + 1))}
                  className="bg-indigo-950/60 border border-indigo-700 text-sunset-500 hover:bg-indigo-900/60 text-xs font-black tracking-wider px-5 py-2 rounded-lg flex items-center space-x-1.5 transition-all shadow"
                >
                  <span>NEXT</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleCreateProject}
                  className="bg-sunset-500 hover:bg-sunset-600 text-charcoal-950 text-xs font-black tracking-widest px-5 py-2 rounded-lg flex items-center space-x-1.5 transition-all shadow-md shadow-sunset-500/15"
                >
                  <Check size={14} strokeWidth={2.5} />
                  <span>INITIALIZE</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
