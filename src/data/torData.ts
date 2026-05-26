export interface TorNode {
  ip: string;
  country: string;
  countryCode: string;
  flag: string;
  hostname: string;
  port: number;
  bandwidth: string;
  uptime: string;
  ratingCount: number;
}

export interface OnionSite {
  title: string;
  onion: string;
  category: string;
  description: string;
  isOnline: boolean;
}

export const ENTRY_NODES: TorNode[] = [
  { ip: "195.12.92.14", country: "Germany", countryCode: "DE", flag: "🇩🇪", hostname: "tor-guard1.m-online.net", port: 9001, bandwidth: "45 MB/s", uptime: "98 days", ratingCount: 4.9 },
  { ip: "85.214.13.221", country: "Germany", countryCode: "DE", flag: "🇩🇪", hostname: "node.tor-exit.de", port: 443, bandwidth: "38 MB/s", uptime: "14 days", ratingCount: 4.7 },
  { ip: "109.201.154.129", country: "Netherlands", countryCode: "NL", flag: "🇳🇱", hostname: "nl-guard.leaseweb.com", port: 9001, bandwidth: "52 MB/s", uptime: "123 days", ratingCount: 4.8 },
  { ip: "77.109.139.141", country: "Switzerland", countryCode: "CH", flag: "🇨🇭", hostname: "tor.init7.net", port: 9001, bandwidth: "40 MB/s", uptime: "42 days", ratingCount: 4.8 },
  { ip: "138.201.201.32", country: "Finland", countryCode: "FI", flag: "🇫🇮", hostname: "fi-tor-node.hetzner.com", port: 9001, bandwidth: "48 MB/s", uptime: "19 days", ratingCount: 4.5 },
  { ip: "185.220.101.5", country: "Czech Republic", countryCode: "CZ", flag: "🇨🇿", hostname: "cz-guard.datacamp.co", port: 443, bandwidth: "35 MB/s", uptime: "67 days", ratingCount: 4.6 },
  { ip: "46.165.221.33", country: "Germany", countryCode: "DE", flag: "🇩🇪", hostname: "tor-relay.keyweb.de", port: 9001, bandwidth: "30 MB/s", uptime: "205 days", ratingCount: 4.8 },
  { ip: "94.23.150.11", country: "France", countryCode: "FR", flag: "🇫🇷", hostname: "fr-ovh-guard.net", port: 9001, bandwidth: "55 MB/s", uptime: "12 days", ratingCount: 4.4 }
];

export const MIDDLE_NODES: TorNode[] = [
  { ip: "82.165.177.30", country: "France", countryCode: "FR", flag: "🇫🇷", hostname: "tor-middle1.1and1-dns.fr", port: 9001, bandwidth: "28 MB/s", uptime: "34 days", ratingCount: 4.5 },
  { ip: "213.136.81.99", country: "United Kingdom", countryCode: "GB", flag: "🇬🇧", hostname: "uk.tor-router.net", port: 9001, bandwidth: "32 MB/s", uptime: "8 days", ratingCount: 4.3 },
  { ip: "91.219.236.195", country: "Poland", countryCode: "PL", flag: "🇵🇱", hostname: "pl-tor.atm-rel.pl", port: 443, bandwidth: "22 MB/s", uptime: "55 days", ratingCount: 4.4 },
  { ip: "192.99.142.2", country: "Canada", countryCode: "CA", flag: "🇨🇦", hostname: "ca-relay.tor.net", port: 9001, bandwidth: "39 MB/s", uptime: "110 days", ratingCount: 4.7 },
  { ip: "185.112.144.11", country: "Austria", countryCode: "AT", flag: "🇦🇹", hostname: "vienna-relay.at", port: 9001, bandwidth: "25 MB/s", uptime: "29 days", ratingCount: 4.5 },
  { ip: "51.15.111.45", country: "Belgium", countryCode: "BE", flag: "🇧🇪", hostname: "scaleway-tor-middle.be", port: 9001, bandwidth: "34 MB/s", uptime: "81 days", ratingCount: 4.6 },
  { ip: "178.62.193.120", country: "United Kingdom", countryCode: "GB", flag: "🇬🇧", hostname: "tor.digitalocean.uk", port: 9001, bandwidth: "42 MB/s", uptime: "90 days", ratingCount: 4.8 },
  { ip: "103.236.201.21", country: "Japan", countryCode: "JP", flag: "🇯🇵", hostname: "jp-tokyo-tor.net", port: 9001, bandwidth: "29 MB/s", uptime: "15 days", ratingCount: 4.5 }
];

export const EXIT_NODES: TorNode[] = [
  { ip: "104.244.72.61", country: "United States", countryCode: "US", flag: "🇺🇸", hostname: "tor-exit-us.isprime.com", port: 80, bandwidth: "31 MB/s", uptime: "5 days", ratingCount: 4.9 },
  { ip: "185.220.101.45", country: "Germany", countryCode: "DE", flag: "🇩🇪", hostname: "tor-exit-45.datacamp.co", port: 443, bandwidth: "60 MB/s", uptime: "3 days", ratingCount: 4.8 },
  { ip: "199.249.230.125", country: "United States", countryCode: "US", flag: "🇺🇸", hostname: "tor-exit.emerald-onion.net", port: 9001, bandwidth: "35 MB/s", uptime: "21 days", ratingCount: 4.7 },
  { ip: "89.234.157.14", country: "Sweden", countryCode: "SE", flag: "🇸🇪", hostname: "se-exit.mullvad.net", port: 443, bandwidth: "48 MB/s", uptime: "9 days", ratingCount: 4.8 },
  { ip: "185.220.101.22", country: "Canada", countryCode: "CA", flag: "🇨🇦", hostname: "tor-exit-ca.datacamp.co", port: 80, bandwidth: "40 MB/s", uptime: "12 days", ratingCount: 4.6 },
  { ip: "162.247.74.201", country: "United States", countryCode: "US", flag: "🇺🇸", hostname: "tor-exit.calyxinstitute.org", port: 443, bandwidth: "55 MB/s", uptime: "33 days", ratingCount: 4.9 },
  { ip: "109.163.234.6", country: "Romania", countryCode: "RO", flag: "🇷🇴", hostname: "ro-exit-tor.ro", port: 9001, bandwidth: "26 MB/s", uptime: "8 days", ratingCount: 4.4 },
  { ip: "45.153.160.134", country: "Iceland", countryCode: "IS", flag: "🇮🇸", hostname: "is-exit-node.is", port: 443, bandwidth: "37 MB/s", uptime: "18 days", ratingCount: 4.7 }
];

export const ONION_DIRECTORY: OnionSite[] = [
  {
    title: "Tor Project Main Website",
    onion: "torprojectorg7ezpftqreby2666y36t777e4qqfeyrks266d624eyfks.onion",
    category: "Official",
    description: "Anonymity Online. Official home of the Tor Project, download Tor Browser, docs, source code.",
    isOnline: true
  },
  {
    title: "ProtonMail Secure",
    onion: "protonmailrmez3jia7ipme26n4pt67etf6uq7m7pp26wq7m7ep6q7m7dq.onion",
    category: "Mail & Utilities",
    description: "Encrypted email service based in Switzerland. Fully anonymous registration and zero-access security standards.",
    isOnline: true
  },
  {
    title: "DuckDuckGo Tor Search Engine",
    onion: "duckduckgogg42xjoc72x3s21a22mdf2a263xs411as3s41a3s213assd.onion",
    category: "Search Engine",
    description: "The search engine that doesn't track you. Search the clear web privately via the official Tor onion service.",
    isOnline: true
  },
  {
    title: "The New York Times",
    onion: "nytimes3xbfgjeat7re36t777e4qqfeyrks266d624eyfks266d624eyfks.onion",
    category: "Media",
    description: "Read the Times anonymously from anywhere in the world. Unfiltered coverage accessible even through geo-censorship.",
    isOnline: true
  },
  {
    title: "Ahmia Onion Search Engine",
    onion: "juhanurmih4dfuhvqyvqyvqyvqyvqyvqyvqyvqyvqyvqyvqyvqyvqyvqd.onion",
    category: "Search Engine",
    description: "A secure and open search engine for Tor Hidden Services. Filters abuse and indexes standard dark web pages.",
    isOnline: true
  },
  {
    title: "Tor Taxi Directory",
    onion: "tortaxix3s21a22mdf2a263xs411as3s41a3s213assdqreby2666y36t77.onion",
    category: "Directory",
    description: "A popular directory listing verified, clean onion services, tools, exchanges, and security outlets.",
    isOnline: true
  },
  {
    title: "Imperial Library of Trantor",
    onion: "trantorlib7ezpftqreby2666y36t777e4qqfeyrks266d624eyfks266d.onion",
    category: "Library",
    description: "A collaborative, volunteer-supported open-library archive of digital books for researchers and historians.",
    isOnline: true
  },
  {
    title: "Tor Metrics",
    onion: "metrics266d624eyfks266d624eyfks266d624eyfks2torprojectorg.onion",
    category: "Official",
    description: "Provides quantitative metrics about the Tor network, directory graphs, user demographics, and relay capacities.",
    isOnline: true
  },
  {
    title: "SecureDrop Foundation",
    onion: "securedrop7ezpftqreby2666y36t777e4qqfeyrks266d624eyfks266.onion",
    category: "Whistleblowing",
    description: "Anonymous document submission system for news organizations, journalists, and secure whistleblowers.",
    isOnline: true
  },
  {
    title: "Keybase Secure Directories",
    onion: "keybase3xbfgjeat7re36t777e4qqfeyrks266d624eyfks266d624eyf.onion",
    category: "Mail & Utilities",
    description: "Official onion address for Keybase lookup, PGPs validation, identity checks, and encrypted key storage files.",
    isOnline: true
  }
];

export const WINDOWS_CMD_CONFIGURATIONS = {
  batScript: `@echo off
title [%TIME%] Windows Local Tor Proxy Daemon
echo ==========================================================
echo [@] INITIATING WINDOWS TOR ANONYMOUS SOCKS5 PROXY DAEMON
echo ==========================================================
echo [ * ] Checking directories...
if not exist "C:\\Tor" (
    echo [ERROR] C:\\Tor folder not found. Please install the Tor archive first.
    echo [INFO] Download Tor expert bundle from: https://www.torproject.org/download/tor/
    pause
    exit
)
echo [ OK ] Location C:\\Tor verified.
echo [ * ] Launching Tor relay daemon pointing to "torrc" config...
echo [INFO] Press Ctrl+C to stop the anonymizing service anytime.
echo ----------------------------------------------------------
cd "C:\\Tor"
tor.exe -f torrc
pause`,

  torrcConfig: `# ==========================================================
# CUSTOM TOR CONFIGURATION FILE (torrc) FOR CMD SOCKS5 PROXY
# ==========================================================

# Port to listen on for local SOCKS proxy connections
SocksPort 9050

# Bind proxy only to localhost for security
SocksListenAddress 127.0.0.1

# Enable caching of DNS lookups locally
DNSPort 5353
AutomapHostsOnResolve 1

# Performance and Circuit Settings
MaxCircuitDirtiness 600
NewCircuitPeriod 300

# Geo-Routing: Uncomment lines below to restrict endpoints (e.g. exit nodes to Germany/Switzerland)
# ExitNodes {de},{ch},{nl}
# StrictNodes 1

# Save log trace to local running CMD
Log notice stdout
DataDirectory C:\\Tor\\Data`,

  curlReadme: `HOW TO RUN ANONYMOUS WEB REQUESTS VIA CURRENT CMD RUNTIME:

Once Tor-Socks5 is active (running 'tor_startup.bat' at C:\\Tor):
Open a new Windows Command Prompt window and execute:

> curl --socks5-hostname 127.0.0.1:9050 https://api.ipify.org

Tor will route the cURL call. The IP returned will be your Exit Node IP!

To route your browser:
Configure Firefox / Chrome to use SOCKS v5 Proxy:
- Host: 127.0.0.1
- Port: 9050
- Enable "Proxy DNS when using SOCKS v5" to prevent DNS leaks.`
};
