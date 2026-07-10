import { useState, useCallback, useEffect, useRef } from 'react';
import type { Project, ActiveTab, ProjectType } from './types';
import { DEFAULT_ASSESSMENT_CHECKLIST, DEFAULT_DESIGN_CHECKLIST } from './data/defaultChecklists';
import { getCalendarEvents, getEmailTemplates, buildDriveStructureText } from './utils/helpers';
import { useProjects } from './hooks/useProjects';
import { useSync } from './hooks/useSync';

import Header from './components/Header';
import ProjectSidebar from './components/ProjectSidebar';
import ProjectDetail from './components/ProjectDetail';
import CalendarView from './components/CalendarView';
import EmailVault from './components/EmailVault';
import DocSearch from './components/DocSearch';
import SyncModal from './components/SyncModal';
import EditModal from './components/EditModal';
import NewProjectWizard from './components/NewProjectWizard';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import Toast from './components/Toast';

export default function App() {
  const {
    projects, setProjects, updateProjects,
    searchTerm, setSearchTerm,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    viewMode, setViewMode,
    sortedProjects,
    handleToggleChecklist,
    handleSaveNotes,
    handleToggleArchive,
    handleDeleteProject,
    handleSaveProject: saveEditedProject,
    handleCreateProject: createNewProject,
  } = useProjects();

  const {
    syncSettings, setSyncSettings,
    syncStatus, syncError, lastSyncedAt, isSyncingNow, realtimeStatus,
    performSync,
  } = useSync(projects, setProjects);

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('1');

  // ── Search / modal state for DocSearch ────────────────────────────────────
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [expandedSectionTitle, setExpandedSectionTitle] = useState<string | null>(null);

  // ── Google Drive config ───────────────────────────────────────────────────
  const [googleDriveUrl, setGoogleDriveUrl] = useState<string>(
    () => localStorage.getItem('signalflow_google_drive_url') || '',
  );
  const [showDriveConfig, setShowDriveConfig] = useState(false);

  useEffect(() => {
    localStorage.setItem('signalflow_google_drive_url', googleDriveUrl);
  }, [googleDriveUrl]);

  // ── Sync modal ────────────────────────────────────────────────────────────
  const [showSyncModal, setShowSyncModal] = useState(false);

  const handleSyncToggle = useCallback((enabled: boolean) => {
    const updated = { ...syncSettings, enabled };
    setSyncSettings(updated);
    if (enabled) setTimeout(() => performSync('auto'), 100);
  }, [syncSettings, setSyncSettings, performSync]);

  const handleSetProvider = useCallback((provider: 'demo' | 'supabase') => {
    const updated = { ...syncSettings, provider };
    setSyncSettings(updated);
    setTimeout(() => performSync('auto'), 100);
  }, [syncSettings, setSyncSettings, performSync]);

  const handleUpdateSettings = useCallback((settings: typeof syncSettings) => {
    setSyncSettings(settings);
  }, [setSyncSettings]);

  const handleCreateRoom = useCallback(() => performSync('push'), [performSync]);
  const handlePush = useCallback(() => performSync('push'), [performSync]);
  const handlePull = useCallback(() => performSync('pull'), [performSync]);

  const handleJoinRoom = useCallback((key: string) => {
    const updated = { ...syncSettings, demoKey: key };
    setSyncSettings(updated);
    setTimeout(() => performSync('pull'), 100);
  }, [syncSettings, setSyncSettings, performSync]);

  // ── Edit modal ────────────────────────────────────────────────────────────
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
  const [editType, setEditType] = useState<ProjectType>('Wireless Assessment');
  const [editStage, setEditStage] = useState<Project['stage']>('Kickoff');

  const handleOpenEditModal = useCallback((p: Project) => {
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
  }, []);

  const handleSaveEdit = useCallback(() => {
    saveEditedProject(editProjId, {
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
      itContact: { name: editItName, email: editItEmail, phone: editItPhone },
    });
    setShowEditModal(false);
    showToast('Project updated successfully!');
  }, [editProjId, editNumber, editName, editCity, editState, editCredentials,
      editType, editStage, editTravelStart, editTravelEnd, editSiteStart,
      editSiteEnd, editGoLive, editPmName, editAeName, editItName, editItEmail,
      editItPhone, saveEditedProject]);

  // ── New Project Wizard ────────────────────────────────────────────────────
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizName, setWizName] = useState('');
  const [wizNumber, setWizNumber] = useState('');
  const [wizCity, setWizCity] = useState('');
  const [wizState, setWizState] = useState('TN');
  const [wizCredentials, setWizCredentials] = useState('Symplr');
  const [wizPmName, setWizPmName] = useState('Sarah Jenkins');
  const [wizAeName, setWizAeName] = useState('Marcus Vance');
  const [wizItName, setWizItName] = useState('');
  const [wizItEmail, setWizItEmail] = useState('');
  const [wizItPhone, setWizItPhone] = useState('');
  const [wizTravelStart, setWizTravelStart] = useState('');
  const [wizTravelEnd, setWizTravelEnd] = useState('');
  const [wizSiteStart, setWizSiteStart] = useState('');
  const [wizSiteEnd, setWizSiteEnd] = useState('');
  const [wizGoLive, setWizGoLive] = useState('');
  const [wizType, setWizType] = useState<ProjectType>('Wireless Assessment');
  const [wizDrive, setWizDrive] = useState(true);
  const [wizCalendar, setWizCalendar] = useState(true);

  const handleOpenWizard = useCallback(() => {
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
  }, []);

  const handleCreateProject = useCallback(() => {
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
      travelEnd: wizTravelEnd || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      siteStart: wizSiteStart || new Date().toISOString().split('T')[0],
      siteEnd: wizSiteEnd || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      goLiveDate: wizGoLive || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pm: { name: wizPmName },
      ae: { name: wizAeName },
      itContact: { name: wizItName || 'TBD', email: wizItEmail || 'TBD', phone: wizItPhone || 'TBD' },
      notes: 'Project created via Wizard. Checklist generated automatically.',
      checklist: wizType === 'Wireless Assessment'
        ? DEFAULT_ASSESSMENT_CHECKLIST.map(item => ({ ...item }))
        : DEFAULT_DESIGN_CHECKLIST.map(item => ({ ...item })),
      driveCreated: wizDrive,
      calendarSynced: wizCalendar,
      isArchived: false,
    };
    createNewProject(newProj);
    setSelectedProjectId(newProj.id);
    setShowWizard(false);
    showToast('Project initialized!');
  }, [wizName, wizNumber, wizCity, wizState, wizCredentials, wizType,
      wizPmName, wizAeName, wizItName, wizItEmail, wizItPhone,
      wizTravelStart, wizTravelEnd, wizSiteStart, wizSiteEnd, wizGoLive,
      wizDrive, wizCalendar, createNewProject]);

  // ── Toast notifications ──────────────────────────────────────────────────
  const [notification, setNotification] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setNotification(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setNotification(null), 3000);
  }, []);

  // ── Delete confirmation modal ─────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const handleRequestDelete = useCallback((projectId: string) => {
    const p = projects.find(proj => proj.id === projectId);
    if (p) setDeleteTarget(p);
  }, [projects]);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      handleDeleteProject(deleteTarget.id);
      if (selectedProjectId === deleteTarget.id) {
        const remaining = projects.filter(p => p.id !== deleteTarget.id);
        setSelectedProjectId(remaining[0]?.id || '');
      }
      setDeleteTarget(null);
      showToast(`Project "${deleteTarget.name}" permanently deleted.`);
    }
  }, [deleteTarget, handleDeleteProject, selectedProjectId, projects, showToast]);

  // ── Selected project ──────────────────────────────────────────────────────
  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // ── Calendar events (memoized from derived data) ──────────────────────────
  const calendarEvents = getCalendarEvents(projects);
  const emailTemplates = getEmailTemplates(selectedProject);

  // ── Drive helpers ─────────────────────────────────────────────────────────
  const copyDriveStructureToClipboard = useCallback(async () => {
    const text = buildDriveStructureText(selectedProject);
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Folder structure copied for ${selectedProject.number} - ${selectedProject.name}`);
    } catch {
      showToast('Could not copy to clipboard');
    }
  }, [selectedProject, showToast]);

  const openGoogleDriveFolder = useCallback(() => {
    if (googleDriveUrl) {
      window.open(googleDriveUrl, '_blank', 'noopener,noreferrer');
      showToast('Opening Google Drive folder...');
    } else {
      showToast('No Google Drive folder configured.');
    }
  }, [googleDriveUrl, showToast]);

  const handleCopyTemplate = useCallback((text: string, templateName: string) => {
    navigator.clipboard.writeText(text);
    showToast(`"${templateName}" copied to clipboard!`);
  }, [showToast]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-charcoal-950 text-charcoal-100 flex flex-col selection:bg-sunset-500 selection:text-white">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        syncEnabled={syncSettings.enabled}
        syncStatus={syncStatus}
        onSyncClick={() => setShowSyncModal(true)}
        onNewProject={handleOpenWizard}
      />

      <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-sunset-500 to-indigo-800 w-full" />

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* TAB: Projects */}
        {activeTab === 'projects' && (
          <>
            <ProjectSidebar
              projects={projects}
              sortedProjects={sortedProjects}
              selectedProjectId={selectedProjectId}
              searchTerm={searchTerm}
              sortBy={sortBy}
              sortOrder={sortOrder}
              viewMode={viewMode}
              syncEnabled={syncSettings.enabled}
              syncStatus={syncStatus}
              onSelectProject={setSelectedProjectId}
              onSearchChange={setSearchTerm}
              onSortByChange={setSortBy}
              onSortOrderToggle={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              onViewModeChange={setViewMode}
              onSyncClick={() => setShowSyncModal(true)}
              onImport={(newProjects) => updateProjects(() => newProjects)}
              onToast={showToast}
            />

            <div className="flex-1 bg-charcoal-900 border border-charcoal-800 rounded-xl shadow-md flex flex-col overflow-hidden">
              <ProjectDetail
                project={selectedProject}
                googleDriveUrl={googleDriveUrl}
                showDriveConfig={showDriveConfig}
                onToggleChecklist={handleToggleChecklist}
                onSaveNotes={handleSaveNotes}
                onToggleArchive={handleToggleArchive}
                onDeleteProject={handleRequestDelete}
                onOpenEdit={handleOpenEditModal}
                onOpenGoogleDrive={openGoogleDriveFolder}
                onCopyDriveStructure={copyDriveStructureToClipboard}
                onSetDriveUrl={setGoogleDriveUrl}
                onSetShowDriveConfig={setShowDriveConfig}
                onClearDriveUrl={() => { setGoogleDriveUrl(''); setShowDriveConfig(false); }}
                onToast={showToast}
              />
            </div>
          </>
        )}

        {/* TAB: Calendar */}
        {activeTab === 'calendar' && <CalendarView events={calendarEvents} />}

        {/* TAB: Email Vault */}
        {activeTab === 'email-vault' && (
          <EmailVault
            project={selectedProject}
            templates={emailTemplates}
            onCopyTemplate={handleCopyTemplate}
          />
        )}

        {/* TAB: Docs Search */}
        {activeTab === 'docs-search' && (
          <DocSearch
            docSearchQuery={docSearchQuery}
            expandedDocId={expandedDocId}
            expandedSectionTitle={expandedSectionTitle}
            onQueryChange={setDocSearchQuery}
            onExpandDoc={setExpandedDocId}
            onExpandSection={setExpandedSectionTitle}
            onClearSearch={() => { setDocSearchQuery(''); setExpandedDocId(null); setExpandedSectionTitle(null); }}
          />
        )}
      </main>

      {/* Modals */}
      <SyncModal
        showSyncModal={showSyncModal}
        syncSettings={syncSettings}
        syncStatus={syncStatus}
        syncError={syncError}
        lastSyncedAt={lastSyncedAt}
        isSyncingNow={isSyncingNow}
        realtimeStatus={realtimeStatus}
        onClose={() => setShowSyncModal(false)}
        onToggle={handleSyncToggle}
        onSetProvider={handleSetProvider}
        onUpdateSettings={handleUpdateSettings}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onCopyKey={key => { navigator.clipboard.writeText(key); showToast('Sync Key copied!'); }}
        onCopySql={sql => { navigator.clipboard.writeText(sql); showToast('SQL query copied!'); }}
        onPush={handlePush}
        onPull={handlePull}
        onToast={showToast}
      />

      <EditModal
        showEditModal={showEditModal}
        editName={editName}
        editNumber={editNumber}
        editCity={editCity}
        editState={editState}
        editCredentials={editCredentials}
        editPmName={editPmName}
        editAeName={editAeName}
        editItName={editItName}
        editItEmail={editItEmail}
        editItPhone={editItPhone}
        editTravelStart={editTravelStart}
        editTravelEnd={editTravelEnd}
        editSiteStart={editSiteStart}
        editSiteEnd={editSiteEnd}
        editGoLive={editGoLive}
        editType={editType}
        editStage={editStage}
        onClose={() => setShowEditModal(false)}
        onSetName={setEditName}
        onSetNumber={setEditNumber}
        onSetCity={setEditCity}
        onSetState={setEditState}
        onSetCredentials={setEditCredentials}
        onSetPmName={setEditPmName}
        onSetAeName={setEditAeName}
        onSetItName={setEditItName}
        onSetItEmail={setEditItEmail}
        onSetItPhone={setEditItPhone}
        onSetTravelStart={setEditTravelStart}
        onSetTravelEnd={setEditTravelEnd}
        onSetSiteStart={setEditSiteStart}
        onSetSiteEnd={setEditSiteEnd}
        onSetGoLive={setEditGoLive}
        onSetType={setEditType}
        onSetStage={setEditStage}
        onSave={handleSaveEdit}
      />

      <NewProjectWizard
        showWizard={showWizard}
        wizardStep={wizardStep}
        wizName={wizName}
        wizNumber={wizNumber}
        wizCity={wizCity}
        wizState={wizState}
        wizCredentials={wizCredentials}
        wizPmName={wizPmName}
        wizAeName={wizAeName}
        wizItName={wizItName}
        wizItEmail={wizItEmail}
        wizItPhone={wizItPhone}
        wizTravelStart={wizTravelStart}
        wizTravelEnd={wizTravelEnd}
        wizSiteStart={wizSiteStart}
        wizSiteEnd={wizSiteEnd}
        wizGoLive={wizGoLive}
        wizType={wizType}
        wizDrive={wizDrive}
        wizCalendar={wizCalendar}
        onClose={() => setShowWizard(false)}
        onSetName={setWizName}
        onSetNumber={setWizNumber}
        onSetCity={setWizCity}
        onSetState={setWizState}
        onSetCredentials={setWizCredentials}
        onSetPmName={setWizPmName}
        onSetAeName={setWizAeName}
        onSetItName={setWizItName}
        onSetItEmail={setWizItEmail}
        onSetItPhone={setWizItPhone}
        onSetTravelStart={setWizTravelStart}
        onSetTravelEnd={setWizTravelEnd}
        onSetSiteStart={setWizSiteStart}
        onSetSiteEnd={setWizSiteEnd}
        onSetGoLive={setWizGoLive}
        onSetType={setWizType}
        onSetDrive={setWizDrive}
        onSetCalendar={setWizCalendar}
        onNext={() => setWizardStep(prev => Math.min(4, prev + 1))}
        onBack={() => setWizardStep(prev => Math.max(1, prev - 1))}
        onCreate={handleCreateProject}
      />

      {deleteTarget && (
        <DeleteConfirmModal
          project={deleteTarget}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <Toast message={notification} />
    </div>
  );
}