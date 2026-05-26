import React, { useState, useMemo } from "react";
import { 
  Sliders, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Settings, 
  Activity, 
  RefreshCw, 
  Terminal, 
  Check, 
  Copy, 
  Download, 
  Info, 
  Network 
} from "lucide-react";
import { TorNode, ENTRY_NODES, MIDDLE_NODES, EXIT_NODES } from "../data/torData";

interface TorCircuitControllerProps {
  circuit: {
    entry: TorNode;
    middle: TorNode;
    exit: TorNode;
    socksPort: number;
    establishedAt: string;
    userAgent: string;
  } | null;
  onUpdateCircuitNode: (type: "entry" | "middle" | "exit", selectedNode: TorNode) => void;
  onTriggerLog: (type: "success" | "output" | "system", text: string) => void;
}

export default function TorCircuitController({
  circuit,
  onUpdateCircuitNode,
  onTriggerLog
}: TorCircuitControllerProps) {
  const [activeTab, setActiveTab] = useState<"entry" | "middle" | "exit">("entry");
  const [copiedTorrc, setCopiedTorrc] = useState<boolean>(false);

  // Customized Tor proxy state toggles modifying the live torrc
  const [strictNodes, setStrictNodes] = useState<boolean>(false);
  const [dnsSecShield, setDnsSecShield] = useState<boolean>(true);
  const [rotateFrequency, setRotateFrequency] = useState<number>(300); // in seconds
  const [customUserAgent, setCustomUserAgent] = useState<string>("firefox");

  const handleNodeClick = (type: "entry" | "middle" | "exit", node: TorNode) => {
    onUpdateCircuitNode(type, node);
    onTriggerLog("success", `[ OK ] Visual Node Swapped of type [${type.toUpperCase()}] -> ${node.flag} ${node.ip} (${node.country})`);
    onTriggerLog("system", `[ * ] Regenerating AES-256 multi-layer handshake tunnel keys...`);
  };

  const selectedAgentString = useMemo(() => {
    if (customUserAgent === "lynx") return "Mozilla/5.0 (compatible; Lynx/2.8.9rel.1; Linux x86_64)";
    if (customUserAgent === "safari") return "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 TorBrowser/13.5";
    return "Mozilla/5.0 (Windows NT 10.0; rv:128.0) Gecko/20100101 Firefox/128.0";
  }, [customUserAgent]);

  // Dynamically compile the torrc text config file Reactively based on states
  const compiledTorrcConfig = useMemo(() => {
    if (!circuit) return "";
    return `# ==========================================================
# ADVANCED CUSTOM CONFIGURATION (torrc)
# COMPILED BY TOR INTERACTIVE CONTROLS
# ==========================================================

# SOCKS Port Settings
SocksPort ${circuit.socksPort}
SocksListenAddress 127.0.0.1

# Geo-Routing Circuit Constraints
EntryNodes {${circuit.entry.countryCode.toLowerCase()}}
ExitNodes {${circuit.exit.countryCode.toLowerCase()}}
${strictNodes ? "StrictNodes 1" : "# StrictNodes 0 (Allow fallback countries if congested)"}

# DNS Leak Protection and Automapping
${dnsSecShield ? `DNSPort 5353
AutomapHostsOnResolve 1` : "# DNSPort 0"}

# Performance Circuit Refresh
MaxCircuitDirtiness ${rotateFrequency}
NewCircuitPeriod 120

# Active User-Agent Mask
# ${selectedAgentString.substring(0, 50)}...
HTTPHeader "User-Agent: ${selectedAgentString}"

# Log streams to console
Log notice stdout
DataDirectory C:\\Tor\\Data`;
  }, [circuit, strictNodes, dnsSecShield, rotateFrequency, selectedAgentString]);

  const handleCopyTorrc = () => {
    navigator.clipboard.writeText(compiledTorrcConfig);
    setCopiedTorrc(true);
    setTimeout(() => setCopiedTorrc(false), 2000);
  };

  const handleDownloadTorrc = () => {
    const blob = new Blob([compiledTorrcConfig], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "torrc";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getActiveNodeList = () => {
    if (activeTab === "entry") return { list: ENTRY_NODES, currentId: circuit?.entry.ip };
    if (activeTab === "middle") return { list: MIDDLE_NODES, currentId: circuit?.middle.ip };
    return { list: EXIT_NODES, currentId: circuit?.exit.ip };
  };

  const { list: nodesList, currentId: activeNodeIp } = getActiveNodeList();

  return (
    <div id="tor-circuit-controller-panel" className="w-full bg-[#0a0f1d] border border-cyan-500/25 rounded-lg p-4 flex flex-col font-mono select-none">
      
      {/* Top title */}
      <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2 mb-3">
        <span className="text-cyan-400 text-xs font-bold flex items-center gap-1.5 uppercase">
          <Settings size={14} className="text-cyan-400" />
          Interactive Circuit Tuning Deck
        </span>
        <span className="text-[10px] text-slate-500">Live Config</span>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
        Review routing paths. Click to swap individual transit relays. Toggle options on-the-fly to compile a custom physical <code className="bg-slate-800 text-slate-200 px-1 rounded">torrc</code> configuration file.
      </p>

      {/* Grid: Toggles Panel (left) vs Node Selector Panel (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* INTERACTIVE NODE SELECTOR PORT */}
        <div className="flex flex-col border border-slate-850 bg-[#060a12] rounded overflow-hidden">
          
          {/* Subtabs representing Entry / Middle / Exit */}
          <div className="flex border-b border-slate-800 text-[10px] bg-[#0c1220]">
            {(["entry", "middle", "exit"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-center border-r border-slate-800 font-bold transition uppercase tracking-wider ${activeTab === tab ? "bg-cyan-950/40 text-cyan-400 border-b-2 border-b-cyan-500" : "text-slate-500 hover:text-slate-300"}`}
              >
                {tab} Relay
              </button>
            ))}
          </div>

          {/* Node Items Selection list */}
          <div className="p-2 space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-thin">
            {nodesList.map((node) => {
              const isActive = activeNodeIp === node.ip;
              return (
                <div
                  key={node.ip}
                  onClick={() => handleNodeClick(activeTab, node)}
                  className={`p-2 rounded border cursor-pointer transition flex items-center justify-between ${isActive ? "bg-cyan-950/30 border-cyan-500/40 text-cyan-300" : "bg-slate-900/30 border-slate-850 hover:border-slate-700 hover:bg-slate-800/20 text-slate-400"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[14px]">{node.flag}</span>
                    <div className="flex flex-col">
                      <span className="text-[10.5px] font-bold">{node.ip}</span>
                      <span className="text-[9px] text-slate-500 truncate max-w-[120px]">{node.hostname}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 text-right">
                    <span className="text-[9.5px] font-semibold text-slate-400">{node.bandwidth}</span>
                    <span className="text-[8.5px] text-slate-500">rating: {node.ratingCount}/5</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* PROXIES & SOCKS SETTINGS TOGGLES */}
        <div className="flex flex-col gap-3">
          
          {/* Strict exit country */}
          <div className="flex items-center justify-between p-2.5 bg-slate-900/30 border border-slate-800 rounded">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-300">Enforce Strict Exit Relay Country</span>
              <span className="text-[9px] text-slate-500">Deny fallback routes if exit relay lags</span>
            </div>
            <button
              onClick={() => {
                setStrictNodes(!strictNodes);
                onTriggerLog("system", `[ * ] Tor setting toggled: StrictNodes config set to ${!strictNodes ? "1" : "0"}`);
              }}
              className={`w-9 h-5 rounded-full p-0.5 transition ${strictNodes ? "bg-cyan-600 flex justify-end" : "bg-slate-800 flex justify-start"}`}
            >
              <span className="w-4 h-4 rounded-full bg-white block"></span>
            </button>
          </div>

          {/* DNS Sec Leak Shield */}
          <div className="flex items-center justify-between p-2.5 bg-slate-900/30 border border-slate-800 rounded">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                Secure DNS Leak Shield
              </span>
              <span className="text-[9px] text-slate-500">Route all UDP/DNS queries over port 5353</span>
            </div>
            <button
              onClick={() => {
                setDnsSecShield(!dnsSecShield);
                onTriggerLog("system", `[ * ] Tor DNS leak shielding: ${!dnsSecShield ? "ACTIVE (Secure automap enabled)" : "OFFLINE"}`);
              }}
              className={`w-9 h-5 rounded-full p-0.5 transition ${dnsSecShield ? "bg-cyan-600 flex justify-end" : "bg-slate-800 flex justify-start"}`}
            >
              <span className="w-4 h-4 rounded-full bg-white block"></span>
            </button>
          </div>

          {/* Circuit Refresh slider */}
          <div className="p-2.5 bg-slate-900/30 border border-slate-800 rounded flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-300">New Circuit Speed</span>
              <span className="text-cyan-400 font-bold font-mono">{rotateFrequency}s</span>
            </div>
            <input
              type="range"
              min="60"
              max="900"
              step="30"
              value={rotateFrequency}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setRotateFrequency(val);
                onTriggerLog("system", `[ * ] Re-tuning Socks MaxCircuitDirtiness: set to ${val} seconds.`);
              }}
              className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg outline-none cursor-pointer"
            />
          </div>

          {/* User agent spoof */}
          <div className="p-2.5 bg-slate-900/30 border border-slate-800 rounded flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-300">Identity Header Spoof Profile</span>
            <div className="grid grid-cols-3 gap-1 px-0.5 text-[9.5px]">
              {["firefox", "safari", "lynx"].map((ua) => (
                <button
                  key={ua}
                  onClick={() => {
                    setCustomUserAgent(ua);
                    onTriggerLog("system", `[ * ] Header mask set: Browser identity mimicking user-agent profile [${ua.toUpperCase()}]`);
                  }}
                  className={`py-1 rounded font-bold uppercase border transition ${customUserAgent === ua ? "bg-cyan-950/45 border-cyan-500/40 text-cyan-400" : "bg-transparent border-slate-800 text-slate-500"}`}
                >
                  {ua}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* REACTIVE LIVE TORRC FILE OUTPUT CARD */}
      <div className="mt-4 flex flex-col border border-cyan-500/15 rounded bg-[#070b13] overflow-hidden">
        
        <div className="flex items-center justify-between px-3 py-2 bg-cyan-950/40 border-b border-cyan-500/10">
          <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
            <Network size={12} />
            torrc (Auto-Compiled Configuration File)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTorrc}
              className="p-1 hover:bg-cyan-900/40 rounded text-cyan-400 transition"
              title="Download compiled config"
            >
              <Download size={11} />
            </button>
            <button
              onClick={handleCopyTorrc}
              className="p-1 hover:bg-cyan-900/40 rounded text-cyan-400 transition"
              title="Copy config content"
            >
              {copiedTorrc ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            </button>
          </div>
        </div>

        <pre className="p-3 text-[9.5px] text-slate-300 overflow-x-auto select-text leading-relaxed max-h-[140px] bg-slate-950/30 font-mono">
          {compiledTorrcConfig}
        </pre>
      </div>

    </div>
  );
}
