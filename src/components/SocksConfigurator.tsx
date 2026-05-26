import React, { useState } from "react";
import { WINDOWS_CMD_CONFIGURATIONS } from "../data/torData";
import { Copy, Check, FileCode, Terminal, HelpCircle, Download } from "lucide-react";

export default function SocksConfigurator() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Helper to trigger automated text-file downloads
  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="socks-configurator-container" className="w-full bg-[#0a0f1d] border border-cyan-500/30 rounded-lg p-4 flex flex-col mt-4 font-mono select-none">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyan-500/10">
        <span className="text-cyan-400 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
          <Terminal size={14} />
          WINDOWS CMD TOR PROXY BUILDER & RUNTIME FILES
        </span>
        <span className="text-xs bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/50">SOCKS5: 9050</span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed mb-4">
        You can build and deploy a real Tor Proxy Daemon locally on your real Windows machine using the Command Prompt. Follow the instructions and copy or download the files below into <code className="bg-slate-800 text-slate-200 px-1 rounded font-bold">C:\Tor</code>.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bat Startup file */}
        <div className="flex flex-col border border-cyan-500/15 rounded bg-[#070b13] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-cyan-950/40 border-b border-cyan-500/10">
            <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
              <FileCode size={12} />
              tor_startup.bat (Batch Launcher)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleDownload(WINDOWS_CMD_CONFIGURATIONS.batScript, "tor_startup.bat")}
                className="p-1 hover:bg-cyan-900/40 rounded text-cyan-400 transition"
                title="Download .bat file"
              >
                <Download size={12} />
              </button>
              <button
                onClick={() => handleCopy(WINDOWS_CMD_CONFIGURATIONS.batScript, "bat")}
                className="p-1 hover:bg-cyan-900/40 rounded text-cyan-400 transition"
              >
                {copiedKey === "bat" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
          <pre className="p-3 text-[10px] text-slate-300 overflow-x-auto select-text leading-tight max-h-[160px] bg-slate-950/30 font-mono">
            {WINDOWS_CMD_CONFIGURATIONS.batScript}
          </pre>
        </div>

        {/* torrc config file */}
        <div className="flex flex-col border border-cyan-500/15 rounded bg-[#070b13] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-cyan-950/40 border-b border-cyan-500/10">
            <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
              <FileCode size={12} />
              torrc (Configuration File)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleDownload(WINDOWS_CMD_CONFIGURATIONS.torrcConfig, "torrc")}
                className="p-1 hover:bg-cyan-900/40 rounded text-cyan-400 transition"
                title="Download torrc file"
              >
                <Download size={12} />
              </button>
              <button
                onClick={() => handleCopy(WINDOWS_CMD_CONFIGURATIONS.torrcConfig, "torrc")}
                className="p-1 hover:bg-cyan-900/40 rounded text-cyan-400 transition"
              >
                {copiedKey === "torrc" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
          <pre className="p-3 text-[10px] text-slate-300 overflow-x-auto select-text leading-tight max-h-[160px] bg-slate-950/30 font-mono">
            {WINDOWS_CMD_CONFIGURATIONS.torrcConfig}
          </pre>
        </div>
      </div>

      {/* Guide/cURL check help box */}
      <div className="mt-4 p-3 bg-cyan-950/20 border border-cyan-500/10 rounded flex flex-col">
        <span className="text-[11px] text-cyan-300 font-bold flex items-center gap-1.5 mb-1.5">
          <HelpCircle size={12} />
          HOW TO ROUTE CLK & WINDOWS COMMAND PACKETS OVER THE SOCKS5 PORT
        </span>
        <pre className="text-[9.5px] text-slate-300 leading-relaxed font-mono whitespace-pre-wrap select-text bg-[#070b13] p-2.5 rounded border border-cyan-500/5">
          {WINDOWS_CMD_CONFIGURATIONS.curlReadme}
        </pre>
      </div>
    </div>
  );
}
