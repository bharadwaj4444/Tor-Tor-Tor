import React, { useState, useMemo } from "react";
import { 
  Chrome, 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink, 
  Lock, 
  Copy, 
  Terminal, 
  Eye, 
  Globe, 
  LockKeyhole, 
  Server, 
  Activity, 
  Check 
} from "lucide-react";
import { TorNode, OnionSite } from "../data/torData";

interface TorGuiBrowserProps {
  circuit: {
    entry: TorNode;
    middle: TorNode;
    exit: TorNode;
    socksPort: number;
    userAgent: string;
  } | null;
  backendLoading: boolean;
  onBrowse: (url: string) => Promise<void>;
  lastBrowsedUrl: string;
  onionDirectory: OnionSite[];
}

export default function TorGuiBrowser({
  circuit,
  backendLoading,
  onBrowse,
  lastBrowsedUrl,
  onionDirectory
}: TorGuiBrowserProps) {
  const [addressBar, setAddressBar] = useState<string>("duckduckgogg42xjoc72x3s21a22mdf2a263xs411as3s41a3s213assd.onion");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [inspectMode, setInspectMode] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [viewportContent, setViewportContent] = useState<string>(
    `========================================================================\r\n` +
    `               TOR DEEP WEB PROXY BROWSER DESKTOP VIEWPORT\r\n` +
    `========================================================================\r\n\r\n` +
    `Your secure SOCKS5 proxy (Port 9050) is established and listening.\r\n` +
    `Type a URL in the address bar above or click any of the live Onions below to surf.\r\n\r\n` +
    `- Multi-layer routing prevents identity tracking.\r\n` +
    `- Outgoing IP is masked securely behind randomized Exit Relays.\r\n` +
    `- Encrypted packet handshakes keep logs invisible on local DNS.\r\n\r\n` +
    `------------------------------------------------------------------------\r\n` +
    `Type 'help' in terminal console anytime for low-level advanced parameters.`
  );

  const [activeTabTitle, setActiveTabTitle] = useState<string>("Tor Project Home");

  // Keep Address-Bar and Viewport Content in parity with global state changes (e.g. from CMD or Onion lists)
  React.useEffect(() => {
    if (lastBrowsedUrl) {
      setAddressBar(lastBrowsedUrl);
      
      const syncBrowsedPage = async () => {
        try {
          const res = await fetch("/api/browse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: lastBrowsedUrl })
          });
          const data = await res.json();
          if (data && data.success) {
            setViewportContent(data.content);
            setActiveTabTitle(data.title || lastBrowsedUrl);
          } else {
            setViewportContent(
              `[FAIL] Tor endpoint negotiation timed out.\r\n\r\n` +
              `Failed to traverse exit proxy to site: "${lastBrowsedUrl}"\r\n` +
              `Reason: ${data.content || "Service descriptors absent on Exit point."}`
            );
            setActiveTabTitle("Connection Timeout");
          }
        } catch (err: any) {
          setViewportContent(`[ERROR] Unable to reach target: ${err.message}`);
          setActiveTabTitle("Proxy Failure");
        }
      };
      
      syncBrowsedPage();
    }
  }, [lastBrowsedUrl]);

  // Local fetch wrapper called when pressing enter/click browse in GUI.
  const triggerGuiBrowse = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setAddressBar(targetUrl);
    
    // Explicitly notify parent of browsing action to update logs/circuit map
    onBrowse(targetUrl);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      triggerGuiBrowse(addressBar);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(viewportContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Filtered Onion directories list based on user visual text input
  const filteredSites = useMemo(() => {
    return onionDirectory.filter(site => {
      const q = searchFilter.toLowerCase().trim();
      return (
        site.title.toLowerCase().includes(q) ||
        site.onion.toLowerCase().includes(q) ||
        site.category.toLowerCase().includes(q) ||
        site.description.toLowerCase().includes(q)
      );
    });
  }, [searchFilter, onionDirectory]);

  return (
    <div id="tor-gui-browser-panel" className="w-full bg-[#080d1a] border border-cyan-500/20 rounded-xl overflow-hidden shadow-2xl flex flex-col font-mono text-slate-100">
      
      {/* Mock Chrome Window Chrome Tabs Area */}
      <div className="bg-[#0c1222] px-3 pt-3 flex items-center justify-between border-b border-slate-800 select-none">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {/* Active browsing Tab */}
          <div className="flex items-center gap-2 bg-[#080d1a] border border-slate-800 border-b-0 px-3.5 py-1.5 rounded-t-lg text-xs font-semibold text-cyan-400 select-none relative after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-1.5 after:bg-[#080d1a]">
            <LockKeyhole size={11} className="text-cyan-400" />
            <span className="truncate max-w-[120px]">{activeTabTitle}</span>
          </div>
          {/* Custom add tab button (non-functional mock) */}
          <div className="text-slate-600 px-1 py-1 hover:text-slate-400 cursor-pointer">
            +
          </div>
        </div>

        {/* Windows controls mock */}
        <div className="flex items-center gap-2 text-slate-500 text-[10px] pb-1">
          <span>HOST: 127.0.0.1</span>
          <span>● DECRYPTOR V1.4</span>
        </div>
      </div>

      {/* Mock Chrome Navigation Bar Inputs */}
      <div className="bg-[#0b101f] border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3 text-slate-300">
        
        {/* Navigation Arrows */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => triggerGuiBrowse("torproject.org")}
            className="p-1.5 hover:bg-slate-800/60 rounded text-slate-400 hover:text-white transition"
            title="Go home"
          >
            <ArrowLeft size={14} />
          </button>
          <button 
            disabled
            className="p-1.5 hover:bg-slate-800/60 rounded text-slate-600 cursor-not-allowed transition"
          >
            <ArrowRight size={14} />
          </button>
          <button 
            onClick={() => triggerGuiBrowse(addressBar)}
            disabled={backendLoading}
            className="p-1.5 hover:bg-slate-800/60 rounded text-slate-400 hover:text-white transition disabled:opacity-40"
          >
            <RefreshCw size={14} className={backendLoading ? "animate-spin text-cyan-400" : ""} />
          </button>
        </div>

        {/* Dynamic Address Bar Input */}
        <div className="flex-1 bg-[#050810] border border-cyan-500/25 rounded-md px-3 py-1.5 flex items-center gap-2 relative">
          <div className="flex items-center gap-1.5 text-emerald-400 shrink-0 select-none" title="Tor Encrypted SOCKS Proxy connection">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-bold tracking-tight uppercase">SOCKS5</span>
          </div>
          <span className="text-slate-600 text-[12px] select-none">|</span>
          <input
            type="text"
            value={addressBar}
            onChange={(e) => setAddressBar(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={backendLoading}
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-[12px] text-slate-100 p-0 placeholder-slate-600 font-mono"
            placeholder="Type .onion address or clear web domain... (e.g. protonmail.onion)"
          />
          {circuit && (
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded text-right font-medium shrink-0 animate-pulse border border-cyan-900/60">
              IP: {circuit.exit.ip} ({circuit.exit.countryCode})
            </span>
          )}
        </div>

        {/* Visual action triggers */}
        <button 
          onClick={() => triggerGuiBrowse(addressBar)}
          disabled={backendLoading}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 rounded text-xs transition duration-150 flex items-center gap-1.5 select-none disabled:opacity-50"
        >
          <Search size={12} />
          SURF
        </button>
      </div>

      {/* Main Browser Canvas Frame Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-0 relative min-h-[480px]">
        
        {/* VIEWPORT GRAPHIC SURFACE (Left 7 cols) */}
        <div className="xl:col-span-8 flex flex-col bg-[#050912] border-r border-slate-800 min-h-[380px]">
          
          <div className="flex items-center justify-between px-4 py-2 bg-[#080d19] border-b border-slate-800 select-none">
            <span className="text-[10px] text-cyan-500 font-bold tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              SECURE DETOXIFIED SANDBOX RENDERER
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/40 border border-slate-700/60 px-2 py-0.5 rounded transition"
              >
                {copiedText ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                <span>{copiedText ? "Copied" : "Copy Buffer"}</span>
              </button>
              <button
                onClick={() => setInspectMode(!inspectMode)}
                className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded border transition ${inspectMode ? "bg-purple-950 text-purple-300 border-purple-800" : "text-slate-400 hover:text-white bg-slate-800/40 border-slate-700/60"}`}
              >
                <Eye size={10} />
                <span>Format Code</span>
              </button>
            </div>
          </div>

          {/* Browser internal frame window */}
          <div className="flex-1 p-4 overflow-y-auto max-h-[440px] text-[11px] leading-relaxed relative">
            {backendLoading ? (
              <div className="absolute inset-0 bg-[#050912]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30 select-none font-mono">
                <RefreshCw size={28} className="text-cyan-400 animate-spin" />
                <div className="text-center">
                  <p className="text-cyan-400 font-bold animate-pulse">NEGOTIATING TOR TUNNELS...</p>
                  <p className="text-[10px] text-slate-500 mt-1">SOCKS5 relay handshake traversing global nodes.</p>
                </div>
              </div>
            ) : null}

            {/* Structured Page Content Area */}
            {inspectMode ? (
              /* Display structured simulated source inspect code to enhance visual fidelity */
              <pre className="text-pink-400 font-mono whitespace-pre select-text h-full">
                {`<!-- DECRYPTED PAYLOAD RETRIEVED OVER EXIT PROXY -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${activeTabTitle}</title>
  <meta name="x-tor-anonymity" content="active">
</head>
<body style="font-family: monospace; background: #000; color: #fff;">
  <div id="tor-shield-guard">
    <p>SECURE ROUTE MAP ESTABLISHED THROUGH SOCKS5 LOCAL DAEMON PORT 9050.</p>
    <p>EXIT NODE IP LOCATION IDENTIFIED WITH IP HOST HEADER SPOOF.</p>
  </div>
  
  <main>
    ${viewportContent.substring(0, 1000).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
  </main>
</body>
</html>`}
              </pre>
            ) : (
              <pre id="tor-web-page-raw-output" className="whitespace-pre-wrap select-text text-slate-300 font-mono max-h-[380px] h-full">
                {viewportContent}
              </pre>
            )}
          </div>

          {/* Core connection signature stats footer */}
          {circuit && (
            <div className="px-4 py-2 bg-[#090f1e] border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between select-none">
              <span className="flex items-center gap-1">
                <Server size={10} />
                Exit IP: <strong className="text-slate-300 font-semibold">{circuit.exit.ip}</strong> ({circuit.exit.country})
              </span>
              <span className="hidden sm:inline">
                SOCKS5 Server: <strong className="text-slate-400">127.0.0.1:9050</strong>
              </span>
            </div>
          )}
        </div>

        {/* ONION QUICK DIRECTORY DIRECT PANEL (Right 4 cols) */}
        <div className="xl:col-span-4 bg-[#080d19] p-4 flex flex-col min-h-[300px]">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 select-none">
            <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1 uppercase tracking-wide">
              <Lock size={12} className="text-cyan-400" />
              Verified Onion Links Directory
            </span>
            <span className="text-[9px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-900/40">
              {filteredSites.length} Listed
            </span>
          </div>

          {/* Quick Filter Box */}
          <div className="mb-3 relative select-none">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter deep web sites..."
              className="w-full bg-[#050810] border border-cyan-500/15 rounded px-2.5 py-1 text-[11px] font-mono text-slate-200 outline-none focus:border-cyan-500/35 placeholder-slate-600"
            />
          </div>

          {/* Directory Cards list */}
          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[300px] scrollbar-thin pr-1 select-none">
            {filteredSites.map((site) => (
              <div
                key={site.onion}
                onClick={() => triggerGuiBrowse(site.onion)}
                className="group border border-slate-800/80 hover:border-cyan-500/30 bg-[#060b14] p-2.5 rounded cursor-pointer transition flex flex-col gap-1 hover:bg-slate-950/40"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-bold text-slate-300 group-hover:text-cyan-400 transition truncate max-w-[150px]">
                    {site.title}
                  </span>
                  <span className="text-[8px] bg-slate-900 text-cyan-400 border border-cyan-500/10 px-1.5 py-0.5 rounded uppercase shrink-0">
                    {site.category}
                  </span>
                </div>
                
                <span className="text-[9.5px] text-slate-500 font-mono truncate max-w-[200px]">
                  http://{site.onion}
                </span>

                <p className="text-[9.5px] text-slate-400 leading-snug mt-1 group-hover:text-slate-300 transition">
                  {site.description}
                </p>

                <div className="flex items-center justify-end text-[9px] text-emerald-400 gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>ONLINE</span>
                  <ExternalLink size={8} className="text-slate-500 opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>
            ))}

            {filteredSites.length === 0 && (
              <div className="text-center py-6 text-slate-600 text-[10px]">
                No verified deep sites match query filter.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
