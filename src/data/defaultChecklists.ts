import type { ChecklistItem } from '../types';

export const DEFAULT_ASSESSMENT_CHECKLIST: ChecklistItem[] = [
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
  { id: 'wa_16', task: 'Attend PM-scheduled customer review call to finalize hand-off', completed: false },
];

export const DEFAULT_DESIGN_CHECKLIST: ChecklistItem[] = [
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
  { id: 'wd_12', task: 'Customer signoff & project closing call', completed: false },
];