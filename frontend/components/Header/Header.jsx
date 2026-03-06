import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import AddAccount from "./AddAccount";
import AddConnection from "./AddConnection";
import UploadCSV from "./UploadCSV";
import AnalyzeButton from "./AnalyzeButton";
import NavButton from "./NavButton";
import SeriousIcons from "../SeriousIcons";

/** Renders one line with **bold** parsed into <strong> */
function AnalysisLine({ line }) {
  const parts = [];
  let rest = line;
  let key = 0;
  while (rest.length > 0) {
    const match = rest.match(/\*\*(.+?)\*\*/);
    if (!match) {
      parts.push(<span key={key++}>{rest}</span>);
      break;
    }
    const idx = rest.indexOf(match[0]);
    if (idx > 0) parts.push(<span key={key++}>{rest.slice(0, idx)}</span>);
    parts.push(<strong key={key++} style={{ fontWeight: 700, color: '#fff' }}>{match[1]}</strong>);
    rest = rest.slice(idx + match[0].length);
  }
  return <>{parts}</>;
}

/** Splits text into lines and renders each as its own block (like loading credits) so layout can't collapse to one line */
function AnalysisCreditsContent({ text }) {
  if (!text || typeof text !== "string") return null;
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split(/\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <>
      {lines.map((line, i) => (
        <div key={i} style={{ display: 'block', marginBottom: '0.5rem', textAlign: 'left' }}>
          <AnalysisLine line={line} />
        </div>
      ))}
    </>
  );
}

const Header = ({
  isSidebarOpen,
  setIsSidebarOpen,
  currentView,
  hasData,
  is3D,        
  setIs3D,     
  onAddAccount,
  onAddConnection,
  healthStatus,
  hideControls
}) => {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisCopied, setAnalysisCopied] = useState(false);
  const analysisScrollRef = useRef(null);
  const navigate = useNavigate();
  const isApiKeyError = analysisResult && analysisResult.includes("Someone used Gemini API keys already");

  useEffect(() => {
    if (!analysisResult || isApiKeyError) return;
    const el = analysisScrollRef.current;
    if (!el) return;
    const step = 1;
    const intervalMs = 90;
    const edgeBuffer = 24;
    const id = setInterval(() => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll <= 0) return;
      if (scrollTop < edgeBuffer) {
        el.scrollTop = edgeBuffer;
        return;
      }
      if (scrollTop >= maxScroll - edgeBuffer) {
        el.scrollTop = edgeBuffer;
        return;
      }
      el.scrollTop = scrollTop + step;
    }, intervalMs);
    return () => clearInterval(id);
  }, [analysisResult, isApiKeyError]);

  const copyAnalysisToClipboard = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult).then(() => {
      setAnalysisCopied(true);
      setTimeout(() => setAnalysisCopied(false), 2000);
    });
  };

  const ANALYSIS_EDGE_BUFFER = 24;
  const clampAnalysisScroll = () => {
    const el = analysisScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) return;
    if (scrollTop < ANALYSIS_EDGE_BUFFER) el.scrollTop = ANALYSIS_EDGE_BUFFER;
    else if (scrollTop > maxScroll - ANALYSIS_EDGE_BUFFER) el.scrollTop = maxScroll - ANALYSIS_EDGE_BUFFER;
  };

  return (
    <header className="flex-shrink-0 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-white/10 flex flex-col z-[3000] relative">
      <div className="h-20 min-h-[80px] flex items-center px-6 md:px-8 relative justify-between">
        
        {/* Brand / Logo Section */}
        <div className="flex items-center whitespace-nowrap z-10">
          <Link to="/" className="flex flex-col group cursor-pointer">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[8px] md:text-[9px] text-red-600 uppercase font-black tracking-[0.2em] leading-none opacity-80">
                Demo
              </span>
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 -mt-[2px] ${
                healthStatus === "online" 
                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]" 
                  : "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"
              }`} />
            </div>

            {/* Bottom Row: Main Title */}
            <h2 className="font-black text-xl md:text-2xl tracking-tighter text-blue-500 uppercase leading-none transition-colors group-hover:text-blue-400">
              AccountMap 
            </h2>
          </Link>
        </div>

        {!hideControls ? (
          <>
            <div className="hidden md:flex items-center gap-6 flex-1 ml-8">
              {hasData && (
                <div className="flex items-center gap-3 border-l border-white/10 pl-6">
                  <AddAccount onClick={onAddAccount} variant="header" />
                  <AddConnection onClick={onAddConnection} variant="header" />
                  <div className="h-6 border-r border-white/10 mx-1" />
                  <UploadCSV />
                  <AnalyzeButton onResult={setAnalysisResult} />
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {hasData && (
                <>
                  <div className="relative flex rounded-full border border-white/10 bg-black/40 p-0.5 min-w-[100px]">
                    <div
                      className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-blue-600 transition-all duration-300 ease-out"
                      style={{ left: currentView === "/list" ? "calc(50% + 1px)" : "1px" }}
                    />
                    <button
                      type="button"
                      onClick={() => navigate("/")}
                      className="relative z-10 flex-1 py-1.5 px-3 text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <span className={currentView === "/" ? "text-white" : "text-slate-500"}>Map</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/list")}
                      className="relative z-10 flex-1 py-1.5 px-3 text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <span className={currentView === "/list" ? "text-white" : "text-slate-500"}>List</span>
                    </button>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="h-8 px-3 rounded-md transition flex items-center gap-2 text-[9px] font-bold tracking-widest uppercase border border-white/10 bg-white/5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <SeriousIcons.Menu className="w-3 h-3" />
                    <span className="hidden lg:inline">{isSidebarOpen ? "Close" : "Menu"}</span>
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/5 hover:bg-blue-600 hover:border-blue-600 hover:text-white text-slate-400 rounded transition-all duration-300 group cursor-pointer"
            >
              <SeriousIcons.Map className="w-3 h-3 group-hover:rotate-12 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">Main Page</span>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Toolbar */}
      {hasData && !hideControls && (
        <div className="md:hidden flex items-center justify-center gap-2 px-4 py-3 border-t border-white/5 bg-white/[0.02]">
          <div className="relative flex rounded-full border border-white/10 bg-black/40 p-0.5 min-w-[90px]">
            <div
              className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ left: currentView === "/list" ? "calc(50% + 1px)" : "1px" }}
            />
            <button type="button" onClick={() => navigate("/")} className="relative z-10 flex-1 py-1 px-2 text-[9px] font-bold uppercase cursor-pointer">
              <span className={currentView === "/" ? "text-white" : "text-slate-500"}>Map</span>
            </button>
            <button type="button" onClick={() => navigate("/list")} className="relative z-10 flex-1 py-1 px-2 text-[9px] font-bold uppercase cursor-pointer">
              <span className={currentView === "/list" ? "text-white" : "text-slate-500"}>List</span>
            </button>
          </div>
          <div className="h-4 w-[1px] bg-white/10 mx-1" />
          <AddAccount onClick={onAddAccount} variant="header" />
          <AddConnection onClick={onAddConnection} variant="header" />
        </div>
      )}

      {analysisResult && !hideControls && createPortal(
        <div
          style={{
            position: 'fixed',
            left: 16,
            top: '9rem',
            bottom: 96,
            width: 380,
            maxWidth: 'calc(100vw - 32px)',
            zIndex: 2100,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(10,10,10,0.95)',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, gap: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: '#3b82f6', textTransform: 'uppercase' }}>AI Analysis</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                onClick={copyAnalysisToClipboard}
                style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 10, paddingRight: 10, borderRadius: 8, color: analysisCopied ? '#22c55e' : '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}
                onMouseOver={(e) => { if (!analysisCopied) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; } }}
                onMouseOut={(e) => { if (!analysisCopied) { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; } }}
                aria-label="Copy report"
              >
                {analysisCopied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={() => setAnalysisResult(null)}
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; }}
                aria-label="Close analysis"
              >
                ✕
              </button>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 200, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {isApiKeyError ? (
              <div style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                <p style={{ color: '#f87171', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{analysisResult}</p>
              </div>
            ) : (
              <>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 40, background: '#0a0a0a', pointerEvents: 'none', zIndex: 10 }} />
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 40, background: '#0a0a0a', pointerEvents: 'none', zIndex: 10 }} />
            <div
              ref={analysisScrollRef}
              onScroll={clampAnalysisScroll}
              className="custom-scrollbar"
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                position: 'relative',
                zIndex: 5,
                padding: '16px',
                paddingTop: 48,
                paddingBottom: 48,
                fontSize: 13,
                lineHeight: 1.6,
                color: '#d1d5db',
                pointerEvents: 'auto',
                background: '#0a0a0a',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <AnalysisCreditsContent text={analysisResult} />
              </div>
            </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

export default Header;