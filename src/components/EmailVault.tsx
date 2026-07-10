import { useState } from 'react';
import type { Project, EmailTemplate } from '../types';
import { getMailtoUrl } from '../utils/helpers';

interface EmailVaultProps {
  project: Project;
  templates: EmailTemplate[];
  onCopyTemplate: (text: string, templateName: string) => void;
}

export default function EmailVault({
  // project,
  templates,
  onCopyTemplate,
}: EmailVaultProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-charcoal-900 to-charcoal-950 border border-charcoal-800 rounded-xl p-4 shadow-md">
        <div className="flex items-center space-x-2.5 mb-1.5">
          <div className="p-1.5 rounded-lg bg-sunset-950/40 border border-sunset-800/50 text-sunset-400">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider">
            Boilerplate Email Vault
          </h2>
        </div>
        <p className="text-[11px] text-charcoal-400 leading-relaxed ml-[42px]">
          Pre-written email templates for common deployment workflows. Copy,
          customize, and send — no need to rewrite from scratch.
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {templates.map(template => {
          const isExpanded = expandedId === template.id;
          const mailtoHref = getMailtoUrl({
            to: template.to,
            cc: template.cc,
            subject: template.subject,
            body: template.body,
          });

          return (
            <div
              key={template.id}
              className="bg-charcoal-900 border border-charcoal-800 rounded-xl shadow-md flex flex-col overflow-hidden transition-all duration-200 hover:border-charcoal-700"
            >
              {/* Card Header */}
              <div className="p-3.5 border-b border-charcoal-800/60">
                <h3 className="text-xs font-bold text-white leading-snug mb-1">
                  {template.title}
                </h3>
                <p className="text-[11px] text-charcoal-400 leading-relaxed">
                  {template.desc}
                </p>
              </div>

              {/* Fields Section */}
              <div className="p-3.5 space-y-2 flex-1">
                {/* To */}
                <div>
                  <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block mb-0.5">
                    To
                  </span>
                  <span className="text-[11px] text-charcoal-300 break-all">
                    {template.to || (
                      <span className="text-charcoal-600 italic">(filled per project)</span>
                    )}
                  </span>
                </div>

                {/* CC */}
                <div>
                  <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block mb-0.5">
                    CC
                  </span>
                  <span className="text-[11px] text-charcoal-300 break-all">
                    {template.cc || (
                      <span className="text-charcoal-600 italic">(none)</span>
                    )}
                  </span>
                </div>

                {/* Subject */}
                <div>
                  <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block mb-0.5">
                    Subject
                  </span>
                  <span className="text-[11px] text-charcoal-300 break-all">
                    {template.subject}
                  </span>
                </div>

                {/* Collapsible Body Preview */}
                <div>
                  <button
                    onClick={() => toggleExpand(template.id)}
                    className="flex items-center justify-between w-full text-[10px] font-bold text-charcoal-500 uppercase tracking-wider hover:text-charcoal-300 transition-colors py-1"
                  >
                    <span>Body Preview</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className="bg-charcoal-950 border border-charcoal-800 rounded-lg p-2.5 mt-1 max-h-48 overflow-y-auto">
                      <pre className="text-[11px] text-charcoal-300 leading-relaxed whitespace-pre-wrap font-sans">
                        {template.body}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3.5 border-t border-charcoal-800/60 flex items-center space-x-2">
                <button
                  onClick={() => onCopyTemplate(template.body, template.title)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-[11px] font-bold bg-sunset-500 hover:bg-sunset-400 text-charcoal-950 transition-all duration-200 shadow-sm shadow-sunset-950/50"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy Text</span>
                </button>

                <a
                  href={mailtoHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-200 shadow-sm shadow-indigo-950/50"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>Open in Mail</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {templates.length === 0 && (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-8 shadow-md flex flex-col items-center justify-center text-center space-y-2">
          <div className="p-3 rounded-full bg-charcoal-950 border border-charcoal-800 text-charcoal-500">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <p className="text-xs font-bold text-charcoal-400">
            No templates available
          </p>
          <p className="text-[11px] text-charcoal-500 leading-relaxed max-w-sm">
            Email templates will appear here once they are configured for the
            selected project.
          </p>
        </div>
      )}
    </div>
  );
}