import React, { useMemo } from "react";
import { TorNode } from "../data/torData";

interface CircuitMapProps {
  entry: TorNode;
  middle: TorNode;
  exit: TorNode;
  targetHost?: string;
}

// Global coordinates lookup for plotting of country codes (on a 1000x500 flat SVG world map)
const COUNTRY_COORDS: Record<string, { x: number; y: number }> = {
  US: { x: 240, y: 180 }, // Centered USA
  CA: { x: 220, y: 130 }, // Canada
  DE: { x: 505, y: 155 }, // Germany
  NL: { x: 495, y: 150 }, // Netherlands
  CH: { x: 502, y: 165 }, // Switzerland
  FI: { x: 545, y: 115 }, // Finland
  CZ: { x: 515, y: 160 }, // Czech
  FR: { x: 490, y: 170 }, // France
  GB: { x: 475, y: 150 }, // United Kingdom
  PL: { x: 525, y: 155 }, // Poland
  AT: { x: 512, y: 168 }, // Austria
  BE: { x: 493, y: 158 }, // Belgium
  JP: { x: 840, y: 220 }, // Japan
  SE: { x: 520, y: 125 }, // Sweden
  RO: { x: 540, y: 175 }, // Romania
  IS: { x: 420, y: 110 }, // Iceland
  LOCAL: { x: 100, y: 245 } // Simulated client origin (Pacific / West US or customizable)
};

export default function CircuitMap({ entry, middle, exit, targetHost }: CircuitMapProps) {
  const points = useMemo(() => {
    const pts = [
      { id: "local", name: "Your Client", ...COUNTRY_COORDS.LOCAL, flag: "💻" },
      { id: "entry", name: `Entry [${entry.countryCode}]`, ...(COUNTRY_COORDS[entry.countryCode] || { x: 500, y: 150 }), flag: entry.flag },
      { id: "middle", name: `Middle [${middle.countryCode}]`, ...(COUNTRY_COORDS[middle.countryCode] || { x: 510, y: 160 }), flag: middle.flag },
      { id: "exit", name: `Exit [${exit.countryCode}]`, ...(COUNTRY_COORDS[exit.countryCode] || { x: 520, y: 170 }), flag: exit.flag }
    ];

    if (targetHost) {
      // Pick a semi-random destination based on hostname letters
      const charSum = targetHost.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const hostDestinations = [
        { name: targetHost, x: 280, y: 190, flag: "🌐" }, // US East
        { name: targetHost, x: 480, y: 145, flag: "🌐" }, // EU Main
        { name: targetHost, x: 790, y: 190, flag: "🌐" }  // Asia
      ];
      pts.push({ id: "target", ...hostDestinations[charSum % hostDestinations.length] });
    }

    return pts;
  }, [entry, middle, exit, targetHost]);

  return (
    <div id="tor-circuit-map-container" className="w-full bg-[#0a0f1d] border border-emerald-500/30 rounded-lg p-4 flex flex-col mt-4 font-mono select-none overflow-hidden relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          TOR CIRCUIT PATH TRACER (MULTI-HOP ROUTING MAP)
        </span>
        <span className="text-emerald-500/70 text-[10px]">projection: flat-cylindrical-v2</span>
      </div>

      {/* Map Graphic Area */}
      <div className="w-full h-[220px] bg-[#070b14] rounded border border-emerald-500/10 relative overflow-hidden flex items-center justify-center">
        {/* Simplified Vector Grid Background */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#10b981" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Dynamic Vector Connector Lines */}
        <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 1000 400" preserveAspectRatio="xMinYMin meet">
          <defs>
            {/* Pulsing signal gradients */}
            <linearGradient id="laser-grad-0" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#34d399" stopOpacity="1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
            </linearGradient>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
            </marker>
          </defs>

          {/* Animated Connecting Path Links */}
          {points.map((p, index) => {
            if (index === points.length - 1) return null;
            const nextP = points[index + 1];
            return (
              <g key={`path-${p.id}`}>
                {/* Outer shadow aura line */}
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={nextP.x}
                  y2={nextP.y}
                  stroke="#059669"
                  strokeWidth="3"
                  strokeOpacity="0.3"
                  strokeDasharray="4,4"
                  className="animate-pulse"
                />
                {/* Core animated sweeping tracer */}
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={nextP.x}
                  y2={nextP.y}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="10, 15"
                  style={{
                    animation: "dash 15s linear infinite"
                  }}
                />
              </g>
            );
          })}

          {/* Render Vector City/Country Dots */}
          {points.map((p, index) => {
            const isDestination = p.id === "target";
            const color = p.id === "local" ? "#60a5fa" : isDestination ? "#f59e0b" : "#10b981";
            return (
              <g key={`dot-${p.id}`}>
                {/* Pulsing beacon circles */}
                <circle cx={p.x} cy={p.y} r="8" fill={color} fillOpacity="0.15" />
                <circle cx={p.x} cy={p.y} r="4" fill={color} />
                <circle cx={p.x} cy={p.y} r="8" stroke={color} strokeWidth="1" strokeOpacity="1" className="animate-ping" style={{ animationDuration: `${2 + index}s` }} />
              </g>
            );
          })}
        </svg>

        {/* Labels overlay placed relatively */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
          {points.map((p, index) => {
            const isDestination = p.id === "target";
            const colorClass = p.id === "local" ? "text-blue-400" : isDestination ? "text-amber-400" : "text-emerald-400";
            
            // Scaled style translations
            return (
              <div
                key={`label-${p.id}`}
                className="absolute text-[10px] bg-[#0c1322] border border-slate-700 px-1.5 py-0.5 rounded shadow flex items-center gap-1"
                style={{
                  left: `${(p.x / 1000) * 100}%`,
                  top: `${(p.y / 400) * 100}%`,
                  transform: "translate(-50%, -130%)",
                  whiteSpace: "nowrap"
                }}
              >
                <span>{p.flag}</span>
                <span className={`font-semibold ${colorClass}`}>{p.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center mt-3 pt-2 border-t border-emerald-500/10">
        <div className="flex flex-col border-r border-[#1e293b]/40">
          <span className="text-[9px] text-slate-500">YOUR SYSTEM</span>
          <span className="text-[11px] text-blue-400 font-semibold truncate">USER_WORKSPACE</span>
        </div>
        <div className="flex flex-col border-r border-[#1e293b]/40">
          <span className="text-[9px] text-slate-500">ENTRY GUARD</span>
          <span className="text-[11px] text-emerald-400 font-bold truncate">
            {entry.flag} {entry.ip}
          </span>
        </div>
        <div className="flex flex-col border-r border-[#1e293b]/40">
          <span className="text-[9px] text-slate-500">MIDDLE RELAY</span>
          <span className="text-[11px] text-emerald-400 font-bold truncate">
            {middle.flag} {middle.ip}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-500">EXIT NODE (ANONYMOUS PROXY)</span>
          <span className="text-[11px] text-amber-400 font-bold truncate animate-pulse">
            {exit.flag} {exit.ip}
          </span>
        </div>
      </div>

      {/* Styled inline animation for the SVG dash array */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -100;
          }
        }
      `}</style>
    </div>
  );
}
