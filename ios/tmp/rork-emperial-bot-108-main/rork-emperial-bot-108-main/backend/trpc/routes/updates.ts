import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

export interface AppVersionInfo {
  currentVersion: string;
  minimumVersion: string;
  buildNumber: string;
  releaseDate: string;
  changelog: string[];
  forceUpdate: boolean;
  downloadUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

const versionInfo: AppVersionInfo = {
  currentVersion: "1.0.0",
  minimumVersion: "1.0.0",
  buildNumber: "1",
  releaseDate: new Date().toISOString(),
  changelog: [
    "Initial release of Emperial Bot",
    "Real-time market dashboard",
    "Advanced candlestick charts",
    "Professional indicators suite",
    "Smart signal alerts & webhooks",
    "Automated trading & arbitrage bots",
    "Multi-broker integration",
    "Enterprise-grade security",
  ],
  forceUpdate: false,
  downloadUrl: "",
  maintenanceMode: false,
  maintenanceMessage: "",
};

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

export const updatesRouter = createTRPCRouter({
  check: publicProcedure
    .input(
      z.object({
        clientVersion: z.string(),
        clientBuild: z.string().optional(),
        platform: z.enum(["ios", "android", "web"]).optional(),
      })
    )
    .query(({ input }) => {
      const hasUpdate = compareVersions(versionInfo.currentVersion, input.clientVersion) > 0;
      const mustUpdate = compareVersions(versionInfo.minimumVersion, input.clientVersion) > 0;

      console.log(
        "[Updates] Check from client:",
        input.clientVersion,
        "| Latest:",
        versionInfo.currentVersion,
        "| hasUpdate:",
        hasUpdate,
        "| mustUpdate:",
        mustUpdate
      );

      return {
        hasUpdate,
        mustUpdate: mustUpdate || versionInfo.forceUpdate,
        latestVersion: versionInfo.currentVersion,
        minimumVersion: versionInfo.minimumVersion,
        buildNumber: versionInfo.buildNumber,
        releaseDate: versionInfo.releaseDate,
        changelog: versionInfo.changelog,
        downloadUrl: versionInfo.downloadUrl,
        maintenanceMode: versionInfo.maintenanceMode,
        maintenanceMessage: versionInfo.maintenanceMessage,
      };
    }),

  setVersion: publicProcedure
    .input(
      z.object({
        currentVersion: z.string().optional(),
        minimumVersion: z.string().optional(),
        buildNumber: z.string().optional(),
        changelog: z.array(z.string()).optional(),
        forceUpdate: z.boolean().optional(),
        downloadUrl: z.string().optional(),
        maintenanceMode: z.boolean().optional(),
        maintenanceMessage: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      if (input.currentVersion) versionInfo.currentVersion = input.currentVersion;
      if (input.minimumVersion) versionInfo.minimumVersion = input.minimumVersion;
      if (input.buildNumber) versionInfo.buildNumber = input.buildNumber;
      if (input.changelog) versionInfo.changelog = input.changelog;
      if (input.forceUpdate !== undefined) versionInfo.forceUpdate = input.forceUpdate;
      if (input.downloadUrl !== undefined) versionInfo.downloadUrl = input.downloadUrl;
      if (input.maintenanceMode !== undefined) versionInfo.maintenanceMode = input.maintenanceMode;
      if (input.maintenanceMessage !== undefined) versionInfo.maintenanceMessage = input.maintenanceMessage;
      versionInfo.releaseDate = new Date().toISOString();

      console.log("[Updates] Version info updated:", versionInfo.currentVersion, "build", versionInfo.buildNumber);
      return versionInfo;
    }),

  info: publicProcedure.query(() => {
    return versionInfo;
  }),
});
