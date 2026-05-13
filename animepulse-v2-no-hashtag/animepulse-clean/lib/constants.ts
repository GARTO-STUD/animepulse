/**
 * lib/constants.ts
 * Shared constants used across the application.
 * Centralises values that would otherwise be hardcoded in multiple files.
 */

export const CURRENT_YEAR = new Date().getFullYear();
export const APP_NAME = 'AnimePulse';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://animepulse.online';
