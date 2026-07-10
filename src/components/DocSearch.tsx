import type { ReferenceDoc } from '../types';
import { REFERENCE_DOCS } from '../data/referenceDocs';
import { findSmartAnswer, highlightText } from '../utils/helpers';

interface DocSearchProps {
  docSearchQuery: string;
  expandedDocId: string | null;
  expandedSectionTitle: string | null;
  onQueryChange: (query: string) => void;
  onExpandDoc: (id: string | null) => void;
  onExpandSection: (title: string | null) => void;
  onClearSearch: () => void;
}

const SUGGESTED_QUERIES = [
  {
    title: 'Wall Attenuation Factors',
    desc: 'How do drywall, concrete, and lead glass absorb wireless signals?',
    query: 'drywall concrete lead glass standard attenuation',
  },
  {
    title: 'WMTS Band Spectrum',
    desc: 'What frequency channels and ERP power bounds apply to telemetry transmitters?',
    query: '611 MHz WMTS 8000 channel ERP power AA battery',
  },
  {
    title: 'Multicast Network QoS',
    desc: 'What IGMP, querier, and DSCP configurations are mandatory?',
    query: 'multicast IGMP snooping querier VLAN DSCP EF QoS',
  },
  {
    title: 'Site Survey Walk SOP',
    desc: 'What are the standard signal limits, walking paces, and Ekahau guidelines?',
    query: 'Sidekick walk pace dBm SNR target overlap site survey',
  },
];

export default function DocSearch({
  docSearchQuery,
  expandedDocId,
  expandedSectionTitle,
  onQueryChange,
  onExpandDoc,
  onExpandSection,
  onClearSearch,
}: DocSearchProps) {
  const smartAnswer = findSmartAnswer(docSearchQuery);

  // Build matching results for the search results section
  const getMatchingResults = () => {
    const query = docSearchQuery.trim().toLowerCase();
    if (!query) return null;

    const tokens = query.split(/\s+/).filter(t => t.length > 2);
    if (tokens.length === 0) return null;

    const results: { doc: ReferenceDoc; sec: ReferenceDoc['sections'][0]; score: number }[] = [];

    for (const doc of REFERENCE_DOCS) {
      for (const sec of doc.sections) {
        let score = 0;
        for (const token of tokens) {
          if (sec.keywords.some(k => k.toLowerCase().includes(token))) score += 15;
        }
        const contentLower = sec.content.toLowerCase();
        for (const token of tokens) {
          let idx = -1;
          while ((idx = contentLower.indexOf(token, idx + 1)) !== -1) score += 3;
        }
        const titleLower = sec.title.toLowerCase();
        for (const token of tokens) {
          if (titleLower.includes(token)) score += 8;
        }
        if (score > 0) results.push({ doc, sec, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  };

  const matchingResults = getMatchingResults();

  return (
    <div className="flex-1 bg-charcoal-900 border border-charcoal-800 rounded-xl p-4 flex flex-col shadow-md overflow-hidden min-h-[500px]">
      {/* Header */}
      <div className="pb-3.5 border-b border-charcoal-800 mb-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sunset-500 animate-pulse">
              <path d="M12 3a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9 9 9 0 0 0-9-9z" />
              <path d="M12 7v5l3 3" />
            </svg>
            <span>Technical Reference Vault</span>
          </h2>
          <p className="text-xs text-charcoal-400">
            Search work instructions, device spectrum parameters, and medical-grade network deployment specifications.
          </p>
        </div>
        {docSearchQuery && (
          <button onClick={onClearSearch} className="text-[10px] font-black tracking-wider text-sunset-500 hover:text-sunset-400 border border-sunset-500/30 hover:border-sunset-500/50 bg-sunset-500/5 px-2.5 py-1.5 rounded-lg transition-all">
            CLEAR SEARCH
          </button>
        )}
      </div>

      {/* Search input */}
      <div className="relative mb-4 group">
        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-charcoal-500 group-focus-within:text-sunset-500 transition-colors">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          value={docSearchQuery}
          onChange={e => {
            onQueryChange(e.target.value);
            onExpandDoc(null);
            onExpandSection(null);
          }}
          placeholder="Ask our Technical Reference AI (e.g. 'standard attenuation drywall', 'WMTS spectrum', 'multicast requirements' or 'Sidekick SOP')..."
          className="w-full bg-charcoal-950 border border-charcoal-800 group-hover:border-charcoal-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-11 pr-4 text-xs font-medium text-white placeholder-charcoal-500 outline-none transition-all duration-200"
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 pointer-events-none">
          <span className="text-[9px] font-bold text-charcoal-600 bg-charcoal-900 border border-charcoal-800 px-1.5 py-0.5 rounded uppercase tracking-wider">OFFLINE CO-PILOT</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
        {/* Left column */}
        <div className="lg:col-span-7 flex flex-col space-y-4 overflow-y-auto pr-1">
          {/* Smart Answer Card */}
          {smartAnswer ? (
            <div className="bg-gradient-to-br from-charcoal-950 via-charcoal-950 to-indigo-950/20 border border-sunset-500/30 rounded-xl p-4 shadow-lg shadow-sunset-500/5 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-sunset-500 to-indigo-500" />
              <div className="flex justify-between items-start pb-2.5 border-b border-charcoal-800/80 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-sunset-500/10 p-1.5 rounded-lg border border-sunset-500/20">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sunset-500">
                      <path d="M12 3a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9 9 9 0 0 0-9-9z" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-sunset-500 uppercase tracking-widest block">SignalFlow AI</span>
                    <h4 className="text-xs font-black text-white">Smart Answer Synthesis</h4>
                  </div>
                </div>
                <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded border ${
                  smartAnswer.score > 40
                    ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50'
                    : smartAnswer.score >= 15
                    ? 'text-amber-400 bg-amber-950/40 border-amber-900/50'
                    : 'text-indigo-400 bg-indigo-950/40 border-indigo-900/50'
                }`}>
                  {smartAnswer.score > 40 ? 'HIGH CONFIDENCE' : smartAnswer.score >= 15 ? 'MODERATE MATCH' : 'POTENTIAL RELEVANCE'}
                </span>
              </div>
              <div className="text-xs text-charcoal-200 leading-relaxed space-y-2 mb-4 font-medium pl-1.5">
                <p className="bg-charcoal-900/40 border border-charcoal-800/40 p-3 rounded-xl italic text-white text-xs">
                  {highlightText(smartAnswer.excerpt, docSearchQuery)}
                </p>
              </div>
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
                      onExpandDoc(foundDoc.id);
                      onExpandSection(smartAnswer.sectionTitle);
                    }
                  }}
                  className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 hover:border-indigo-500 text-indigo-300 text-[9px] font-black tracking-widest px-2.5 py-1.5 rounded-md transition-all flex items-center space-x-1"
                >
                  <span>EXPLORE MANUAL</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            </div>
          ) : docSearchQuery.trim().length >= 3 ? (
            <div className="bg-charcoal-950/50 border border-charcoal-800 border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center space-y-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-charcoal-600">
                <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h4 className="text-xs font-black text-charcoal-400 uppercase tracking-wider">No Direct Answer Synthesized</h4>
              <p className="text-[11px] text-charcoal-500 max-w-sm leading-relaxed">
                Your query did not trigger a direct match. Try searching for precise terms like "drywall", "concrete", "611 MHz", "IGMP snooping", "EF class", or "Sidekick".
              </p>
            </div>
          ) : (
            <div className="bg-charcoal-950/40 border border-charcoal-800 rounded-xl p-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider border-b border-charcoal-800 pb-2 mb-3 flex items-center space-x-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sunset-500">
                  <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Suggested Clinical & Engineering Queries</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {SUGGESTED_QUERIES.map((pill, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onQueryChange(pill.query);
                      onExpandDoc(null);
                      onExpandSection(null);
                    }}
                    className="bg-charcoal-950 hover:bg-charcoal-900 border border-charcoal-800/80 hover:border-indigo-900 text-left p-3 rounded-xl transition-all duration-200 group/pill flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-black text-white group-hover/pill:text-sunset-400 transition-colors uppercase tracking-wide">{pill.title}</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-charcoal-600 group-hover/pill:text-sunset-500 group-hover/pill:translate-x-1 transition-all">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                    <p className="text-[10px] text-charcoal-400 group-hover/pill:text-charcoal-300 leading-relaxed">{pill.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results / Browse */}
          <div>
            <h3 className="text-xs font-black text-charcoal-400 uppercase tracking-widest border-b border-charcoal-800 pb-2 mb-3">
              {docSearchQuery ? 'Matching Document Reference Sections' : 'Browse Offline Manual Chapters'}
            </h3>

            <div className="space-y-3.5">
              {!docSearchQuery.trim() ? (
                REFERENCE_DOCS.map(doc => (
                  <div key={doc.id} className={`border rounded-xl p-3.5 transition-all duration-200 ${
                    expandedDocId === doc.id ? 'bg-charcoal-950 border-indigo-900 shadow-md shadow-indigo-950/20' : 'bg-charcoal-950/50 border-charcoal-800/80 hover:border-charcoal-700'
                  }`}>
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
                        onClick={() => onExpandDoc(expandedDocId === doc.id ? null : doc.id)}
                        className="bg-charcoal-900 hover:bg-charcoal-800 border border-charcoal-800 text-charcoal-300 text-[10px] font-black tracking-wider px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {expandedDocId === doc.id ? 'CLOSE CHAPTERS' : 'VIEW CHAPTERS'}
                      </button>
                    </div>

                    {expandedDocId === doc.id && (
                      <div className="mt-4 border-t border-charcoal-800 pt-3 space-y-3">
                        {doc.sections.map((sec, sIdx) => (
                          <div key={sIdx} className={`bg-charcoal-900/60 rounded-lg p-3 border transition-colors ${
                            expandedSectionTitle === sec.title ? 'border-sunset-500/40 bg-gradient-to-r from-charcoal-900 to-indigo-950/30' : 'border-charcoal-850'
                          }`}>
                            <h5 className="text-[11px] font-black text-white border-b border-charcoal-800 pb-1.5 mb-2 flex items-center justify-between">
                              <span className="flex items-center space-x-1.5">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sunset-500">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span>{sec.title}</span>
                              </span>
                              {expandedSectionTitle === sec.title && (
                                <span className="text-[8px] font-black text-sunset-500 bg-sunset-500/10 px-1.5 py-0.5 rounded tracking-widest uppercase">CITED HIGHLIGHT</span>
                              )}
                            </h5>
                            <p className="text-[11px] text-charcoal-300 leading-relaxed font-mono whitespace-pre-line">{sec.content}</p>
                            <div className="flex flex-wrap gap-1 mt-2.5">
                              {sec.keywords.map((kw, kwIdx) => (
                                <span key={kwIdx} className="text-[8px] font-semibold text-charcoal-500 bg-charcoal-950 px-1.5 py-0.5 rounded border border-charcoal-850 font-mono">#{kw}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : matchingResults && matchingResults.length > 0 ? (
                matchingResults.map(({ doc, sec, score }, idx) => (
                  <div key={idx} className="bg-charcoal-950 border border-charcoal-800/80 hover:border-indigo-900 rounded-xl p-3.5 transition-all duration-200">
                    <div className="flex justify-between items-start pb-2 border-b border-charcoal-900 mb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-[8px] font-black text-indigo-400 bg-indigo-950/60 border border-indigo-900 px-1.5 py-0.5 rounded tracking-wide uppercase">
                          {doc.category === 'Work Instructions' ? 'WORK INST' : doc.category === 'Device Specifications' ? 'DEVICE SPEC' : 'NET GUIDE'}
                        </span>
                        <span className="text-[10px] font-mono text-charcoal-500 font-bold">{doc.docNum}</span>
                      </div>
                      <span className="text-[9px] text-charcoal-500 font-mono font-bold uppercase tracking-wider">MATCH SCORE: {score}</span>
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
                        <span key={kwIdx} className="text-[8px] font-semibold text-charcoal-500 bg-charcoal-900 px-1.5 py-0.5 rounded border border-charcoal-850 font-mono">#{kw}</span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-charcoal-950/20 border border-charcoal-800 rounded-xl p-8 text-center text-charcoal-500 text-xs italic">
                  No sections matched your specific search. Try general terms or view the full library chapters below.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-5 bg-charcoal-950 border border-charcoal-800/80 rounded-xl p-3.5 flex flex-col overflow-y-auto max-h-[80vh] lg:max-h-full space-y-4">
          <div>
            <div className="flex items-center space-x-2 pb-2.5 border-b border-charcoal-800 mb-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
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
                    onExpandDoc(expandedDocId === doc.id ? null : doc.id);
                    onExpandSection(null);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all duration-200 ${
                    expandedDocId === doc.id ? 'bg-indigo-950/20 border-indigo-700/80 shadow-inner' : 'bg-charcoal-900/60 border-charcoal-800 hover:border-charcoal-750 hover:bg-charcoal-900'
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
          <div className="bg-gradient-to-r from-charcoal-900 to-indigo-950/40 border border-indigo-900/50 rounded-xl p-3 text-[10px] text-charcoal-400 leading-relaxed space-y-1.5">
            <span className="font-black text-white uppercase tracking-widest block text-[9px] text-sunset-500">🔒 SECURE LOCAL Sandbox</span>
            <p>All documentation is bundled natively inside your local PWA code database. No queries leave your browser workspace, preserving absolute patient data confidentiality and enabling seamless offline access inside shielded hospital care centers.</p>
          </div>
        </div>
      </div>
    </div>
  );
}