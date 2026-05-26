import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Terminal as TerminalIcon,
  Shield,
  ShieldAlert,
  RefreshCw,
  Search,
  Compass,
  HelpCircle,
  Info,
  Globe,
  Sliders,
  Check,
  Copy,
  SlidersHorizontal,
  Wifi,
  Database,
  Chrome,
  Terminal,
  ExternalLink,
  Lock
} from "lucide-react";
import CircuitMap from "./components/CircuitMap";
import SocksConfigurator from "./components/SocksConfigurator";
import { TorNode, OnionSite, ONION_DIRECTORY } from "./data/torData";
import TorGuiBrowser from "./components/TorGuiBrowser";
import TorCircuitController from "./components/TorCircuitController";
import TorProxyTelemetry from "./components/TorProxyTelemetry";

interface TerminalLine {
  id: string;
  type: "input" | "output" | "error" | "success" | "system";
  text: string;
  isHtml?: boolean;
}

export default function App() {
  // Terminal Custom Styles / Themes
  const [theme, setTheme] = useState<"cmd" | "pwsh" | "matrix">("cmd");
  const [crtEffect, setCrtEffect] = useState<boolean>(true);

  // Connection proxy state
  const [circuit, setCircuit] = useState<{
    entry: TorNode;
    middle: TorNode;
    exit: TorNode;
    socksPort: number;
    establishedAt: string;
    totalRequests: number;
    userAgent: string;
  } | null>(null);
  
  const [geminiActive, setGeminiActive] = useState<boolean>(false);
  const [backendLoading, setBackendLoading] = useState<boolean>(false);
  
  // Interactive Panel active overlays/drawers
  const [activePanel, setActivePanel] = useState<"map" | "socks" | "directory" | "none">("map");
  const [workspaceView, setWorkspaceView] = useState<"cli" | "gui">("cli");

  // Node Swap visual triggers for GUI controls
  const handleUpdateCircuitNode = (type: "entry" | "middle" | "exit", selectedNode: TorNode) => {
    if (!circuit) return;
    setCircuit(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [type]: selectedNode,
        totalRequests: prev.totalRequests + 1
      };
    });
  };

  // Terminal logic lines and states
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [lastBrosedUrl, setLastBrowsedUrl] = useState<string>("");

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize and load circuit info
  useEffect(() => {
    fetchCircuitStatus();
  }, []);

  // Set initial command greetings on mount
  useEffect(() => {
    const greetingText: TerminalLine[] = [
      { id: "g1", type: "system", text: "Microsoft Windows [Version 10.0.19045]" },
      { id: "g2", type: "system", text: "(c) Microsoft Corporation. All rights reserved. Registered Tor Daemon Client." },
      { id: "g3", type: "system", text: "" },
      { id: "g4", type: "success", text: "[ OK ] Tunnel proxy pipeline connected over port 9050" },
      { id: "g5", type: "output", text: "--------------------------------------------------------" },
      { id: "g6", type: "output", text: "   📍 TOR COMMAND PROMPT INTERACTIVE BROWSER TERMINAL" },
      { id: "g7", type: "output", text: "   Type 'help' to render a list of anonymous proxy controllers." },
      { id: "g8", type: "output", text: "   Try typing 'tor-browse torproject.org' or 'onion-search' to surf!" },
      { id: "g9", type: "output", text: "--------------------------------------------------------" },
      { id: "g10", type: "system", text: "" }
    ];
    setLines(greetingText);
  }, []);

  // Scroll to bottom helper whenever command output updates
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, backendLoading]);

  // Focus terminal input when clicking anywhere inside the terminal container box
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const fetchCircuitStatus = async () => {
    try {
      const res = await fetch("/api/circuit/status");
      const data = await res.json();
      if (data && data.circuit) {
        setCircuit(data.circuit);
        setGeminiActive(data.geminiActive);
      }
    } catch (err) {
      console.error("Error loading proxy state:", err);
    }
  };

  // Re-route Tor circuits
  const triggerNewCircuit = async (quiet = false) => {
    setBackendLoading(true);
    if (!quiet) {
      addTerminalLine("input", "new-circuit");
      addTerminalLine("system", "[ * ] Resetting active SOCKS5 proxy session coordinates...");
    }
    
    try {
      const res = await fetch("/api/circuit/new", { method: "POST" });
      const data = await res.json();
      if (data && data.circuit) {
        setCircuit(data.circuit);
        if (!quiet) {
          // Stream logs into terminal
          data.logs.forEach((log: string, idx: number) => {
            setTimeout(() => {
              addTerminalLine(log.includes("SUCCESS") ? "success" : "output", log);
              if (idx === data.logs.length - 1) {
                setBackendLoading(false);
              }
            }, (idx + 1) * 200);
          });
        } else {
          setBackendLoading(false);
        }
      }
    } catch (err) {
      if (!quiet) {
        addTerminalLine("error", "[ERROR] Connection reset protocol failed. Internal gateway mismatch.");
      }
      setBackendLoading(false);
    }
  };

  // Dispatch search commands for deep web Onions
  const handleOnionSearch = async (query: string) => {
    setBackendLoading(true);
    try {
      const res = await fetch("/api/onion-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      if (data && data.results) {
        addTerminalLine("success", `[ OK ] Onion site lookup completed. Indexes matched: ${data.results.length}`);
        addTerminalLine("output", "--------------------------------------------------------------------------------");
        addTerminalLine("system", "TITLE                                ONION PATH                           STATUS");
        addTerminalLine("output", "--------------------------------------------------------------------------------");
        
        data.results.forEach((site: OnionSite) => {
          const paddedTitle = site.title.padEnd(35, " ").substring(0, 35);
          const slicedOnion = site.onion.substring(0, 30) + "...";
          const statusText = site.isOnline ? "● ONLINE" : "■ OFFLINE";
          addTerminalLine("output", `${paddedTitle}  http://${slicedOnion}   ${statusText}`);
          addTerminalLine("system", `  Description: ${site.description}\n`);
        });
        addTerminalLine("output", "--------------------------------------------------------------------------------");
      }
    } catch (err) {
      addTerminalLine("error", "[ERROR] Deep onion search index unreachable.");
    } finally {
      setBackendLoading(false);
    }
  };

  // Ping simulation diagnostics
  const handlePing = async (target: string) => {
    setBackendLoading(true);
    try {
      const res = await fetch("/api/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target })
      });
      const data = await res.json();
      if (data && data.hops) {
        addTerminalLine("output", `Tracing anonymous tor route to ${data.host} over maximal multi-hop exit path:`);
        addTerminalLine("output", "--------------------------------------------------------------------------------");
        
        data.hops.forEach((hop: any) => {
          setTimeout(() => {
            addTerminalLine("success", ` Hop [${hop.hop}]  ->  ${hop.address.padEnd(16, " ")} | ${hop.name.padEnd(45, " ")} | Latency: ${hop.timeMs}ms`);
          }, hop.hop * 150);
        });

        setTimeout(() => {
          addTerminalLine("output", "--------------------------------------------------------------------------------");
          addTerminalLine("success", `[SUCCESS] Route secure. Trace verified in ${data.avgLatencyMs}ms. SOCKS5 status encrypted.`);
          setBackendLoading(false);
        }, 5 * 180);
      }
    } catch (err) {
      addTerminalLine("error", "[ERROR] Connection target was unreachable along current routing path.");
      setBackendLoading(false);
    }
  };

  // DNS Lookup simulation diagnostics
  const handleDNS = async (domain: string) => {
    setBackendLoading(true);
    try {
      const res = await fetch("/api/dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain })
      });
      const data = await res.json();
      if (data && data.resolved) {
        addTerminalLine("success", `Resolved secure virtual domain name maps inside isolated shell:`);
        addTerminalLine("output", `Domain target: ${data.domain}`);
        addTerminalLine("output", `A Records:     ${data.addresses.join(", ")}`);
        addTerminalLine("system", `Resolver:      ${data.resolverMode}`);
        addTerminalLine("system", `Trace details: ${data.notes}`);
      }
    } catch (err) {
      addTerminalLine("error", `[ERROR] Unable to resolve DNS for "${domain}" anonymizing wrapper.`);
    } finally {
      setBackendLoading(false);
    }
  };

  // HTTP Browse client
  const handleBrowse = async (url: string) => {
    if (!url) {
      addTerminalLine("error", "[ERROR] Please specify target URL/Onion path. Usage: tor-browse [url]");
      return;
    }
    
    setBackendLoading(true);
    addTerminalLine("system", `[ * ] Requesting circuit proxy mapping for ${url}...`);
    addTerminalLine("system", `[ * ] Routing through: Entry (${circuit?.entry.countryCode}) -> Middle (${circuit?.middle.countryCode}) -> Exit (${circuit?.exit.countryCode})`);
    
    try {
      const res = await fetch("/api/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      
      if (data && data.success) {
        setLastBrowsedUrl(data.url);
        addTerminalLine("success", `\n[ SUCCESS ] Fetched successfully (${data.sizeBytes} bytes) via exit ip ${data.exitNodeIp} (${data.exitCountry})`);
        
        if (data.aiPowered) {
          addTerminalLine("success", "[ AI ] Page reformatted elegantly inside CMD via Gemini 3.5-Flash compiler:\n");
        } else {
          addTerminalLine("system", "[ SYS ] Note: Standard parsed rendering (Gemini API offline):\n");
        }

        addTerminalLine("output", data.content);
        addTerminalLine("output", "\n------------------------------------------------------------\n");
      } else {
        addTerminalLine("error", `\n[ FAIL ] Routing timed out or target rejected connections.`);
        addTerminalLine("output", data.content || "Connection parameters exhausted.");
      }
    } catch (err) {
      addTerminalLine("error", "[ERROR] Request failed to traverse exit proxy firewall.");
    } finally {
      setBackendLoading(false);
    }
  };

  // Command parser router
  const processCommand = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    // Add to command history UI lines
    addTerminalLine("input", trimmed);
    
    // Save history array
    const updatedHistory = [trimmed, ...commandHistory];
    setCommandHistory(updatedHistory);
    setHistoryIndex(-1);

    const parts = trimmed.split(" ");
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1).join(" ");

    switch (commandName) {
      case "help":
        runHelpCommand();
        break;
      case "cls":
      case "clear":
        setLines([]);
        break;
      case "status":
        runStatusCommand();
        break;
      case "circuit":
        runCircuitCommand();
        break;
      case "new-circuit":
      case "reset":
        triggerNewCircuit();
        break;
      case "onion-search":
        handleOnionSearch(args);
        break;
      case "ping":
      case "ping-node":
        if (!args) {
          addTerminalLine("error", "Error: Specify ping target IP, website, or Node IP. e.g. ping google.com");
        } else {
          handlePing(args);
        }
        break;
      case "nslookup":
        if (!args) {
          addTerminalLine("error", "Error: Specify domain. e.g. nslookup duckduckgo.com");
        } else {
          handleDNS(args);
        }
        break;
      case "tor-browse":
      case "browse":
      case "get":
        handleBrowse(args);
        break;
      case "socks5-config":
      case "config":
        runSocksConfigCommand();
        break;
      case "headers":
        runHeadersCommand();
        break;
      case "ip":
        runIpCheckCommand();
        break;
      default:
        addTerminalLine("error", `'${commandName}' is not recognized as an internal or external command, operable program or batch file.`);
        addTerminalLine("system", "Type 'help' to render a complete overview of active Tor Commands.");
    }
  };

  const addTerminalLine = (type: TerminalLine["type"], text: string, isHtml = false) => {
    const newLineId = "line_" + Math.random().toString(36).substr(2, 9);
    setLines(prev => [...prev, { id: newLineId, type, text, isHtml }]);
  };

  // CMD Output commands generators:
  const runHelpCommand = () => {
    addTerminalLine("output", "==================================================================================");
    addTerminalLine("success", "                  TOR COMMAND PORT PROXY INTEGRATION CONTROLS");
    addTerminalLine("output", "==================================================================================");
    addTerminalLine("output", "  tor-browse [url]    - Anonymously fetches clear web page / onion addresses,");
    addTerminalLine("output", "                        renders text-format elegantly inside the terminal (via Gemini).");
    addTerminalLine("output", "  new-circuit         - Resets & rolls a brand new EntryGuard -> Middle -> Exit circuit.");
    addTerminalLine("output", "  onion-search [q]    - Search database of verified hidden .onion service links.");
    addTerminalLine("output", "  circuit             - Output detailed PGP details & tracer hops of active Tor relay.");
    addTerminalLine("output", "  status              - Displays current SOCKS port, total requests, build & routing IDs.");
    addTerminalLine("output", "  ping [domain/ip]    - Simulates diagnostics check metrics along the active node tunnel.");
    addTerminalLine("output", "  nslookup [domain]   - Performs secure virtual anonymous DNS IP maps translation.");
    addTerminalLine("output", "  socks5-config       - Prints batch files and local settings for Windows CMD client.");
    addTerminalLine("output", "  ip                  - Output identity review (compares public IP vs. Exit node IP).");
    addTerminalLine("output", "  cls | clear         - Flushes input history & resets CMD buffer.");
    addTerminalLine("output", "  help                - Prints this dynamic CMD parameters instruction guide.");
    addTerminalLine("output", "==================================================================================");
  };

  const runStatusCommand = () => {
    if (!circuit) return;
    addTerminalLine("success", ">>> TOR ENVIRONMENT CLOCK HANDSHAKE STATUS:");
    addTerminalLine("output", `  Active SOCKS5 Host  : 127.0.0.1`);
    addTerminalLine("output", `  SOCKS Listener Port : ${circuit.socksPort}`);
    addTerminalLine("output", `  Tor Binary Version  : ${circuit.torVersion}`);
    addTerminalLine("output", `  Requests Channeled  : ${circuit.totalRequests}`);
    addTerminalLine("output", `  Circuit Uptime      : Connected on ${new Date(circuit.establishedAt).toLocaleTimeString()}`);
    addTerminalLine("system", `  Active Exit Node IP : ${circuit.exit.ip} (${circuit.exit.hostname})`);
    addTerminalLine("system", `  AI Engine Model     : ${geminiActive ? "Gemini 3.5-Flash Active (Server-Side Proxy)" : "Gemini Offline - Fallback Local Text Scraping"}`);
  };

  const runCircuitCommand = () => {
    if (!circuit) return;
    addTerminalLine("output", ">>> TRACING ACTIVE CRYPTOGRAPHIC MULTI-HOP CIRCUIT LAYERS:");
    addTerminalLine("output", " [LOCAL CLIENT]                                   (Workspace User Console)");
    addTerminalLine("output", "        │");
    addTerminalLine("output", "        ▼");
    addTerminalLine("success", ` [1. ENTRY GUARD] --->  ${circuit.entry.flag} ${circuit.entry.ip} (${circuit.entry.country})`);
    addTerminalLine("system", `                       Hostname: ${circuit.entry.hostname} (Port: ${circuit.entry.port})`);
    addTerminalLine("system", `                       Bandwidth: ${circuit.entry.bandwidth} | Node rating: ${circuit.entry.ratingCount}/5.0`);
    addTerminalLine("output", "        │");
    addTerminalLine("output", "        ▼");
    addTerminalLine("success", ` [2. MIDDLE RELAY] -->  ${circuit.middle.flag} ${circuit.middle.ip} (${circuit.middle.country})`);
    addTerminalLine("system", `                       Hostname: ${circuit.middle.hostname} | Bandwidth: ${circuit.middle.bandwidth}`);
    addTerminalLine("output", "        │");
    addTerminalLine("output", "        ▼");
    addTerminalLine("success", ` [3. EXIT NODE] ----->  ${circuit.exit.flag} ${circuit.exit.ip} (${circuit.exit.country})  [PROXY OUTPUT]`);
    addTerminalLine("system", `                       Hostname: ${circuit.exit.hostname} | Geo-ISP Target Server Channel`);
    addTerminalLine("output", "        │");
    addTerminalLine("output", "        ▼");
    addTerminalLine("success", ` [TARGET SITE]        (Endpoint payload encrypted via AES-256 TLS)`);
    addTerminalLine("output", "\n* Note: Routing nodes are fetched in rotation dynamically to eliminate identity leaks.");
  };

  const runSocksConfigCommand = () => {
    addTerminalLine("success", "Establishing SOCKS5 configuration deck inside UI workspace...");
    setActivePanel("socks");
    addTerminalLine("output", "Use the 'Socks Config' panel in the Right Panel to read or download fully configured 'torrc' and 'tor_startup.bat' scripts for your physical Windows CMD client console.");
  };

  const runHeadersCommand = () => {
    if (!circuit) return;
    addTerminalLine("success", "Active HTTP Request Headers configuration metrics:");
    addTerminalLine("output", `  User-Agent          : ${circuit.userAgent}`);
    addTerminalLine("output", `  Accept-Language     : en-US,en;q=0.5`);
    addTerminalLine("output", `  DNT (Do Not Track)  : 1 (Enabled)`);
    addTerminalLine("output", `  Sec-GPC (Global-PC) : 1 (Active)`);
    addTerminalLine("system", `  X-Forwarded-For     : MASKED / ANONYMOUS`);
  };

  const runIpCheckCommand = () => {
    if (!circuit) return;
    addTerminalLine("output", ">>> TOR ANONYMOUS ROUTE IDENTITY VERIFICATION:");
    addTerminalLine("error", "  [BEFORE] Your Public Core IP    : [MASKED BY SANBOX] (Service IP Exposed)");
    addTerminalLine("success", `  [AFTER]  Tor Exit Relay Proxy   :  ${circuit.exit.ip}  [${circuit.exit.country}]`);
    addTerminalLine("success", `  Routing Protocol Status         :  SUCCESSFULLY ANONYMIZED`);
    addTerminalLine("system", "  Identity rating: Your browsing traces are fully encrypted and relayed across global nodes.");
  };

  // Handle Enter keypress on Command Prompt
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      processCommand(currentInput);
      setCurrentInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = historyIndex + 1;
        if (nextIdx < commandHistory.length) {
          setHistoryIndex(nextIdx);
          setCurrentInput(commandHistory[nextIdx]);
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = historyIndex - 1;
      if (nextIdx >= 0) {
        setHistoryIndex(nextIdx);
        setCurrentInput(commandHistory[nextIdx]);
      } else {
        setHistoryIndex(-1);
        setCurrentInput("");
      }
    }
  };

  // Keyboard autocomplete helper
  const handleCommandShortcut = (command: string) => {
    setCurrentInput(command);
    inputRef.current?.focus();
  };

  const triggerDirectBrowse = (onionUrl: string) => {
    handleBrowse(onionUrl);
  };

  // Terminal Theme class names mapper
  const getThemeClasses = () => {
    switch (theme) {
      case "pwsh":
        return {
          container: "bg-[#012456] text-[#ffffff] font-mono",
          header: "bg-[#011430] border-b border-[#0151b7]/40 text-[#ffffff]",
          promptColor: "text-amber-400",
          inputColor: "text-white caret-yellow-400 font-bold",
          scrollbar: "scrollbar-pwsh"
        };
      case "matrix":
        return {
          container: "bg-[#020804] text-[#22c55e] font-mono",
          header: "bg-[#010502] border-b border-emerald-900 text-[#22c55e]",
          promptColor: "text-emerald-500",
          inputColor: "text-[#22c55e] caret-[#22c55e] font-semibold tracking-wider",
          scrollbar: "scrollbar-matrix"
        };
      default: // System cmd
        return {
          container: "bg-[#0c0c0c] text-[#cccccc] font-mono",
          header: "bg-[#181818] border-b border-neutral-800 text-[#cccccc]",
          promptColor: "text-[#cccccc]",
          inputColor: "text-[#eaeaea] caret-white font-normal",
          scrollbar: "scrollbar-cmd"
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div id="tor-app-workspace" className="min-h-screen bg-[#06080e] text-slate-100 flex flex-col antialiased">
      {/* Top Banner Navigation Bar */}
      <header className="border-b border-[#1e293b] bg-[#0c1220]/90 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 select-none">
            <Shield className="animate-pulse" size={24} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              TOR TERMINAL BROWSER
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                SECURED PORT: 9050
              </span>
            </h1>
            <p className="text-xs text-slate-400">Windows CLI anonymous routing & deep onion proxies index simulation</p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Workspace mode switcher */}
          <div className="flex items-center bg-[#0f172a] p-1 rounded border border-slate-700/60 text-[10.5px] select-none">
            <button
              onClick={() => {
                setWorkspaceView("cli");
                addTerminalLine("system", "[ * ] Switched active workspace channel to Command Prompt Client (CLI).");
              }}
              className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 font-bold uppercase tracking-wider ${workspaceView === "cli" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:text-slate-200"}`}
            >
              <TerminalIcon size={12} />
              CLI Command Port
            </button>
            <button
              onClick={() => {
                setWorkspaceView("gui");
                addTerminalLine("system", "[ * ] Switched active workspace channel to Secure Web Portal (GUI Desktop).");
              }}
              className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 font-bold uppercase tracking-wider ${workspaceView === "gui" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-slate-400 hover:text-slate-200"}`}
            >
              <Chrome size={12} />
              Secure GUI Desk
            </button>
          </div>

          <button
            onClick={() => triggerNewCircuit()}
            disabled={backendLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#0f172a] hover:bg-[#1e293b] text-slate-300 rounded border border-slate-700/60 transition disabled:opacity-40"
          >
            <RefreshCw size={12} className={backendLoading ? "animate-spin" : ""} />
            Roll Fresh Circuit
          </button>

          {/* Theme custom selection */}
          <div className="flex items-center bg-[#0f172a] p-1 rounded border border-slate-700/60 text-xs">
            <button
              onClick={() => setTheme("cmd")}
              className={`px-2 py-1 rounded transition ${theme === "cmd" ? "bg-slate-800 text-white font-medium" : "text-slate-400 hover:text-slate-200"}`}
            >
              CMD
            </button>
            <button
              onClick={() => setTheme("pwsh")}
              className={`px-2 py-1 rounded transition ${theme === "pwsh" ? "bg-blue-900 text-white font-medium" : "text-slate-400 hover:text-slate-200"}`}
            >
              Powershell
            </button>
            <button
              onClick={() => setTheme("matrix")}
              className={`px-2 py-1 rounded transition ${theme === "matrix" ? "bg-emerald-950 text-emerald-400 font-medium font-semibold" : "text-slate-400 hover:text-slate-200"}`}
            >
              Matrix
            </button>
          </div>

          {/* Toggle CRT simulation bloom effect */}
          <button
            onClick={() => setCrtEffect(!crtEffect)}
            className={`px-2 py-1.5 text-xs rounded border transition flex items-center gap-1 ${crtEffect ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-400" : "bg-transparent border-slate-700/50 text-slate-400"}`}
            title="Toggle Vintage CRT monitor scan line filter"
          >
            <SlidersHorizontal size={12} />
            CRT Filter
          </button>
        </div>
      </header>

      {/* Main Full Stack Core Board Deck */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 lg:p-6 select-text">
        <AnimatePresence mode="wait">
          {workspaceView === "cli" ? (
            <motion.div
              key="cli-workspace"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              {/* LEFT COLUMN: Highly Polished CMD Interactive Emulator (Grid 7 cols) */}
              <section className="lg:col-span-12 xl:col-span-7 flex flex-col h-full self-stretch min-h-[500px] xl:min-h-0">
                
                <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-900/90 border border-slate-700/80 border-b-0 rounded-t-lg select-none">
                  <div className="flex items-center gap-1.5 font-mono text-slate-300">
                    <TerminalIcon size={13} className="text-slate-400" />
                    <span>Windows Terminal Console [Secure Shell Command Prompt]</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
                    <span className="w-2 h-2 rounded-full bg-yellow-500/80"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500/80"></span>
                  </div>
                </div>

                <div
                  id="cmd-terminal-box"
                  onClick={handleTerminalClick}
                  className={`flex-1 min-h-[460px] max-h-[580px] p-4 rounded-b-lg border border-slate-700/80 shadow-2xl overflow-y-auto select-text relative flex flex-col h-full scrollbar-thin ${themeClasses.container} ${crtEffect ? "after:content-[''] after:absolute after:inset-0 after:pointer-events-none after:bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] after:bg-size-4x2 after:opacity-10 crt-glow" : ""}`}
                  style={{
                    boxShadow: "inset 0 0 40px rgba(0, 0, 0, 0.9)"
                  }}
                >
                  {/* Scroll view space */}
                  <div className="flex-1 space-y-2 text-xs select-text">
                    {lines.map((ln) => {
                      let colorClass = "";
                      if (ln.type === "input") colorClass = themeClasses.promptColor + " font-bold";
                      else if (ln.type === "error") colorClass = "text-red-400 font-semibold";
                      else if (ln.type === "success") colorClass = "text-emerald-400 font-semibold";
                      else if (ln.type === "system") colorClass = "text-[#888888] italic";

                      return (
                        <div key={ln.id} className="whitespace-pre-wrap select-text leading-relaxed">
                          {ln.type === "input" ? (
                            <span className="select-none text-slate-400 mr-2">C:\Users\Anonymous_Surfer&gt; </span>
                          ) : null}
                          <span className={colorClass}>{ln.text}</span>
                        </div>
                      );
                    })}

                    {/* Server loading pulse animation indicator */}
                    {backendLoading && (
                      <div className="flex items-center gap-2 text-[#94a3b8] py-2 italic font-mono animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        [PROXY] Traversing encrypted Tor relays exit points... Hold connection keys secure.
                      </div>
                    )}

                    <div ref={terminalEndRef} />
                  </div>

                  {/* Input Prompt row */}
                  <div className="flex items-center gap-1.5 mt-4 pt-2 border-t border-slate-800/60 select-none">
                    <span className={`text-[12px] font-bold shrink-0 ${theme === "matrix" ? "text-[#22c55e]" : "text-slate-400"}`}>
                      C:\Users\Anonymous_Surfer&gt;
                    </span>
                    <input
                      ref={inputRef}
                      type="text"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={backendLoading}
                      className={`flex-1 bg-transparent border-none outline-none focus:ring-0 text-[12px] p-0 font-mono ${themeClasses.inputColor}`}
                      autoFocus
                      placeholder="Type 'help' or browse a site..."
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </div>
                </div>

                {/* Quick-Click Command Helpers (Web-Usability enhancements) */}
                <div className="mt-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col gap-1.5 select-none animate-pulse">
                  <span className="text-[11px] font-semibold text-slate-400 font-mono flex items-center gap-1">
                    <Sliders size={12} />
                    QUICK COMMANDS (CLICK TO AUTO-FILL PROMPT):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCommandShortcut("help")}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-700/50 px-2 py-0.5 rounded text-cyan-400 font-mono"
                    >
                      help
                    </button>
                    <button
                      onClick={() => handleCommandShortcut("status")}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-700/50 px-2 py-0.5 rounded text-cyan-400 font-mono"
                    >
                      status
                    </button>
                    <button
                      onClick={() => handleCommandShortcut("circuit")}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-700/50 px-2 py-0.5 rounded text-cyan-400 font-mono"
                    >
                      circuit
                    </button>
                    <button
                      onClick={() => handleCommandShortcut("new-circuit")}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-700/50 px-2 py-0.5 rounded text-[#22c55e] font-mono"
                    >
                      new-circuit
                    </button>
                    <button
                      onClick={() => handleCommandShortcut("tor-browse https://api.ipify.org")}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-700/50 px-2 py-0.5 rounded text-amber-500 font-mono"
                    >
                      tor-browse [ipify]
                    </button>
                    <button
                      onClick={() => handleCommandShortcut("tor-browse example.com")}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-700/50 px-2 py-0.5 rounded text-amber-500 font-mono"
                    >
                      tor-browse [example]
                    </button>
                    <button
                      onClick={() => handleCommandShortcut("onion-search")}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-700/50 px-2 py-0.5 rounded text-indigo-400 font-mono"
                    >
                      onion-search
                    </button>
                    <button
                      onClick={() => handleCommandShortcut("socks5-config")}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-700/50 px-2 py-0.5 rounded text-purple-400 font-mono"
                    >
                      socks5-config
                    </button>
                    <button
                      onClick={() => handleCommandShortcut("ip")}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-700/50 px-2 py-0.5 rounded text-blue-400 font-mono"
                    >
                      ip check
                    </button>
                  </div>
                </div>
              </section>

              {/* RIGHT COLUMN: Interactive Status HUD & Modules Deck (Grid 5 cols) */}
              <section className="lg:col-span-12 xl:col-span-5 space-y-6">
                
                {/* Active Relays Speed HUD Overlay */}
                {circuit && (
                  <div id="tor-system-hud-deck" className="bg-[#0c1220]/90 border border-slate-800 rounded-lg p-4 font-mono shadow-md select-none animate-pulse">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                      <span className="text-white text-xs font-bold flex items-center gap-1.5">
                        <Database size={14} className="text-emerald-400" />
                        TOR RUNTIME CONSOLE DECK
                      </span>
                      <span className="text-[10px] text-slate-400">STATUS: PROXIED</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-2.5 bg-[#080d1a] border border-slate-800 rounded flex flex-col justify-between">
                        <span className="text-[9px] text-slate-500 font-medium uppercase">Active Hops</span>
                        <span className="text-sm font-bold text-white mt-1">3 Hops (AES-256)</span>
                      </div>
                      <div className="p-2.5 bg-[#080d1a] border border-slate-800 rounded flex flex-col justify-between">
                        <span className="text-[9px] text-slate-500 font-medium uppercase">Bandwidth Pipe</span>
                        <span className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1 text-[13px]">
                          <Wifi size={13} /> {circuit.exit.bandwidth}
                        </span>
                      </div>
                    </div>

                    {/* Quick Tab Selector for Auxiliary Views */}
                    <div className="flex bg-[#070b14] rounded-lg p-1 border border-slate-800 text-xs">
                      <button
                        onClick={() => setActivePanel("map")}
                        className={`flex-1 py-1 px-2.5 rounded transition font-bold flex items-center justify-center gap-1.5 ${activePanel === "map" ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" : "text-slate-400 hover:text-slate-200"}`}
                      >
                        <Globe size={12} />
                        Circuit Map
                      </button>
                      <button
                        onClick={() => setActivePanel("directory")}
                        className={`flex-1 py-1 px-2.5 rounded transition font-bold flex items-center justify-center gap-1.5 ${activePanel === "directory" ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-400" : "text-slate-400 hover:text-slate-200"}`}
                      >
                        <Compass size={12} />
                        Onion Catalog
                      </button>
                      <button
                        onClick={() => setActivePanel("socks")}
                        className={`flex-1 py-1 px-2.5 rounded transition font-bold flex items-center justify-center gap-1.5 ${activePanel === "socks" ? "bg-purple-500/20 border border-purple-500/30 text-purple-400" : "text-slate-400 hover:text-slate-200"}`}
                      >
                        <Info size={12} />
                        Socks Config
                      </button>
                    </div>
                  </div>
                )}

                {/* Render Active Panels dynamically with exit effects */}
                <div className="relative">
                  <AnimatePresence mode="wait">
                    {activePanel === "map" && circuit && (
                      <motion.div
                        key="map-panel"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CircuitMap
                          entry={circuit.entry}
                          middle={circuit.middle}
                          exit={circuit.exit}
                          targetHost={lastBrosedUrl}
                        />
                      </motion.div>
                    )}

                    {activePanel === "socks" && (
                      <motion.div
                        key="socks-panel"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                      >
                        <SocksConfigurator />
                      </motion.div>
                    )}

                    {activePanel === "directory" && (
                      <motion.div
                        key="directory-panel"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                        className="bg-[#0a0f1d] border border-indigo-500/30 rounded-lg p-4 flex flex-col font-mono animate-pulse"
                      >
                        <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2 mb-3">
                          <span className="text-indigo-400 text-xs font-bold font-mono flex items-center gap-1">
                            <Lock size={13} />
                            ONION ROADS CATALOG (SAFE DEEP INDEX)
                          </span>
                          <span className="text-[10px] text-slate-500">v1.2 index</span>
                        </div>

                        <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                          A directory of verified, secure, and clean Tor Onion services. Clicking on any of the links below automatically runs the CMD <code className="bg-slate-800 text-slate-200 px-1 rounded font-mono">tor-browse</code> proxy commands!
                        </p>

                        <div className="space-y-2.5 max-h-[350px] overflow-y-auto scrollbar-thin pr-1">
                          {ONION_DIRECTORY.map((site: OnionSite) => (
                            <div
                              key={site.onion}
                              onClick={() => triggerDirectBrowse(site.onion)}
                              className="group border border-slate-800 hover:border-indigo-500/30 bg-[#080d19] p-2.5 rounded cursor-pointer transition flex items-center justify-between"
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[12px] font-bold text-pink-500 group-hover:text-indigo-400 transition flex items-center gap-1 justify-start">
                                  {site.title}
                                  <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition" />
                                </span>
                                <span className="text-[10px] text-slate-500 select-all truncate max-w-[280px]">
                                  http://{site.onion}
                                </span>
                                <span className="text-[10px] text-slate-400 leading-snug mt-1">
                                  {site.description}
                                </span>
                              </div>
                              <div className="flex flex-col items-end shrink-0 gap-1.5 pl-2">
                                <span className="text-[8px] bg-slate-950 text-indigo-400 px-1.5 py-0.5 border border-indigo-500/15 rounded">
                                  {site.category}
                                </span>
                                <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  ONLINE
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Quick Info Terminal Alert Banner */}
                <div className="p-3.5 bg-yellow-950/20 border border-yellow-500/20 rounded-lg flex gap-3 text-xs select-none">
                  <ShieldAlert size={20} className="text-yellow-500 shrink-0" />
                  <div className="flex flex-col gap-1 leading-relaxed text-slate-300">
                    <span className="font-bold text-yellow-500 uppercase text-[10.5px]">Anonymity Workspace Advisory:</span>
                    <span>
                      Always double-check website certificate fingerprints when surfing non-encrypted channels. SOCKS tunnels encrypt packet handshakes, but the clear web exits themselves do not shield target sites from cookie tracking parameters. Use "Reset" to change routing coordinates often.
                    </span>
                  </div>
                </div>

              </section>
            </motion.div>
          ) : (
            <motion.div
              key="gui-workspace"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* TOP INSTANCE: Full Secure Tabbed Chrome Browser Decryptor */}
              <TorGuiBrowser
                circuit={circuit}
                backendLoading={backendLoading}
                onBrowse={handleBrowse}
                lastBrowsedUrl={lastBrosedUrl}
                onionDirectory={ONION_DIRECTORY}
              />

              {/* BOTTOM COLUMNS: Controls and Live Graphs monitoring */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Visual circuit nodes interactive swapping portal representation */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                  <TorCircuitController
                    circuit={circuit}
                    onUpdateCircuitNode={handleUpdateCircuitNode}
                    onTriggerLog={(type, txt) => addTerminalLine(type, txt)}
                  />

                  {/* High Anonymity Advisory warning bar */}
                  <div className="p-4 bg-cyan-950/25 border border-cyan-500/35 rounded-xl flex gap-3.5 text-xs select-none font-mono">
                    <Shield size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1 leading-relaxed text-cyan-100">
                      <span className="font-bold text-cyan-400 uppercase text-[11px] tracking-wider">Secure Sandbox Shield Enforced:</span>
                      <span>
                        Transgression parameters are dynamically restricted. High-level cryptographic multi-hops are verified instantly to preserve safety credentials. Change custom hops using physical node controllers above at any instant.
                      </span>
                    </div>
                  </div>
                </div>

                {/* SOCKS5 Telemetry metrics logs + tracer routing flat-vector maps */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                  <TorProxyTelemetry
                    backendLoading={backendLoading}
                    socksPort={circuit?.socksPort || 9050}
                  />

                  {circuit && (
                    <CircuitMap
                      entry={circuit.entry}
                      middle={circuit.middle}
                      exit={circuit.exit}
                      targetHost={lastBrosedUrl}
                    />
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Retro scan line overlay styling */}
      <style>{`
        .crt-glow {
          text-shadow: 0 0 1px rgba(16, 185, 129, 0.4);
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #020804;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 2px;
        }
      `}</style>

    </div>
  );
}
