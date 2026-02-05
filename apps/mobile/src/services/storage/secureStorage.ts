/**
 * Secure Storage Service
 * Verwendet expo-secure-store für sichere Token-Speicherung
 */

import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants/config';

/**
 * Speichert den Access Token sicher
 */
export const setAccessToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
};

/**
 * Holt den Access Token
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
};

/**
 * Speichert den Refresh Token sicher
 */
export const setRefreshToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
};

/**
 * Holt den Refresh Token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    return null;
  }
};

/**
 * Speichert beide Tokens
 */
export const setTokens = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  await Promise.all([
    setAccessToken(accessToken),
    setRefreshToken(refreshToken),
  ]);
};

/**
 * Loescht den Access Token
 */
export const removeAccessToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Loescht den Refresh Token
 */
export const removeRefreshToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Loescht alle Tokens
 */
export const clearTokens = async (): Promise<void> => {
  await Promise.all([
    removeAccessToken(),
    removeRefreshToken(),
  ]);
};

/**
 * Prüft ob Tokens vorhanden sind
 */
export const hasTokens = async (): Promise<boolean> => {
  const accessToken = await getAccessToken();
  return accessToken !== null;
};
