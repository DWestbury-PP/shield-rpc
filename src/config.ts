export interface RelayConfig {
  name: string;
  url: string;
}

export function getRelayConfigs(): RelayConfig[] {
  const envList = process.env.RELAY_URLS?.split(",").map((s) => s.trim()).filter(Boolean) || [];
  if (envList.length > 0) {
    return envList.map((u, i) => ({ name: `relay_${i+1}`, url: u }));
  }
  // Defaults can be overridden via RELAY_URLS
  return [
    { name: "flashbots_protect", url: "https://rpc.flashbots.net" },
    { name: "mev_blocker", url: "https://rpc.mevblocker.io" }
  ];
}

export const serverPort = Number(process.env.PORT || 8080);
export const serverHost = process.env.HOST || "0.0.0.0";
