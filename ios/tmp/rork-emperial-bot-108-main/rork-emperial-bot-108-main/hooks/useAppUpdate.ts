import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpcClient } from '@/lib/trpc';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';
const STORAGE_KEY_AUTO_UPDATE = '@emperial_auto_update_enabled';
const STORAGE_KEY_DISMISSED = '@emperial_update_dismissed_version';
const STORAGE_KEY_LAST_CHECK = '@emperial_update_last_check';
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

export interface UpdateInfo {
  hasUpdate: boolean;
  mustUpdate: boolean;
  latestVersion: string;
  minimumVersion: string;
  buildNumber: string;
  releaseDate: string;
  changelog: string[];
  downloadUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export const [AppUpdateProvider, useAppUpdate] = createContextHook(() => {
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(true);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState<boolean>(false);
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [autoUpdate, dismissed] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_AUTO_UPDATE),
          AsyncStorage.getItem(STORAGE_KEY_DISMISSED),
        ]);
        if (autoUpdate !== null) {
          setAutoUpdateEnabled(autoUpdate === 'true');
        }
        if (dismissed) {
          setDismissedVersion(dismissed);
        }
        console.log('[AppUpdate] Settings loaded. autoUpdate:', autoUpdate, 'dismissed:', dismissed);
      } catch (err) {
        console.log('[AppUpdate] Error loading settings:', err);
      } finally {
        setSettingsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  const updateCheckQuery = useQuery<UpdateInfo>({
    queryKey: ['app-update-check'],
    queryFn: async () => {
      try {
        console.log('[AppUpdate] Checking for updates... client version:', APP_VERSION);
        const result = await Promise.race([
          trpcClient.updates.check.query({
            clientVersion: APP_VERSION,
            clientBuild: BUILD_NUMBER,
            platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Update check timed out')), 10000)
          ),
        ]);
        await AsyncStorage.setItem(STORAGE_KEY_LAST_CHECK, new Date().toISOString());
        console.log('[AppUpdate] Update check result:', JSON.stringify(result));
        return result;
      } catch (err) {
        console.log('[AppUpdate] Update check failed:', err);
        return {
          hasUpdate: false,
          mustUpdate: false,
          latestVersion: APP_VERSION,
          minimumVersion: APP_VERSION,
          buildNumber: BUILD_NUMBER,
          releaseDate: new Date().toISOString(),
          changelog: [],
          downloadUrl: '',
          maintenanceMode: false,
          maintenanceMessage: '',
        };
      }
    },
    enabled: settingsLoaded && autoUpdateEnabled,
    refetchInterval: CHECK_INTERVAL_MS,
    staleTime: CHECK_INTERVAL_MS / 2,
    retry: 1,
    retryDelay: 10000,
  });

  useEffect(() => {
    if (!updateCheckQuery.data) return;
    const data = updateCheckQuery.data;

    if (data.maintenanceMode) {
      setShowMaintenanceModal(true);
      return;
    }

    if (data.mustUpdate) {
      setShowUpdateModal(true);
      return;
    }

    if (data.hasUpdate && dismissedVersion !== data.latestVersion) {
      setShowUpdateModal(true);
    }
  }, [updateCheckQuery.data, dismissedVersion]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && autoUpdateEnabled && settingsLoaded) {
        console.log('[AppUpdate] App became active, refreshing update check');
        queryClient.invalidateQueries({ queryKey: ['app-update-check'] });
      }
    });
    return () => subscription.remove();
  }, [autoUpdateEnabled, settingsLoaded, queryClient]);

  const toggleAutoUpdate = useCallback(async (enabled: boolean) => {
    console.log('[AppUpdate] Auto-update toggled:', enabled);
    setAutoUpdateEnabled(enabled);
    await AsyncStorage.setItem(STORAGE_KEY_AUTO_UPDATE, String(enabled));
    if (enabled) {
      queryClient.invalidateQueries({ queryKey: ['app-update-check'] });
    }
  }, [queryClient]);

  const dismissUpdate = useCallback(async () => {
    const version = updateCheckQuery.data?.latestVersion;
    if (version && !updateCheckQuery.data?.mustUpdate) {
      console.log('[AppUpdate] Dismissing update for version:', version);
      setDismissedVersion(version);
      await AsyncStorage.setItem(STORAGE_KEY_DISMISSED, version);
      setShowUpdateModal(false);
    }
  }, [updateCheckQuery.data]);

  const checkNow = useCallback(async () => {
    console.log('[AppUpdate] Manual check triggered');
    await queryClient.invalidateQueries({ queryKey: ['app-update-check'] });
    await queryClient.refetchQueries({ queryKey: ['app-update-check'] });
  }, [queryClient]);

  const openDownloadUrl = useCallback(() => {
    const url = updateCheckQuery.data?.downloadUrl;
    if (url) {
      Linking.openURL(url).catch(console.log);
    }
  }, [updateCheckQuery.data]);

  const closeUpdateModal = useCallback(() => {
    if (!updateCheckQuery.data?.mustUpdate) {
      setShowUpdateModal(false);
    }
  }, [updateCheckQuery.data]);

  const closeMaintenanceModal = useCallback(() => {
    setShowMaintenanceModal(false);
  }, []);

  return {
    appVersion: APP_VERSION,
    buildNumber: BUILD_NUMBER,
    autoUpdateEnabled,
    toggleAutoUpdate,
    updateInfo: updateCheckQuery.data ?? null,
    isChecking: updateCheckQuery.isFetching,
    lastChecked: updateCheckQuery.dataUpdatedAt ? new Date(updateCheckQuery.dataUpdatedAt) : null,
    showUpdateModal,
    showMaintenanceModal,
    dismissUpdate,
    checkNow,
    openDownloadUrl,
    closeUpdateModal,
    closeMaintenanceModal,
    hasUpdate: updateCheckQuery.data?.hasUpdate ?? false,
    mustUpdate: updateCheckQuery.data?.mustUpdate ?? false,
  };
});
