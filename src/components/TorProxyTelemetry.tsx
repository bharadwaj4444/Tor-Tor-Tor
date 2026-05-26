import React, { useState, useEffect, useMemo } from "react";
import { 
  Activity, 
  ArrowUp, 
  ArrowDown, 
  Wifi, 
  ShieldCheck, 
  Database 
} from "lucide-react";

interface TorProxyTelemetryProps {
  backendLoading: boolean;
  socksPort: number;
}

export default function TorProxyTelemetry({
  backendLoading,
  socksPort
}: TorProxyTelemetryProps) {
  // Store historical traffic rates to render a moving SVG area chart
  const [downloadSpeed, setDownloadSpeed] = useState<number>(34.2);
  const [uploadSpeed, setUploadSpeed] = useState<number>(11.5);
  const [downloadHistory, setDownloadHistory] = useState<number[]>([30, 28, 35, 42, 38, 34, 30, 32, 28, 35]);
  const [uploadHistory, setUploadHistory] = useState<number[]>([10, 12, 9, 14, 11, 15, 12, 11, 13, 10]);
  const [pingMs, setPingMs] = useState<number>(185);

  useEffect(() => {
    const timer = setInterval(() => {
      // Create random variance inside proxy speeds
      const variance = backendLoading ? 1.8 : 0.2;
      const spikeFactor = backendLoading ? 4.5 : 1.0;

      setDownloadSpeed(prev => {
        const next = Math.max(5, Math.min(180, +(prev + (Math.random() - 0.5) * 12 * variance + (backendLoading ? 15 : 0)).toFixed(1)));
        setDownloadHistory(h => [...h.slice(1), next]);
        return next;
      });

      setUploadSpeed(prev => {
        const next = Math.max(1, Math.min(95, +(prev + (Math.random() - 0.5) * 5 * variance + (backendLoading ? 5 : 0)).toFixed(1)));
        setUploadHistory(h => [...h.slice(1), next]);
        return next;
      });

      setPingMs(prev => {
        const delta = Math.floor((Math.random() - 0.5) * 8);
        return Math.max(130, Math.min(320, prev + delta));
      });

    }, 1000);

    return () => clearInterval(timer);
  }, [backendLoading]);

  // Construct lines for download path
  const downloadPath = useMemo(() => {
    const maxVal = 180;
    const width = 280;
    const height = 60;
    const step = width / (downloadHistory.length - 1);
    
    return downloadHistory.map((val, idx) => {
      const x = idx * step;
      const y = height - (val / maxVal) * height;
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  }, [downloadHistory]);

  // Construct lines for upload path
  const uploadPath = useMemo(() => {
    const maxVal = 100;
    const width = 280;
    const height = 60;
    const step = width / (uploadHistory.length - 1);
    
    return uploadHistory.map((val, idx) => {
      const x = idx * step;
      const y = height - (val / maxVal) * height;
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  }, [uploadHistory]);

  return (
    <div id="tor-traffic-telemetry" className="bg-[#0b1020] border border-cyan-500/15 rounded-lg p-3 font-mono text-slate-200 select-none">
      
      {/* Title section */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2.5">
        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
          <Activity size={12} className="text-cyan-400" />
          REALTIME MULTI-RELAY PACKET SOCKS MONITOR
        </span>
        <span className="text-[9px] text-emerald-400 font-bold animate-pulse">SOCKS ACTIVE</span>
      </div>

      {/* Grid containing speedometers */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        
        {/* Downspeed block */}
        <div className="p-2 bg-[#050811] rounded border border-slate-800 flex flex-col justify-between">
          <span className="text-[8px] text-slate-550 flex items-center gap-0.5 text-slate-500 uppercase">
            <ArrowDown size={9} className="text-emerald-400" /> DOWNRATE
          </span>
          <span className="text-[13px] text-white font-bold mt-1 tracking-tight">
            {downloadSpeed} <span className="text-[9px] text-slate-450 font-normal">Kbps</span>
          </span>
        </div>

        {/* Upspeed block */}
        <div className="p-2 bg-[#050811] rounded border border-slate-800 flex flex-col justify-between">
          <span className="text-[8px] text-slate-550 flex items-center gap-0.5 text-slate-500 uppercase">
            <ArrowUp size={9} className="text-blue-400" /> UPRATE
          </span>
          <span className="text-[13px] text-white font-bold mt-1 tracking-tight">
            {uploadSpeed} <span className="text-[9px] text-slate-450 font-normal">Kbps</span>
          </span>
        </div>

        {/* Dynamic Route Latency block */}
        <div className="p-2 bg-[#050811] rounded border border-slate-800 flex flex-col justify-between">
          <span className="text-[8px] text-slate-550 flex items-center gap-0.5 text-slate-500 uppercase">
            <Wifi size={9} className="text-cyan-400" /> ROUTE TIME
          </span>
          <span className="text-[13px] text-cyan-400 font-bold mt-1 tracking-tight">
            {pingMs} <span className="text-[9px] text-slate-450 font-normal">ms</span>
          </span>
        </div>

      </div>

      {/* Speed chart wave SVG */}
      <div className="relative h-[65px] bg-[#040710] rounded border border-slate-850 overflow-hidden px-1 pt-1">
        {/* Render animated download waves */}
        <svg className="w-full h-full opacity-60 flex items-end">
          <path
            d={downloadPath}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d={uploadPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="2,2"
          />
        </svg>

        {/* Interactive indicator label */}
        <div className="absolute top-1.5 right-2 text-[8px] flex items-center gap-2 text-slate-500 bg-[#040710]/80 p-0.5 px-1 rounded">
          <span className="flex items-center gap-0.5"><span className="w-1 h-1 bg-sky-400 rounded-full"></span> Down</span>
          <span className="flex items-center gap-0.5"><span className="w-1 h-1 bg-blue-500 rounded-full"></span> Up</span>
        </div>
      </div>

    </div>
  );
}
