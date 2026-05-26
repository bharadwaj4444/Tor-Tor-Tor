import express from "express";
import path from "path";
import dns from "dns";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { ENTRY_NODES, MIDDLE_NODES, EXIT_NODES, ONION_DIRECTORY, TorNode, OnionSite } from "./src/data/torData.js";

// Lazy-initialized Gemini API client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key !== "") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// State definitions
let activeCircuit = {
  entry: ENTRY_NODES[0],
  middle: MIDDLE_NODES[0],
  exit: EXIT_NODES[0],
  establishedAt: new Date().toISOString(),
  totalRequests: 0,
  torVersion: "0.4.8.12",
  socksPort: 9050,
  httpTunnelPort: 8118,
  ipHeaderConfig: "90.0.2.1",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; rv:128.0) Gecko/20100101 Firefox/128.0"
};

// Generate fresh anonymous tor proxies circuit path
function rollNewCircuit() {
  const entryIdx = Math.floor(Math.random() * ENTRY_NODES.length);
  const middleIdx = Math.floor(Math.random() * MIDDLE_NODES.length);
  const exitIdx = Math.floor(Math.random() * EXIT_NODES.length);

  activeCircuit.entry = ENTRY_NODES[entryIdx];
  activeCircuit.middle = MIDDLE_NODES[middleIdx];
  activeCircuit.exit = EXIT_NODES[exitIdx];
  activeCircuit.establishedAt = new Date().toISOString();
  activeCircuit.totalRequests = 0;
  
  // Update simulated headers/info
  activeCircuit.ipHeaderConfig = activeCircuit.exit.ip;
  return activeCircuit;
}

// Ensure first circuit is randomized
rollNewCircuit();

// APIs: Route circuit status
app.get("/api/circuit/status", (req, res) => {
  res.json({
    status: "OK",
    circuit: activeCircuit,
    geminiActive: !!process.env.GEMINI_API_KEY
  });
});

// APIs: Generate a new Tor proxy circuit
app.post("/api/circuit/new", (req, res) => {
  const oldCircuit = { ...activeCircuit };
  const newCircuit = rollNewCircuit();
  
  const stepLogs = [
    `[ * ] Disconnecting active circuit: ${oldCircuit.entry.flag} Guard -> ${oldCircuit.exit.flag} Exit`,
    `[ * ] Revoking 2048-bit Diffie-Hellman session keys...`,
    `[ OK ] Connection terminated safely.`,
    `[ * ] Selecting fresh node entries from official Directory Authorities...`,
    `[ OK ] Guard established: ${newCircuit.entry.ip} (${newCircuit.entry.country}) via port ${newCircuit.entry.port}`,
    `[ OK ] Middle relay linked: ${newCircuit.middle.ip} (${newCircuit.middle.country})`,
    `[ OK ] Exit node active: ${newCircuit.exit.ip} (${newCircuit.exit.country}) rating: ${newCircuit.exit.ratingCount}/5.0`,
    `[ * ] Initializing onion routing protocol tunnels...`,
    `[ SUCCESS ] Secured circuit negotiation complete. Active SOCKS5 endpoint bound at 127.0.0.1:${newCircuit.socksPort}`
  ];

  res.json({
    status: "SUCCESS",
    circuit: newCircuit,
    logs: stepLogs
  });
});

// APIs: Search onion resources from deep web
app.post("/api/onion-search", (req, res) => {
  const { query } = req.body;
  const normalizedQuery = (query || "").toLowerCase().trim();

  if (!normalizedQuery) {
    return res.json({ results: ONION_DIRECTORY });
  }

  const results = ONION_DIRECTORY.filter(site => {
    return (
      site.title.toLowerCase().includes(normalizedQuery) ||
      site.onion.toLowerCase().includes(normalizedQuery) ||
      site.category.toLowerCase().includes(normalizedQuery) ||
      site.description.toLowerCase().includes(normalizedQuery)
    );
  });

  res.json({ results });
});

// APIs: Simulate Ping over route nodes
app.post("/api/ping", (req, res) => {
  const { target } = req.body;
  const host = target ? target.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0] : "google.com";

  // Build simulated hops
  const baseLatencyEntry = Math.floor(Math.random() * 45) + 30; // 30-75ms
  const baseLatencyMiddle = baseLatencyEntry + Math.floor(Math.random() * 60) + 40; // Entry + 40-100ms
  const baseLatencyExit = baseLatencyMiddle + Math.floor(Math.random() * 120) + 80; // Middle + 80-200ms
  const destLatency = baseLatencyExit + Math.floor(Math.random() * 50) + 10;

  const hops = [
    { hop: 1, name: "Local Loopback", address: "127.0.0.1", timeMs: 1 },
    { hop: 2, name: `Entry Guard [${activeCircuit.entry.hostname}]`, address: activeCircuit.entry.ip, timeMs: baseLatencyEntry },
    { hop: 3, name: `Middle Relay [${activeCircuit.middle.hostname}]`, address: activeCircuit.middle.ip, timeMs: baseLatencyMiddle },
    { hop: 4, name: `Exit Proxy [${activeCircuit.exit.hostname}]`, address: activeCircuit.exit.ip, timeMs: baseLatencyExit },
    { hop: 5, name: host, address: "93.184.215.14", timeMs: destLatency }
  ];

  res.json({
    host,
    hops,
    avgLatencyMs: destLatency
  });
});

// APIs: Simulate/Verify DNS Anonymous query resolution
app.post("/api/dns", (req, res) => {
  const { domain } = req.body;
  if (!domain) {
    return res.status(400).json({ error: "No domain provided" });
  }

  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  
  // Real DNS resolver inside the Node environment if possible, otherwise mock it.
  dns.resolve4(cleanDomain, (err, addresses) => {
    const timeRef = new Date().toISOString();
    
    if (err || !addresses || addresses.length === 0) {
      // Return a simulated anonymous lookup
      const mockIps = [`104.${Math.floor(Math.random() * 100) + 16}.15.${Math.floor(Math.random() * 200) + 10}`];
      return res.json({
        domain: cleanDomain,
        resolved: true,
        addresses: mockIps,
        resolverMode: "Tor Anonymous DNS (Internal Automap)",
        timestamp: timeRef,
        notes: "Real lookup failed; fallback secure routing values projected safely."
      });
    }

    res.json({
      domain: cleanDomain,
      resolved: true,
      addresses,
      resolverMode: "Tor Anonymous DNS (Automap Host on Resolve)",
      timestamp: timeRef,
      notes: "Resolved via secure virtual DNS pool on Exit Node."
    });
  });
});

// Helper for simple layout fallback parser when HTML needs clear text conversion
function simpleHtmlExtractor(html: string): string {
  // Extract clean title
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "Untitled Web Resource";

  // Strip scripts, styles, metadata
  let formatted = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "") // skip navigation blocks for readability
    .replace(/<footer[\s\S]*?<\/footer>/gi, "");

  // Convert elements simple formats
  formatted = formatted
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\r\n# $1\r\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\r\n## $1\r\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\r\n### $1\r\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\r\n$1\r\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\r\n - $1")
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, " [$2]($1) ")
    .replace(/<br\s*\/?>/gi, "\r\n")
    .replace(/<\/?[^>]+>/gi, ""); // strip all lingering tags

  // Clean trailing spaces & double returns
  const parsedText = formatted
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\r\n\s*\r\n/g, "\r\n\r\n")
    .trim();

  const lines = parsedText.split("\n");
  const cleanedLines = lines
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return `=========================================\r
TITLE: ${title}\r
=========================================\r
\r
${cleanedLines.slice(0, 100).join("\r\n")}\r
\r
... [TRUNCATED FOR TERMINAL SCREEN] ...\r
Direct route links identified dynamically:\r
${html.match(/<a[^>]*href=["'](https?:\/\/[^"']+)["']/gi)?.slice(0, 10).map((lnk, idx) => {
  const match = lnk.match(/href=["']([^"']+)["']/i);
  return match ? ` [${idx + 1}] -> ${match[1]}` : "";
}).filter(Boolean).join("\r\n") || "No external links visible."}`;
}

// APIs: Anonymous browse or site fetch
app.post("/api/browse", async (req, res) => {
  activeCircuit.totalRequests += 1;
  const { url, mode = "text" } = req.body;

  if (!url) {
    return res.status(400).json({ error: "No URL provided" });
  }

  const destUrl = url.trim();

  // Handle .onion site fetch requests (simulated content for rich fidelity)
  if (destUrl.toLowerCase().includes(".onion")) {
    const cleanOnion = destUrl.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    const matchingOnion = ONION_DIRECTORY.find(site => site.onion === cleanOnion);

    if (matchingOnion) {
      // Return custom styled deep web rendering matching this onion
      const dateString = new Date().toUTCString();
      const rawFakeHtml = `
========================================================================
ONION DEEP NETWORK NODE: ${matchingOnion.onion}
NODE SECURITY: ECDSA - SECP256K1 TUNNEL | CIRCUIT ACTIVE
STATUS: PROXIED VIA ${activeCircuit.exit.flag} EXIT [${activeCircuit.exit.ip}]
TIMESTAMP: ${dateString}
========================================================================

Welcome to: ${matchingOnion.title}
Category: ${matchingOnion.category}

${matchingOnion.description}

-----------------
[!] DEEP DIRECTORY DISCOVERY:
 - ProtonMail onion path: http://protonmailrmez3jia7ipme26n4pt67etf6uq7m7pp26wq7m7ep6q7m7dq.onion
 - DuckDuckGo Onion link: http://duckduckgogg42xjoc72x3s21a22mdf2a263xs411as3s41a3s213assd.onion
 - SecureDrop submit channel: http://securedrop7ezpftqreby2666y36t777e4qqfeyrks266d624eyfks266.onion
 - Secure Tor Metrics portal: http://metrics266d624eyfks266d624eyfks266d624eyfks2torprojectorg.onion

*** WARN: Be careful when downloading assets or binaries via exits. ***
*** ALWAYS verify PGP keys of target mirrors before flashing keys.     ***
========================================================================
      `;
      return res.json({
        url: destUrl,
        success: true,
        isOnion: true,
        title: matchingOnion.title,
        content: rawFakeHtml,
        sizeBytes: rawFakeHtml.length,
        exitNodeIp: activeCircuit.exit.ip,
        exitCountry: activeCircuit.exit.country,
        headersSent: {
          "User-Agent": activeCircuit.userAgent,
          "X-Forwarded-For": "ANONYMOUS",
          "DNT": "1"
        }
      });
    } else {
      return res.json({
        url: destUrl,
        success: false,
        content: `[ERROR] HTTP 504 Gateway Timeout\r\nOnion service descriptor not found.\r\nMake sure the address is typed correctly and check onion directory (use command: onion-search).`,
        sizeBytes: 0,
        headersSent: {}
      });
    }
  }

  // Handle clear web site fetch
  let targetUrl = destUrl;
  if (!targetUrl.match(/^https?:\/\//i)) {
    targetUrl = "https://" + targetUrl;
  }

  try {
    // Perform simulated proxy request through exit node using random custom agents
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

    const requestHeaders: Record<string, string> = {
      "User-Agent": activeCircuit.userAgent,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "DNT": "1",
      "Sec-GPC": "1",
      "Cache-Control": "no-cache"
    };

    const fetchResponse = await fetch(targetUrl, {
      headers: requestHeaders,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    const textContent = await fetchResponse.text();
    const sizeBytes = textContent.length;

    // Use Gemini AI to format the website cleanly for a glorious command line view!
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const prompt = `You are a text-based terminal browser engine like lynx/links.
Format the following HTML content from URL "${targetUrl}" into a beautifully structured, readable Unicode terminal-screen text view.
Do not use HTML tags in your output. Use ASCII dividing lines, clean text layout, list indicators, and extract key link targets.
Format links in brackets like [example.com] or indices like [1] that make it very authentic.
Keep the layout very retro, readable, and neat with deep mono margins. Ensure it starts with basic metadata about the page site.

HTML CONTENT LENGTH: ${textContent.length} bytes
RAW HTML FIRST 15000 CHARS:
${textContent.substring(0, 15000)}`;

        const geminiRes = await gemini.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are an expert command prompt rendering virtual machine. Your output is printed directly on a Windows Command line terminal screen.",
          }
        });

        const formattedOutput = geminiRes.text;
        if (formattedOutput) {
          return res.json({
            url: targetUrl,
            success: true,
            title: destUrl,
            content: formattedOutput,
            sizeBytes,
            exitNodeIp: activeCircuit.exit.ip,
            exitCountry: activeCircuit.exit.country,
            headersSent: requestHeaders,
            aiPowered: true
          });
        }
      } catch (aiErr) {
        console.warn("Gemini parsing failed, fallback to native parsing:", aiErr);
      }
    }

    // Fallback parser if Gemini is keyless or throttled
    const fallbackText = simpleHtmlExtractor(textContent);
    res.json({
      url: targetUrl,
      success: true,
      title: destUrl,
      content: fallbackText,
      sizeBytes,
      exitNodeIp: activeCircuit.exit.ip,
      exitCountry: activeCircuit.exit.country,
      headersSent: requestHeaders,
      aiPowered: false,
      systemLog: "Gemini formatting offline. Text extracted via fallback native scraper engine."
    });

  } catch (err: any) {
    console.error("Fetch request crashed:", err);
    res.json({
      url: targetUrl,
      success: false,
      content: `[ERROR] Failed to establish secure relay connection to target server.\r\nReason: ${err.message || 'Connection Refused by Guard / Exit Node.'}\r\nThis often happens for site security rules, blocking headless agents, cookies requirements, or sandbox connection timeouts.`,
      sizeBytes: 0,
      headersSent: {}
    });
  }
});


// Configure Vite web service or Production Serving static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYS] Server running on http://localhost:${PORT}`);
  });
}

startServer();
