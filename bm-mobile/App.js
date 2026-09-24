import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, I18nManager, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Line, Path, Polyline, Rect } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { File as ExpoFile } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';

I18nManager.allowRTL(true);
I18nManager.forceRTL(false);

// Professional vector icons drawn with react-native-svg. No icon fonts and no text glyphs.
const DRAWN_ICON_NAME_MAP = {
  'arrow-forward': 'back', 'arrow-forward-outline': 'back', 'arrow-right': 'back',
  'chevron-back': 'chevronBack', 'chevron-forward': 'chevronForward',
  'log-in-outline': 'login', 'log-out-outline': 'logout', 'logout-variant': 'logout',
  'bell-ring-outline': 'bell', 'notifications-outline': 'bell',
  'calendar-outline': 'calendar', 'calendar': 'calendar',
  'close': 'close', 'close-outline': 'close',
  'business-outline': 'building', 'business': 'building', 'office-building-cog': 'building', 'home-city-outline': 'building',
  'home-outline': 'home',
  'cash-outline': 'cash', 'wallet-outline': 'wallet', 'card-outline': 'card',
  'receipt-outline': 'receipt', 'document-text-outline': 'document', 'list-outline': 'list',
  'alert-circle-outline': 'alert', 'warning-outline': 'alert',
  'people-outline': 'people', 'people': 'people', 'person': 'person', 'person-outline': 'person', 'account-circle-outline': 'personCircle',
  'grid-outline': 'grid', 'apps-outline': 'grid',
  'settings-outline': 'settings', 'cog-outline': 'settings',
  'ellipsis-vertical': 'more', 'dots-vertical-circle-outline': 'more',
  'add': 'plus', 'add-outline': 'plus', 'add-circle-outline': 'plusCircle', 'plus': 'plus',
  'create-outline': 'edit', 'pencil-outline': 'edit', 'edit-outline': 'edit',
  'trash-outline': 'trash', 'delete-outline': 'trash',
  'search-outline': 'search', 'search': 'search',
  'save-outline': 'check', 'checkmark': 'check', 'checkmark-circle-outline': 'checkCircle',
  'eye-outline': 'eye', 'information-circle-outline': 'info',
  'call-outline': 'phone', 'phone-outline': 'phone',
  'lock-closed-outline': 'lock', 'key-outline': 'key',
  'download-outline': 'download', 'share-outline': 'share',
  'refresh-outline': 'refresh', 'reload-outline': 'refresh',
  'filter-outline': 'filter', 'options-outline': 'sliders',
  'menu': 'menu', 'menu-outline': 'menu',
  'mail-outline': 'mail', 'chatbubble-outline': 'chat',
  'camera-outline': 'camera', 'image-outline': 'image', 'attach-outline': 'paperclip', 'attach': 'paperclip', 'paperclip': 'paperclip',
  'location-outline': 'location', 'map-outline': 'map',
  'time-outline': 'clock', 'timer-outline': 'clock'
};

function renderDrawnIcon(key, color, strokeWidth) {
  const s = { stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  switch (key) {
    case 'back': return <><Line x1="20" y1="12" x2="5" y2="12" {...s} /><Polyline points="11 18 5 12 11 6" {...s} /></>;
    case 'chevronBack': return <Polyline points="15 18 9 12 15 6" {...s} />;
    case 'chevronForward': return <Polyline points="9 18 15 12 9 6" {...s} />;
    case 'login': return <><Path d="M10 17l5-5-5-5" {...s} /><Line x1="15" y1="12" x2="3" y2="12" {...s} /><Path d="M14 3h4a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-4" {...s} /></>;
    case 'logout': return <><Path d="M14 8l4 4-4 4" {...s} /><Line x1="18" y1="12" x2="7" y2="12" {...s} /><Path d="M10 4H6a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h4" {...s} /></>;
    case 'bell': return <><Path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" {...s} /><Path d="M10 21h4" {...s} /></>;
    case 'calendar': return <><Rect x="3" y="5" width="18" height="16" rx="3" {...s} /><Line x1="7" y1="3" x2="7" y2="7" {...s} /><Line x1="17" y1="3" x2="17" y2="7" {...s} /><Line x1="3" y1="10" x2="21" y2="10" {...s} /><Circle cx="8" cy="14" r="0.8" fill={color} /><Circle cx="12" cy="14" r="0.8" fill={color} /><Circle cx="16" cy="14" r="0.8" fill={color} /></>;
    case 'close': return <><Line x1="6" y1="6" x2="18" y2="18" {...s} /><Line x1="18" y1="6" x2="6" y2="18" {...s} /></>;
    case 'building': return <><Rect x="4" y="3" width="16" height="18" rx="2" {...s} /><Line x1="8" y1="7" x2="8" y2="9" {...s} /><Line x1="12" y1="7" x2="12" y2="9" {...s} /><Line x1="16" y1="7" x2="16" y2="9" {...s} /><Line x1="8" y1="12" x2="8" y2="14" {...s} /><Line x1="12" y1="12" x2="12" y2="14" {...s} /><Line x1="16" y1="12" x2="16" y2="14" {...s} /><Path d="M10 21v-4h4v4" {...s} /></>;
    case 'home': return <><Path d="M3 11.5L12 4l9 7.5" {...s} /><Path d="M5 10v10h14V10" {...s} /><Path d="M9 20v-6h6v6" {...s} /></>;
    case 'cash': return <><Rect x="3" y="6" width="18" height="12" rx="2" {...s} /><Circle cx="12" cy="12" r="3" {...s} /><Path d="M6 9h.01M18 15h.01" {...s} /></>;
    case 'wallet': return <><Path d="M4 6h14a2 2 0 0 1 2 2v11H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12" {...s} /><Path d="M16 10h6v5h-6a2.5 2.5 0 0 1 0-5z" {...s} /><Circle cx="17" cy="12.5" r="0.7" fill={color} /></>;
    case 'card': return <><Rect x="2.5" y="5" width="19" height="14" rx="3" {...s} /><Line x1="2.5" y1="10" x2="21.5" y2="10" {...s} /><Line x1="6" y1="15" x2="10" y2="15" {...s} /></>;
    case 'receipt': return <><Path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" {...s} /><Line x1="9" y1="8" x2="15" y2="8" {...s} /><Line x1="9" y1="12" x2="15" y2="12" {...s} /><Line x1="9" y1="16" x2="13" y2="16" {...s} /></>;
    case 'document': return <><Path d="M6 2h8l4 4v16H6z" {...s} /><Path d="M14 2v5h4" {...s} /><Line x1="9" y1="12" x2="15" y2="12" {...s} /><Line x1="9" y1="16" x2="15" y2="16" {...s} /></>;
    case 'list': return <><Line x1="9" y1="6" x2="20" y2="6" {...s} /><Line x1="9" y1="12" x2="20" y2="12" {...s} /><Line x1="9" y1="18" x2="20" y2="18" {...s} /><Circle cx="4.5" cy="6" r="1" fill={color} /><Circle cx="4.5" cy="12" r="1" fill={color} /><Circle cx="4.5" cy="18" r="1" fill={color} /></>;
    case 'alert': return <><Path d="M12 3L2.8 20h18.4L12 3z" {...s} /><Line x1="12" y1="9" x2="12" y2="14" {...s} /><Circle cx="12" cy="17" r="0.8" fill={color} /></>;
    case 'people': return <><Circle cx="9" cy="8" r="3" {...s} /><Circle cx="17" cy="9" r="2.5" {...s} /><Path d="M3 20c.7-4 3-6 6-6s5.3 2 6 6" {...s} /><Path d="M15 15c3 0 5 1.8 6 5" {...s} /></>;
    case 'person': return <><Circle cx="12" cy="8" r="4" {...s} /><Path d="M4 21c.8-5 3.6-7 8-7s7.2 2 8 7" {...s} /></>;
    case 'personCircle': return <><Circle cx="12" cy="12" r="9" {...s} /><Circle cx="12" cy="9" r="3" {...s} /><Path d="M6.5 19c1-3 3-4.5 5.5-4.5S16.5 16 17.5 19" {...s} /></>;
    case 'grid': return <><Rect x="3" y="3" width="7" height="7" rx="1.5" {...s} /><Rect x="14" y="3" width="7" height="7" rx="1.5" {...s} /><Rect x="3" y="14" width="7" height="7" rx="1.5" {...s} /><Rect x="14" y="14" width="7" height="7" rx="1.5" {...s} /></>;
    case 'settings': return <><Circle cx="12" cy="12" r="3" {...s} /><Path d="M12 2v3M12 19v3M4.9 4.9L7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1" {...s} /></>;
    case 'more': return <><Circle cx="12" cy="5" r="1.5" fill={color} /><Circle cx="12" cy="12" r="1.5" fill={color} /><Circle cx="12" cy="19" r="1.5" fill={color} /></>;
    case 'plus': return <><Line x1="12" y1="5" x2="12" y2="19" {...s} /><Line x1="5" y1="12" x2="19" y2="12" {...s} /></>;
    case 'plusCircle': return <><Circle cx="12" cy="12" r="9" {...s} /><Line x1="12" y1="8" x2="12" y2="16" {...s} /><Line x1="8" y1="12" x2="16" y2="12" {...s} /></>;
    case 'edit': return <><Path d="M4 20l4.5-1 10-10a2.2 2.2 0 0 0-3.1-3.1l-10 10L4 20z" {...s} /><Line x1="13.8" y1="7.5" x2="16.9" y2="10.6" {...s} /></>;
    case 'trash': return <><Path d="M4 7h16" {...s} /><Path d="M9 7V4h6v3" {...s} /><Path d="M6 7l1 14h10l1-14" {...s} /><Line x1="10" y1="11" x2="10.5" y2="17" {...s} /><Line x1="14" y1="11" x2="13.5" y2="17" {...s} /></>;
    case 'search': return <><Circle cx="10.5" cy="10.5" r="6.5" {...s} /><Line x1="15.5" y1="15.5" x2="21" y2="21" {...s} /></>;
    case 'check': return <Polyline points="5 12.5 10 17 19 7" {...s} />;
    case 'checkCircle': return <><Circle cx="12" cy="12" r="9" {...s} /><Polyline points="7.5 12.5 10.5 15.5 16.5 8.5" {...s} /></>;
    case 'eye': return <><Path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" {...s} /><Circle cx="12" cy="12" r="2.5" {...s} /></>;
    case 'info': return <><Circle cx="12" cy="12" r="9" {...s} /><Line x1="12" y1="11" x2="12" y2="17" {...s} /><Circle cx="12" cy="7.5" r="0.8" fill={color} /></>;
    case 'phone': return <Path d="M6.5 3.5l3 4-2 2c1.5 3 3.5 5 6.5 6.5l2-2 4 3c.5.4.6 1 .3 1.6-1 2-2.8 3-5 2.5C9 19.8 4.2 15 2.9 8.7 2.4 6.5 3.4 4.7 5.4 3.7c.4-.2.8-.3 1.1-.2z" {...s} />;
    case 'lock': return <><Rect x="5" y="10" width="14" height="11" rx="2" {...s} /><Path d="M8 10V7a4 4 0 0 1 8 0v3" {...s} /><Circle cx="12" cy="15" r="1" fill={color} /></>;
    case 'key': return <><Circle cx="8" cy="15" r="4" {...s} /><Path d="M11 12l8-8M16 7l2 2M18 5l2 2" {...s} /></>;
    case 'download': return <><Line x1="12" y1="3" x2="12" y2="15" {...s} /><Polyline points="7 11 12 16 17 11" {...s} /><Path d="M5 21h14" {...s} /></>;
    case 'share': return <><Circle cx="18" cy="5" r="2.5" {...s} /><Circle cx="6" cy="12" r="2.5" {...s} /><Circle cx="18" cy="19" r="2.5" {...s} /><Line x1="8.2" y1="10.8" x2="15.8" y2="6.2" {...s} /><Line x1="8.2" y1="13.2" x2="15.8" y2="17.8" {...s} /></>;
    case 'refresh': return <><Path d="M20 7v5h-5" {...s} /><Path d="M4 17v-5h5" {...s} /><Path d="M6.2 8A7 7 0 0 1 18 6l2 2M18 16a7 7 0 0 1-11.8 2L4 16" {...s} /></>;
    case 'filter': return <Path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" {...s} />;
    case 'sliders': return <><Line x1="4" y1="6" x2="20" y2="6" {...s} /><Circle cx="9" cy="6" r="2" fill="#fff" {...s} /><Line x1="4" y1="12" x2="20" y2="12" {...s} /><Circle cx="15" cy="12" r="2" fill="#fff" {...s} /><Line x1="4" y1="18" x2="20" y2="18" {...s} /><Circle cx="11" cy="18" r="2" fill="#fff" {...s} /></>;
    case 'menu': return <><Line x1="4" y1="7" x2="20" y2="7" {...s} /><Line x1="4" y1="12" x2="20" y2="12" {...s} /><Line x1="4" y1="17" x2="20" y2="17" {...s} /></>;
    case 'mail': return <><Rect x="3" y="5" width="18" height="14" rx="2" {...s} /><Polyline points="4 7 12 13 20 7" {...s} /></>;
    case 'chat': return <Path d="M4 4h16v12H9l-5 4V4z" {...s} />;
    case 'camera': return <><Rect x="3" y="7" width="18" height="13" rx="3" {...s} /><Path d="M8 7l1.5-3h5L16 7" {...s} /><Circle cx="12" cy="13.5" r="3.5" {...s} /></>;
    case 'image': return <><Rect x="3" y="4" width="18" height="16" rx="2" {...s} /><Circle cx="8" cy="9" r="1.5" {...s} /><Polyline points="5 18 10 13 13 16 16 12 20 18" {...s} /></>;
    case 'paperclip': return <Path d="M8.5 12.5l6.8-6.8a3.5 3.5 0 0 1 5 5l-9.2 9.2a5 5 0 0 1-7.1-7.1l9-9a2.7 2.7 0 0 1 3.8 3.8l-8.9 8.9a1.5 1.5 0 0 1-2.1-2.1l7.6-7.6" {...s} />;
    case 'location': return <><Path d="M12 22s7-6.3 7-13a7 7 0 1 0-14 0c0 6.7 7 13 7 13z" {...s} /><Circle cx="12" cy="9" r="2.5" {...s} /></>;
    case 'map': return <><Path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" {...s} /><Line x1="9" y1="3" x2="9" y2="18" {...s} /><Line x1="15" y1="6" x2="15" y2="21" {...s} /></>;
    case 'clock': return <><Circle cx="12" cy="12" r="9" {...s} /><Line x1="12" y1="7" x2="12" y2="12" {...s} /><Line x1="12" y1="12" x2="16" y2="14" {...s} /></>;
    default: return <><Circle cx="12" cy="12" r="8" {...s} /><Circle cx="12" cy="12" r="2" fill={color} /></>;
  }
}

function DrawnIcon({ name, size = 20, color = '#0f172a', style, strokeWidth = 1.9 }) {
  const key = DRAWN_ICON_NAME_MAP[name] || name || 'default';
  const iconSize = Math.max(14, Number(size) || 20);
  return <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" style={style}>{renderDrawnIcon(key, color, strokeWidth)}</Svg>;
}
const Ionicons = DrawnIcon;
const MaterialCommunityIcons = DrawnIcon;

const NOTIFICATION_CHANNEL_ID = 'bm-main-alerts';
let NotificationsModule = null;
let ExpoGoRuntime = null;

function isRunningInExpoGo() {
  if (ExpoGoRuntime !== null) return ExpoGoRuntime;
  try {
    const ConstantsModule = require('expo-constants');
    const Constants = ConstantsModule?.default || ConstantsModule;
    ExpoGoRuntime =
      Constants?.appOwnership === 'expo' ||
      Constants?.executionEnvironment === 'storeClient';
  } catch (_) {
    // The live project is normally opened through Expo Go while developing.
    // If runtime detection is unavailable, do not load remote notifications in dev.
    ExpoGoRuntime = typeof __DEV__ !== 'undefined' && __DEV__;
  }
  return ExpoGoRuntime;
}

function getNotificationsModule() {
  // expo-notifications remote push support is intentionally unavailable in Expo Go
  // (SDK 53+). Never require it there because the module throws before JS can recover.
  if (isRunningInExpoGo()) return null;

  try {
    if (!NotificationsModule) {
      NotificationsModule = require('expo-notifications');
      NotificationsModule.setNotificationHandler?.({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }
    return NotificationsModule;
  } catch (error) {
    console.warn('BM notifications module unavailable', error?.message || error);
    return null;
  }
}

async function prepareNotifications() {
  const Notifications = getNotificationsModule();
  if (!Notifications) return false;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: 'تنبيهات اتحاد الملاك',
        importance: Notifications.AndroidImportance?.MAX ?? 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0f766e',
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC,
      });
    }

    const current = await Notifications.getPermissionsAsync();
    const finalStatus = current.status === 'granted' ? current.status : (await Notifications.requestPermissionsAsync()).status;
    return finalStatus === 'granted';
  } catch (error) {
    console.warn('BM notifications setup failed', error?.message || error);
    return false;
  }
}

async function notifyLocal(title, body) {
  const Notifications = getNotificationsModule();
  try {
    const ready = await prepareNotifications();
    if (!Notifications || !ready) return Alert.alert(title, body);
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority?.MAX,
      },
      trigger: null,
    });
  } catch (_) {
    Alert.alert(title, body);
  }
}

const PUSH_TOKEN_STORAGE_KEY = 'bm_expo_push_token';

async function registerPushNotifications(apiToken) {
  if (!apiToken) return false;
  const Notifications = getNotificationsModule();
  try {
    const ready = await prepareNotifications();
    if (!Notifications || !ready) return false;

    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || undefined;
    const result = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    const pushToken = result?.data;
    if (!pushToken) return false;

    await request('/push-tokens', {
      method: 'POST',
      body: JSON.stringify({ token: pushToken, platform: Platform.OS }),
    }, apiToken);
    await SecureStore.setItemAsync(PUSH_TOKEN_STORAGE_KEY, pushToken);
    return true;
  } catch (error) {
    console.warn('BM push token registration unavailable', error?.message || error);
    return false;
  }
}

async function unregisterPushNotifications(apiToken) {
  if (!apiToken) return;
  try {
    const pushToken = await SecureStore.getItemAsync(PUSH_TOKEN_STORAGE_KEY);
    if (!pushToken) return;
    await request('/push-tokens', {
      method: 'DELETE',
      body: JSON.stringify({ token: pushToken }),
    }, apiToken);
  } catch (error) {
    console.warn('BM push token unregister failed', error?.message || error);
  } finally {
    try { await SecureStore.deleteItemAsync(PUSH_TOKEN_STORAGE_KEY); } catch (_) {}
  }
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://bm.pm.sa/api';
const DEFAULT_EXPENSE_CATEGORIES = ['حارس', 'كهرباء', 'مياه', 'نظافة', 'صيانة', 'مشتريات', 'مصعد', 'أخرى'];
const money = (v) => `${Number(v || 0).toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ريال`;
const apartmentSortValue = (owner) => {
  const numbers = (owner?.apartments || []).map((value) => Number.parseInt(String(value), 10)).filter(Number.isFinite);
  return numbers.length ? Math.min(...numbers) : Number.MAX_SAFE_INTEGER;
};
const sortOwnersByApartment = (owners) => [...(owners || [])].sort((a, b) => apartmentSortValue(a) - apartmentSortValue(b) || String(a?.name || '').localeCompare(String(b?.name || ''), 'ar'));
const sortApartmentNumbers = (apartments) => [...(apartments || [])].sort((a, b) => Number(a) - Number(b));

function todayDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
function normalizeDateForApi(value) {
  const text = String(value || '').trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  return text;
}
function displayDate(value, fallback = '-') {
  const text = String(value || '').trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return `${dmy[1].padStart(2, '0')}/${dmy[2].padStart(2, '0')}/${dmy[3]}`;
  return value || fallback;
}
function displayTextDates(value) {
  return String(value || '').replace(/(\d{4})-(\d{2})-(\d{2})(?:[T\s][^\s]*)?/g, (_, y, m, d) => `${d}/${m}/${y}`);
}
function dateParts(value) {
  const normalized = normalizeDateForApi(value) || todayDate();
  return { year: normalized.slice(0, 4), month: String(Number(normalized.slice(5, 7)) || 1), day: String(Number(normalized.slice(8, 10)) || 1) };
}

async function request(path, options = {}, token) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
    });
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { message: text || 'حدث خطأ غير متوقع' }; }
    if (!response.ok) throw new Error(data?.message || Object.values(data?.errors || {})?.flat()?.[0] || 'حدث خطأ غير متوقع');
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('انتهت مهلة الاتصال بالخادم. تحقق من الإنترنت ثم حاول مرة أخرى.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestFormData(path, formData, token) {
  const response = await expoFetch(`${API_URL}${path}`, {
    method: 'POST',
    body: formData,
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { message: text || 'حدث خطأ غير متوقع' }; }
  if (!response.ok) throw new Error(data?.message || Object.values(data?.errors || {})?.flat()?.[0] || 'حدث خطأ غير متوقع');
  return data;
}

function expenseAttachmentUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

function attachmentFileSource(item) {
  return item?.file || item;
}

function isPdfAttachment(item) {
  const source = attachmentFileSource(item);
  const mime = String(source?.mime_type || source?.mimeType || source?.type || '').toLowerCase();
  const name = String(source?.original_name || source?.name || '').toLowerCase();
  return mime.includes('pdf') || name.endsWith('.pdf');
}

function attachmentDisplayName(item, index = 0) {
  const custom = String(item?.display_name || item?.displayName || '').trim();
  if (custom) return custom;
  return isPdfAttachment(item) ? `ملف PDF ${index + 1}` : `صورة ${index + 1}`;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry = false, multiline = false }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={[styles.input, multiline && styles.textarea]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#94a3b8" keyboardType={keyboardType} secureTextEntry={secureTextEntry} multiline={multiline} textAlign="right" />{label.includes('*') ? <Text style={styles.requiredHint}>* حقل إجباري</Text> : null}</View>;
}
function PrimaryButton({ title, icon, onPress, loading, variant = 'primary' }) {
  return <Pressable disabled={loading} onPress={onPress} style={({ pressed }) => [styles.button, styles[`button_${variant}`], pressed && styles.pressed]}>{loading ? <ActivityIndicator color={variant === 'light' ? '#0f766e' : '#fff'} /> : <Ionicons name={icon} size={20} color={variant === 'light' ? '#0f766e' : '#fff'} />}<Text style={[styles.buttonText, variant === 'light' && styles.buttonTextLight]}>{title}</Text></Pressable>;
}
function Header({ title, subtitle, onLogout, onBack, token }) {
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const openNotifications = async () => {
    if (!token) return notifyLocal('التنبيهات', 'سجّل الدخول لعرض التنبيهات.');
    setNotificationsVisible(true);
    setNotificationsLoading(true);
    try {
      const data = await request('/notifications', {}, token);
      setNotifications(data?.data || []);
      if (Number(data?.unread_count || 0) > 0) {
        await request('/notifications/read-all', { method: 'POST' }, token);
      }
    } catch (error) {
      Alert.alert('تعذر تحميل التنبيهات', error.message);
    } finally {
      setNotificationsLoading(false);
    }
  };

  return <>
    <View style={styles.header}>
      <View style={styles.headerActions}>
        {onBack ? <HeaderIconButton icon="arrow-right" color="#0f766e" label="رجوع" onPress={onBack} /> : null}
        <HeaderIconButton icon="bell-ring-outline" color="#7c3aed" label="تنبيه" onPress={openNotifications} />
      </View>
      <View style={styles.flex1}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>

    <Modal visible={notificationsVisible} transparent animationType="fade" onRequestClose={() => setNotificationsVisible(false)}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={() => setNotificationsVisible(false)} />
        <View style={styles.floatingFormCard}>
          <View style={styles.floatingFormHeader}>
            <Pressable onPress={() => setNotificationsVisible(false)} style={styles.closeFloatingBtn}><Ionicons name="close" size={22} color="#0f172a" /></Pressable>
            <View style={styles.flex1}>
              <Text style={styles.floatingFormTitle}>التنبيهات</Text>
              <Text style={styles.ownerMeta}>آخر تنبيهات الحساب</Text>
            </View>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.floatingFormBody}>
            {notificationsLoading ? <ActivityIndicator color="#0f766e" size="large" /> : null}
            {!notificationsLoading && notifications.length === 0 ? <EmptyState icon="notifications-outline" title="لا توجد تنبيهات" text="ستظهر هنا تنبيهات المصروفات الجديدة والتعديلات." /> : null}
            {notifications.map((item) => <View key={item.id} style={styles.notificationCard}>
              <View style={styles.notificationIcon}><Ionicons name="bell-ring-outline" size={20} color="#7c3aed" /></View>
              <View style={styles.flex1}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationBody}>{item.body}</Text>
                <Text style={styles.notificationDate}>{item.created_at ? new Date(item.created_at).toLocaleString('ar-SA') : ''}</Text>
              </View>
            </View>)}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}
function HeaderIconButton({ icon, color, label, onPress }) {
  return <Pressable onPress={onPress} accessibilityLabel={label} style={({ pressed }) => [styles.circleBtn, pressed && styles.pressed]}><MaterialCommunityIcons name={icon} size={23} color={color} /><Text style={styles.circleBtnLabel}>{label}</Text></Pressable>;
}
function SectionTitle({ title, icon }) { return <View style={styles.sectionTitle}><Ionicons name={icon} size={20} color="#0f766e" /><Text style={styles.sectionText}>{title}</Text></View>; }
function EmptyState({ icon, title, text }) { return <View style={styles.empty}><Ionicons name={icon} size={40} color="#94a3b8" /><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyText}>{text}</Text></View>; }
function ScreenCode({ code, style }) { return <View style={[styles.screenCodeBadge, style]}><Text style={styles.screenCodeText}>{code}</Text></View>; }
function DatePickerField({ label, value, onChange, placeholder = 'اضغط لاختيار التاريخ' }) {
  const [visible, setVisible] = useState(false);
  const [tempYear, setTempYear] = useState(dateParts(value).year);
  const [tempMonth, setTempMonth] = useState(dateParts(value).month);
  const [tempDay, setTempDay] = useState(dateParts(value).day);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => String(currentYear - 5 + i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const days = Array.from({ length: new Date(Number(tempYear), Number(tempMonth), 0).getDate() }, (_, i) => String(i + 1));
  const open = () => { const p = dateParts(value); setTempYear(p.year); setTempMonth(p.month); setTempDay(p.day); setVisible(true); };
  const choose = () => { const safeDay = Math.min(Number(tempDay) || 1, new Date(Number(tempYear), Number(tempMonth), 0).getDate()); onChange(`${tempYear}-${tempMonth.padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`); setVisible(false); };
  const Choice = ({ item, selected, onPress }) => <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipActive]}><Text style={[styles.chipText, selected && styles.chipTextActive]}>{String(item).padStart(2, '0')}</Text></Pressable>;
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><Pressable onPress={open} style={({ pressed }) => [styles.input, styles.dateInput, pressed && styles.pressed]}><Ionicons name="calendar-outline" size={18} color={value ? '#0f766e' : '#94a3b8'} /><Text style={[styles.dateInputText, !value && styles.datePlaceholder]}>{value ? displayDate(value) : placeholder}</Text></Pressable><Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}><View style={styles.modalRoot}><Pressable style={styles.modalBackdrop} onPress={() => setVisible(false)} /><View style={styles.floatingFormCard}><View style={styles.floatingFormHeader}><Pressable onPress={() => setVisible(false)} style={styles.closeFloatingBtn}><Ionicons name="close" size={22} color="#0f172a" /></Pressable><View style={styles.flex1}><Text style={styles.floatingFormTitle}>اختيار التاريخ</Text><Text style={styles.ownerMeta}>{label}</Text></View></View><Text style={styles.label}>السنة</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>{years.map((item) => <Choice key={item} item={item} selected={tempYear === item} onPress={() => setTempYear(item)} />)}</ScrollView><Text style={styles.label}>الشهر</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>{months.map((item) => <Choice key={item} item={item} selected={tempMonth === item} onPress={() => setTempMonth(item)} />)}</ScrollView><Text style={styles.label}>اليوم</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>{days.map((item) => <Choice key={item} item={item} selected={tempDay === item} onPress={() => setTempDay(item)} />)}</ScrollView><PrimaryButton title="اختيار التاريخ" icon="calendar-outline" onPress={choose} /><PrimaryButton title="إلغاء" icon="close-outline" onPress={() => setVisible(false)} variant="light" /></View></View></Modal></View>;
}

function LoginScreen({ onLogin }) {
  const [login, setLogin] = useState('manager'); const [password, setPassword] = useState('123456'); const [loading, setLoading] = useState(false);
  const submit = async () => { try { setLoading(true); const data = await request('/login', { method: 'POST', body: JSON.stringify({ login, password }) }); await SecureStore.setItemAsync('bm_token', data.token); onLogin(data.token, data.user); } catch (e) { Alert.alert('تعذر تسجيل الدخول', e.message); } finally { setLoading(false); } };
  return <SafeAreaView style={styles.loginContainer}><StatusBar style="dark" /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 8}><ScrollView contentContainerStyle={styles.loginContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}><ScreenCode code="#S-001" /><View style={styles.logoCircle}><MaterialCommunityIcons name="office-building-cog" size={54} color="#0f766e" /></View><Text style={styles.appName}>إدارة اتحاد الملاك</Text><Text style={styles.subtitle}>مصروفات المبنى، دفعات الملاك، والرصيد في شاشة سهلة وواضحة</Text><View style={styles.loginCard}><Field label="اسم المستخدم أو الجوال" value={login} onChangeText={setLogin} placeholder="مثال: manager" /><Field label="كلمة المرور" value={password} onChangeText={setPassword} placeholder="••••••" secureTextEntry /><PrimaryButton title="دخول" icon="log-in-outline" onPress={submit} loading={loading} /></View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
function BuildingPicker({ token, user, onSelect, onBuildingsChanged }) {
  const canManage = user?.role === 'admin' || user?.role === 'manager';
  const [buildings, setBuildings] = useState(user?.buildings || []);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [apartmentCount, setApartmentCount] = useState('0');
  const [annualCycleStartsOn, setAnnualCycleStartsOn] = useState(todayDate());
  const [saving, setSaving] = useState(false);

  const loadBuildings = async () => {
    if (!token) return;
    try {
      setLoadingBuildings(true);
      const data = await request('/buildings', {}, token);
      const next = data?.data || [];
      setBuildings(next);
      onBuildingsChanged?.(next);
    } catch (error) {
      Alert.alert('تعذر تحميل المباني', error.message);
    } finally {
      setLoadingBuildings(false);
    }
  };

  useEffect(() => {
    loadBuildings();
  }, [token]);

  const resetForm = () => {
    setEditingBuilding(null);
    setName('');
    setCity('');
    setDistrict('');
    setAddress('');
    setApartmentCount('0');
    setAnnualCycleStartsOn(todayDate());
  };

  const openAdd = () => {
    resetForm();
    setFormVisible(true);
  };

  const openEdit = (item) => {
    setEditingBuilding(item);
    setName(item?.name || '');
    setCity(item?.city || '');
    setDistrict(item?.district || '');
    setAddress(item?.address || '');
    setApartmentCount(String(item?.apartments_count ?? 0));
    setAnnualCycleStartsOn(normalizeDateForApi(item?.annual_cycle_starts_on || todayDate()));
    setFormVisible(true);
  };

  const saveBuilding = async () => {
    const nextName = String(name || '').trim();
    const count = Number(apartmentCount);
    if (!nextName) return Alert.alert('تنبيه', 'أدخل اسم المبنى');
    if (!Number.isInteger(count) || count < 0) return Alert.alert('تنبيه', 'أدخل عدد الشقق بشكل صحيح');

    try {
      setSaving(true);
      const payload = {
        name: nextName,
        city: String(city || '').trim() || null,
        district: String(district || '').trim() || null,
        address: String(address || '').trim() || null,
        apartment_count: count,
        annual_cycle_starts_on: normalizeDateForApi(annualCycleStartsOn) || null,
      };
      await request(
        editingBuilding ? `/buildings/${editingBuilding.id}` : '/buildings',
        { method: editingBuilding ? 'PUT' : 'POST', body: JSON.stringify(payload) },
        token
      );
      setFormVisible(false);
      resetForm();
      await loadBuildings();
    } catch (error) {
      Alert.alert(editingBuilding ? 'تعذر تعديل المبنى' : 'تعذر إضافة المبنى', error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteBuilding = (item) => {
    Alert.alert(
      'حذف المبنى',
      `هل أنت متأكد من حذف "${item.name}"؟ سيتم حذف بيانات المبنى المرتبطة به من شقق وملاك ومصروفات ودفعات، ولا يمكن التراجع عن ذلك.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائي',
          style: 'destructive',
          onPress: async () => {
            try {
              await request(`/buildings/${item.id}`, { method: 'DELETE' }, token);
              await loadBuildings();
            } catch (error) {
              Alert.alert('تعذر حذف المبنى', error.message);
            }
          },
        },
      ]
    );
  };

  return <SafeAreaView style={styles.container}>
    <Header title="اختر المبنى" subtitle={`مرحبًا ${user?.name || ''}`} />
    <FlatList
      contentContainerStyle={styles.buildingsListContent}
      data={buildings}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={canManage ? <Pressable onPress={openAdd} style={({ pressed }) => [styles.buildingAddButton, pressed && styles.pressed]}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.buildingAddButtonText}>إضافة مبنى</Text>
      </Pressable> : null}
      ListEmptyComponent={loadingBuildings ? <LoadingScreen /> : <EmptyState icon="business-outline" title="لا توجد مبانٍ" text="أضف أول مبنى للبدء، وستكون بيانات كل مبنى مستقلة عن المباني الأخرى." />}
      renderItem={({ item }) => <View style={styles.buildingManageCard}>
        <Pressable style={({ pressed }) => [styles.buildingCard, pressed && styles.pressed]} onPress={() => onSelect(item)}>
          <View style={styles.buildingIcon}><Ionicons name="business" size={28} color="#0f766e" /></View>
          <View style={styles.flex1}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>{displayTextDates([item.city, item.district].filter(Boolean).join(' - ') || 'بدون موقع')}</Text>
            <Text style={styles.buildingMetaText}>الشقق: {item.apartments_count ?? 0} · الملاك: {item.owners_count ?? 0}</Text>
          </View>
          <Ionicons name="chevron-back" size={22} color="#64748b" />
        </Pressable>
        {canManage ? <View style={styles.buildingActionsRow}>
          <Pressable onPress={() => openEdit(item)} style={({ pressed }) => [styles.buildingEditButton, pressed && styles.pressed]}>
            <Ionicons name="create-outline" size={18} color="#0f766e" />
            <Text style={styles.buildingEditButtonText}>تعديل</Text>
          </Pressable>
          <Pressable onPress={() => deleteBuilding(item)} style={({ pressed }) => [styles.buildingDeleteButton, pressed && styles.pressed]}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text style={styles.buildingDeleteButtonText}>حذف</Text>
          </Pressable>
        </View> : null}
      </View>}
    />

    <Modal visible={formVisible} transparent animationType="fade" onRequestClose={() => setFormVisible(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFormVisible(false)} />
        <View style={styles.floatingFormCard}>
          <View style={styles.floatingFormHeader}>
            <Pressable onPress={() => setFormVisible(false)} style={styles.closeFloatingBtn}><Ionicons name="close" size={22} color="#0f172a" /></Pressable>
            <View style={styles.flex1}>
              <Text style={styles.floatingFormTitle}>{editingBuilding ? 'تعديل المبنى' : 'إضافة مبنى'}</Text>
              <Text style={styles.ownerMeta}>كل بيانات وحسابات هذا المبنى ستكون مستقلة عن بقية المباني</Text>
            </View>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.floatingFormBody}>
            <Field label="اسم المبنى" value={name} onChangeText={setName} placeholder="مثال: مبنى الورود 12" />
            <Field label="المدينة" value={city} onChangeText={setCity} placeholder="مثال: جدة" />
            <Field label="الحي" value={district} onChangeText={setDistrict} placeholder="مثال: الصفا" />
            <Field label="العنوان" value={address} onChangeText={setAddress} placeholder="العنوان التفصيلي - اختياري" />
            <Field label="عدد الشقق" value={apartmentCount} onChangeText={setApartmentCount} keyboardType="numeric" placeholder="0" />
            <DatePickerField label="بداية الدورة السنوية" value={annualCycleStartsOn} onChange={setAnnualCycleStartsOn} />
            <PrimaryButton title={editingBuilding ? 'حفظ التعديل' : 'إضافة المبنى'} icon="save-outline" onPress={saveBuilding} loading={saving} />
            <PrimaryButton title="إلغاء" icon="close-outline" onPress={() => setFormVisible(false)} variant="light" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </SafeAreaView>;
}
function Dashboard({ dashboard }) {
  const stats = dashboard?.stats || {};
  return <ScrollView contentContainerStyle={styles.screenContent}><View style={styles.heroCard}><View style={styles.heroIcon}><MaterialCommunityIcons name="home-city-outline" size={30} color="#fff" /></View><View style={styles.flex1}><Text style={styles.heroTitle}>{dashboard?.building?.name || 'المبنى'}</Text><Text style={styles.heroSub}>كل مبنى مستقل ببياناته ومصروفاته وأرصدته</Text></View></View><View style={styles.statsGrid}><Stat icon="cash-outline" title="إجمالي المدفوعات" value={money(stats.total_payments)} /><Stat icon="receipt-outline" title="إجمالي المصروفات" value={money(stats.total_expenses)} /><Stat icon="wallet-outline" title="رصيد المبنى" value={money(stats.building_balance)} /><Stat icon="business-outline" title="عدد الشقق" value={stats.apartment_count || 0} /><Stat icon="calendar-outline" title="بداية الدورة" value={displayDate(dashboard?.building?.annual_cycle_starts_on)} /><Stat icon="alert-circle-outline" title="شقق غير مدخلة" value={stats.unassigned_apartment_count || 0} /></View>{stats.unassigned_apartment_count > 0 ? <View style={styles.warningCard}><Text style={styles.warningTitle}>شقق تحتاج إكمال بيانات</Text><Text style={styles.warningText}>عددها: {stats.unassigned_apartment_count} - مبلغها التقديري: {money(stats.unassigned_apartment_amount)}</Text><Text style={styles.warningText}>الأرقام: {(stats.unassigned_apartments || []).join('، ') || '-'}</Text></View> : null}<SectionTitle icon="people-outline" title="ملخص الملاك" />{sortOwnersByApartment(dashboard?.owners || []).map((owner) => <OwnerCard key={owner.id} owner={owner} />)}</ScrollView>;
}
function Stat({ icon, title, value }) { return <View style={styles.statCard}><View style={styles.statIconWrap}><Ionicons name={icon} size={22} color="#0f766e" /></View><Text style={styles.statTitle}>{title}</Text><Text style={styles.statValue}>{value}</Text></View>; }
function OwnerCard({ owner }) { const isDue = owner.status === 'due'; const isSurplus = owner.status === 'surplus'; return <View style={styles.ownerCard}><View style={styles.ownerTop}><View style={styles.ownerAvatar}><MaterialCommunityIcons name="account-circle-outline" size={22} color="#0f766e" /></View><View style={styles.flex1}><Text style={styles.cardTitle}>{owner.name}</Text><Text style={styles.cardSub}>الشقق: {sortApartmentNumbers(owner.apartments).join('، ') || '-'}</Text></View><View style={[styles.badge, isDue ? styles.badgeDue : isSurplus ? styles.badgeSurplus : styles.badgeBalanced]}><Text style={styles.badgeText}>{isDue ? 'عليه مبلغ' : isSurplus ? 'له فائض' : 'متعادل'}</Text></View></View><View style={styles.ownerAmounts}><SmallAmount title="دفعاته" value={money(owner.total_payments)} /><SmallAmount title="نصيبه" value={money(owner.expense_share)} /><SmallAmount title="المتبقي" value={money(owner.unpaid_amount)} /><SmallAmount title="الرصيد" value={money(owner.balance)} /></View></View>; }
function SmallAmount({ title, value }) { return <View style={styles.smallAmount}><Text style={styles.smallTitle}>{title}</Text><Text style={styles.smallValue}>{value}</Text></View>; }
function ExpenseRow({ item, onShowNote, onShowAttachments, onEdit, onDelete }) {
  const hasNote = Boolean(String(item.description || '').trim());
  const attachments = Array.isArray(item.attachments) ? item.attachments : [];
  return <View style={styles.expenseCompactCard}><View style={styles.expenseInfo}><View style={styles.expenseMainLine}><Text style={styles.expenseDateText}>{displayDate(item.expense_date)}</Text><Text style={styles.amountText}>{money(item.amount)}</Text></View></View><View style={styles.expenseIconActions}>{attachments.length > 0 ? <Pressable accessibilityLabel="عرض مرفقات المصروف" onPress={() => onShowAttachments(item)} style={({ pressed }) => [styles.expenseIconBtn, styles.expenseAttachmentIconBtn, pressed && styles.pressed]}><Ionicons name="attach-outline" size={19} color="#7c3aed" /><View style={styles.expenseAttachmentBadge}><Text style={styles.expenseAttachmentBadgeText}>{attachments.length}</Text></View></Pressable> : null}<Pressable accessibilityLabel="ملاحظة المصروف" onPress={() => onShowNote(item)} style={({ pressed }) => [styles.expenseIconBtn, !hasNote && styles.expenseIconBtnMuted, pressed && styles.pressed]}><Ionicons name={hasNote ? "chatbubble-ellipses-outline" : "chatbubble-outline"} size={19} color={hasNote ? '#64748b' : '#cbd5e1'} /></Pressable><Pressable accessibilityLabel="تعديل المصروف" onPress={() => onEdit(item)} style={({ pressed }) => [styles.expenseIconBtn, styles.expenseEditIconBtn, pressed && styles.pressed]}><Ionicons name="create-outline" size={19} color="#0f766e" /></Pressable><Pressable accessibilityLabel="حذف المصروف" onPress={() => onDelete(item)} style={({ pressed }) => [styles.expenseIconBtn, styles.expenseDeleteIconBtn, pressed && styles.pressed]}><Ionicons name="trash-outline" size={19} color="#ef4444" /></Pressable></View></View>;
}

function categoryNames(categories) {
  const names = (categories || []).map((item) => item?.name || item).filter(Boolean);
  return names.length ? names : DEFAULT_EXPENSE_CATEGORIES;
}
function ExpensesScreen({ token, buildingId, expenses, categories, reload }) {
  const options = categoryNames(categories);
  const [expenseFormVisible, setExpenseFormVisible] = useState(false);
  const [category, setCategory] = useState(options[0]);
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayDate());
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [typeFormVisible, setTypeFormVisible] = useState(false);
  const [typeSelection, setTypeSelection] = useState('');
  const [typeNotes, setTypeNotes] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [typeSaving, setTypeSaving] = useState(false);

  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState(null);
  const [expenseCategoryDetailsVisible, setExpenseCategoryDetailsVisible] = useState(false);
  const [editExpenseVisible, setEditExpenseVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editCategory, setEditCategory] = useState(options[0]);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState(todayDate());
  const [editDescription, setEditDescription] = useState('');
  const [editNewAttachments, setEditNewAttachments] = useState([]);
  const [attachmentsVisible, setAttachmentsVisible] = useState(false);
  const [attachmentExpense, setAttachmentExpense] = useState(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null);
  const [savingExpense, setSavingExpense] = useState(false);

  useEffect(() => {
    if (!options.includes(category)) setCategory(options[0]);
    if (!options.includes(editCategory)) setEditCategory(options[0]);
  }, [options.join('|')]);

  const groupedExpenses = useMemo(() => {
    const groups = {};
    const metaByName = {};

    (categories || []).forEach((item) => {
      const name = item?.name || item;
      if (!name) return;
      metaByName[name] = item;
      if (item?.is_active) {
        groups[name] = {
          category: name,
          categoryId: item.id,
          notes: item.notes || '',
          total: 0,
          count: 0,
          items: [],
        };
      }
    });

    (expenses || []).forEach((item) => {
      const key = item.category || 'أخرى';
      const meta = metaByName[key];
      if (!groups[key]) {
        groups[key] = {
          category: key,
          categoryId: meta?.id,
          notes: meta?.notes || '',
          total: 0,
          count: 0,
          items: [],
        };
      }
      groups[key].total += Number(item.amount || 0);
      groups[key].count += 1;
      groups[key].items.push(item);
    });

    return Object.values(groups).sort((a, b) => (b.total - a.total) || a.category.localeCompare(b.category, 'ar'));
  }, [expenses, categories]);

  const totalExpensesAmount = useMemo(() => groupedExpenses.reduce((sum, group) => sum + Number(group.total || 0), 0), [groupedExpenses]);

  const resetAddExpenseForm = () => {
    setAmount('');
    setExpenseDate(todayDate());
    setDescription('');
    setAttachments([]);
  };
  const closeAddExpenseForm = () => {
    resetAddExpenseForm();
    setExpenseFormVisible(false);
  };
  const openAddExpenseForCategory = (categoryName) => {
    setCategory(categoryName);
    resetAddExpenseForm();
    setExpenseFormVisible(true);
  };
  const openAddFromSelectedCategory = () => {
    const categoryName = selectedExpenseCategory?.category;
    if (!categoryName) return;
    setExpenseCategoryDetailsVisible(false);
    openAddExpenseForCategory(categoryName);
  };

  const openTypeForm = () => {
    setTypeSelection('');
    setTypeNotes('');
    setNewTypeName('');
    setTypeFormVisible(true);
  };
  const closeTypeForm = () => {
    setTypeFormVisible(false);
    setTypeSelection('');
    setTypeNotes('');
    setNewTypeName('');
  };
  const chooseType = (value) => {
    setTypeSelection(value);
    setNewTypeName('');
    if (value === '__other__') {
      setTypeNotes('');
      return;
    }
    const record = (categories || []).find((item) => (item?.name || item) === value);
    setTypeNotes(record?.notes || '');
  };
  const saveType = async () => {
    if (!typeSelection) return Alert.alert('تنبيه', 'اختر نوع الصرف');
    try {
      setTypeSaving(true);
      if (typeSelection === '__other__') {
        const name = newTypeName.trim();
        if (!name) return Alert.alert('تنبيه', 'أدخل اسم نوع الصرف الجديد');
        await request(`/buildings/${buildingId}/expense-categories`, {
          method: 'POST',
          body: JSON.stringify({ name, notes: typeNotes.trim() }),
        }, token);
      } else {
        const record = (categories || []).find((item) => (item?.name || item) === typeSelection);
        if (!record?.id) return Alert.alert('تعذر الحفظ', 'لم يتم العثور على نوع الصرف');
        await request(`/buildings/${buildingId}/expense-categories/${record.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: record.name, notes: typeNotes.trim(), is_active: true }),
        }, token);
      }
      closeTypeForm();
      await reload();
    } catch (e) {
      Alert.alert('تعذر حفظ نوع الصرف', e.message);
    } finally {
      setTypeSaving(false);
    }
  };

  const pickExpenseFiles = async (existingFiles, pendingFiles, setPendingFiles) => {
    try {
      const result = await ExpoFile.pickFileAsync({
        multipleFiles: true,
        mimeTypes: ['image/*', 'application/pdf'],
      });
      if (result?.canceled || !result?.result) return;

      const picked = (Array.isArray(result.result) ? result.result : [result.result])
        .filter(Boolean)
        .map((file) => ({ file, displayName: '' }));
      if (!picked.length) return;

      const combined = [...(existingFiles || []), ...(pendingFiles || []), ...picked];
      const pdfCount = combined.filter(isPdfAttachment).length;
      const imageCount = combined.length - pdfCount;

      if (pdfCount > 0 && imageCount > 0) {
        return Alert.alert('المرفقات', 'يمكن إضافة صورتين أو ملف PDF واحد فقط، ولا يمكن الجمع بين الصور وملف PDF.');
      }
      if (pdfCount > 1) return Alert.alert('المرفقات', 'يمكن إضافة ملف PDF واحد فقط.');
      if (imageCount > 2) return Alert.alert('المرفقات', 'الحد الأقصى صورتان لكل مصروف.');

      setPendingFiles([...(pendingFiles || []), ...picked]);
    } catch (error) {
      Alert.alert('تعذر اختيار المرفق', error.message || 'حدث خطأ أثناء اختيار الملف');
    }
  };

  const uploadExpenseFiles = async (expenseId, files) => {
    if (!expenseId || !files?.length) return;
    const formData = new FormData();
    files.forEach((item, index) => {
      const file = attachmentFileSource(item);
      const name = file?.name || `expense-attachment-${index + 1}`;
      if (Platform.OS === 'web' && file?.file) {
        formData.append('attachments[]', file.file, name);
      } else {
        formData.append('attachments[]', file, name);
      }
      formData.append('display_names[]', String(item?.displayName || '').trim());
    });
    await requestFormData(`/buildings/${buildingId}/expenses/${expenseId}/attachments`, formData, token);
  };

  const openExpenseAttachments = (item) => {
    setAttachmentExpense(item);
    setDeletingAttachmentId(null);
    setAttachmentsVisible(true);
  };

  const deleteExpenseAttachment = (attachment) => {
    if (!attachmentExpense?.id || !attachment?.id) return;
    const attachmentIndex = (attachmentExpense?.attachments || []).findIndex((item) => item.id === attachment.id);
    const displayName = attachmentDisplayName(attachment, attachmentIndex >= 0 ? attachmentIndex : 0);

    Alert.alert(
      'حذف المرفق',
      `هل أنت متأكد من حذف "${displayName}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingAttachmentId(attachment.id);
              const response = await request(
                `/buildings/${buildingId}/expenses/${attachmentExpense.id}/attachments/${attachment.id}`,
                { method: 'DELETE' },
                token
              );
              const updatedExpense = response?.data || {
                ...attachmentExpense,
                attachments: (attachmentExpense.attachments || []).filter((item) => item.id !== attachment.id),
              };

              setAttachmentExpense(updatedExpense);
              setSelectedExpenseCategory((current) => current ? {
                ...current,
                items: (current.items || []).map((item) => item.id === updatedExpense.id ? updatedExpense : item),
              } : current);
              setEditingExpense((current) => current?.id === updatedExpense.id ? updatedExpense : current);
              await reload();
            } catch (error) {
              Alert.alert('تعذر حذف المرفق', error.message || 'حدث خطأ أثناء حذف المرفق');
            } finally {
              setDeletingAttachmentId(null);
            }
          },
        },
      ]
    );
  };

  const add = async () => {
    const apiDate = normalizeDateForApi(expenseDate);
    if (!amount) return Alert.alert('تنبيه', 'أدخل مبلغ المصروف');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(apiDate)) return Alert.alert('تنبيه', 'اختر تاريخ المصروف');
    try {
      setLoading(true);
      const created = await request(`/buildings/${buildingId}/expenses`, {
        method: 'POST',
        body: JSON.stringify({ category, amount: Number(amount), expense_date: apiDate, description }),
      }, token);
      let attachmentWarning = '';
      if (attachments.length > 0) {
        try {
          await uploadExpenseFiles(created?.data?.id, attachments);
        } catch (error) {
          attachmentWarning = error.message || 'تعذر رفع المرفقات';
        }
      }
      closeAddExpenseForm();
      await reload();
      if (attachmentWarning) Alert.alert('تم حفظ المصروف', `تم حفظ المصروف، لكن تعذر رفع المرفقات: ${attachmentWarning}`);
    } catch (e) {
      Alert.alert('تعذر إضافة المصروف', e.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditExpense = (item) => {
    setEditingExpense(item);
    setEditCategory(item.category || options[0]);
    setEditAmount(String(item.amount || ''));
    setEditDate(normalizeDateForApi(item.expense_date || todayDate()));
    setEditDescription(item.description || '');
    setEditNewAttachments([]);
    setEditExpenseVisible(true);
  };
  const saveExpense = async () => {
    const apiDate = normalizeDateForApi(editDate);
    if (!editingExpense) return;
    if (!editAmount) return Alert.alert('تنبيه', 'أدخل مبلغ المصروف');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(apiDate)) return Alert.alert('تنبيه', 'اختر تاريخ المصروف');
    try {
      setSavingExpense(true);
      await request(`/buildings/${buildingId}/expenses/${editingExpense.id}`, {
        method: 'PUT',
        body: JSON.stringify({ category: editCategory, amount: Number(editAmount), expense_date: apiDate, description: editDescription }),
      }, token);
      let attachmentWarning = '';
      if (editNewAttachments.length > 0) {
        try {
          await uploadExpenseFiles(editingExpense.id, editNewAttachments);
        } catch (error) {
          attachmentWarning = error.message || 'تعذر رفع المرفقات';
        }
      }
      setEditExpenseVisible(false);
      setExpenseCategoryDetailsVisible(false);
      await reload();
      if (attachmentWarning) Alert.alert('تم حفظ التعديل', `تم تعديل المصروف، لكن تعذر رفع المرفقات: ${attachmentWarning}`);
    } catch (e) {
      Alert.alert('تعذر تعديل المصروف', e.message);
    } finally {
      setSavingExpense(false);
    }
  };
  const deleteExpense = (item) => Alert.alert('حذف المصروف', 'هل تريد حذف هذا المصروف؟', [
    { text: 'إلغاء', style: 'cancel' },
    {
      text: 'حذف',
      style: 'destructive',
      onPress: async () => {
        try {
          await request(`/buildings/${buildingId}/expenses/${item.id}`, { method: 'DELETE' }, token);
          setExpenseCategoryDetailsVisible(false);
          await reload();
        } catch (e) {
          Alert.alert('تعذر حذف المصروف', e.message);
        }
      },
    },
  ]);
  const showExpenseNote = (item) => {
    const note = displayTextDates(item.description || '').trim();
    Alert.alert('ملاحظة المصروف', note || 'لا توجد ملاحظة لهذا المصروف.');
  };

  return <View style={styles.screenWrapper}>
    <ScrollView contentContainerStyle={[styles.screenContent, styles.expensesScreenContent]}>
      <ScreenCode code="#S-004" style={styles.expensesScreenCodeBadge} />
      <View style={styles.expenseSummaryCard}>
        <View style={styles.expenseSummaryMain}>
          <Text style={styles.expenseSummaryLabel}>إجمالي المصروفات</Text>
          <Text style={styles.expenseSummaryAmount}>{money(totalExpensesAmount)}</Text>
          <Text style={styles.expenseSummaryMeta}>عدد أنواع الصرف: {groupedExpenses.length}</Text>
        </View>
        <Pressable accessibilityLabel="إضافة نوع صرف" onPress={openTypeForm} style={({ pressed }) => [styles.expenseSummaryAddBtn, pressed && styles.pressed]}>
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      </View>
      {groupedExpenses.length === 0 ? <EmptyState icon="receipt-outline" title="لا توجد أنواع صرف" text="اضغط زر + لإضافة نوع صرف للمبنى." /> : null}
      {groupedExpenses.map((group) => <Pressable key={group.category} accessibilityLabel={`عرض مصروفات ${group.category}`} onPress={() => { setSelectedExpenseCategory(group); setExpenseCategoryDetailsVisible(true); }} style={({ pressed }) => [styles.rowCard, pressed && styles.pressed]}>
        <View style={styles.rowIcon}><Ionicons name="folder-open-outline" size={20} color="#f97316" /></View>
        <View style={styles.flex1}>
          <Text style={styles.cardTitle}>{group.category}</Text>
          {group.notes ? <Text style={styles.categoryTypeNote} numberOfLines={1}>{group.notes}</Text> : null}
        </View>
        <Text style={styles.amountText}>{money(group.total)}</Text>
      </Pressable>)}
    </ScrollView>

    <ExpenseTypeFormModal
      visible={typeFormVisible}
      onClose={closeTypeForm}
      categories={categories}
      activeCategoryNames={groupedExpenses.map((group) => group.category)}
      selection={typeSelection}
      onSelect={chooseType}
      notes={typeNotes}
      setNotes={setTypeNotes}
      newTypeName={newTypeName}
      setNewTypeName={setNewTypeName}
      onSave={saveType}
      loading={typeSaving}
    />

    <Modal visible={expenseCategoryDetailsVisible} transparent animationType="fade" onRequestClose={() => setExpenseCategoryDetailsVisible(false)}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={() => setExpenseCategoryDetailsVisible(false)} />
        <View style={styles.floatingFormCard}>
          <View style={styles.floatingFormHeader}>
            <Pressable onPress={() => setExpenseCategoryDetailsVisible(false)} style={styles.closeFloatingBtn}><Ionicons name="close" size={22} color="#0f172a" /></Pressable>
            <Pressable accessibilityLabel={`إضافة مصروف إلى ${selectedExpenseCategory?.category || 'التصنيف'}`} onPress={openAddFromSelectedCategory} style={({ pressed }) => [styles.categoryModalAddBtn, pressed && styles.pressed]}><Ionicons name="add" size={24} color="#fff" /></Pressable>
            <View style={styles.flex1}>
              <Text style={styles.floatingFormTitle}>{selectedExpenseCategory?.category || 'تفاصيل التصنيف'}</Text>
              <Text style={styles.ownerMeta}>الإجمالي: {money(selectedExpenseCategory?.total)} - عدد العمليات: {selectedExpenseCategory?.count || 0}</Text>
              {selectedExpenseCategory?.notes ? <Text style={styles.categoryTypeNote}>{selectedExpenseCategory.notes}</Text> : null}
            </View>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.floatingFormBody}>
            {(selectedExpenseCategory?.items || []).length === 0 ? <EmptyState icon="receipt-outline" title="لا توجد مصروفات" text="اضغط زر + لإضافة أول مصروف لهذا النوع." /> : null}
            {(selectedExpenseCategory?.items || []).map((item) => <ExpenseRow key={item.id} item={item} onShowNote={showExpenseNote} onShowAttachments={openExpenseAttachments} onEdit={startEditExpense} onDelete={deleteExpense} />)}
          </ScrollView>
        </View>
      </View>
    </Modal>

    <Modal visible={attachmentsVisible} transparent animationType="fade" onRequestClose={() => setAttachmentsVisible(false)}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={() => setAttachmentsVisible(false)} />
        <View style={styles.floatingFormCard}>
          <View style={styles.floatingFormHeader}>
            <Pressable onPress={() => setAttachmentsVisible(false)} style={styles.closeFloatingBtn}><Ionicons name="close" size={22} color="#0f172a" /></Pressable>
            <View style={styles.flex1}>
              <Text style={styles.floatingFormTitle}>مرفقات المصروف</Text>
              <Text style={styles.ownerMeta}>{displayDate(attachmentExpense?.expense_date)} - {money(attachmentExpense?.amount)}</Text>
            </View>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.floatingFormBody}>
            {(attachmentExpense?.attachments || []).length === 0 ? <EmptyState icon="attach-outline" title="لا توجد مرفقات" text="تم حذف جميع مرفقات هذا المصروف." /> : null}
            {(attachmentExpense?.attachments || []).map((attachment) => {
              const url = expenseAttachmentUrl(attachment.url);
              const pdf = isPdfAttachment(attachment);
              const isDeleting = deletingAttachmentId === attachment.id;
              return <View key={attachment.id} style={styles.expenseAttachmentViewerCard}>
                <Pressable
                  accessibilityLabel="حذف المرفق"
                  disabled={isDeleting}
                  onPress={() => deleteExpenseAttachment(attachment)}
                  style={({ pressed }) => [styles.expenseAttachmentDeleteBtn, pressed && styles.pressed]}
                >
                  {isDeleting ? <ActivityIndicator size="small" color="#ef4444" /> : <Ionicons name="trash-outline" size={19} color="#ef4444" />}
                </Pressable>
                {pdf
                  ? <Pressable onPress={() => Linking.openURL(url)} style={({ pressed }) => [styles.expensePdfOpenBtn, pressed && styles.pressed]}>
                      <Ionicons name="document-text-outline" size={28} color="#dc2626" />
                      <View style={styles.flex1}><Text style={styles.expenseAttachmentName} numberOfLines={2}>{attachmentDisplayName(attachment, (attachmentExpense?.attachments || []).indexOf(attachment))}</Text><Text style={styles.expenseAttachmentHint}>اضغط لفتح ملف PDF</Text></View>
                    </Pressable>
                  : <Pressable onPress={() => Linking.openURL(url)} style={({ pressed }) => [pressed && styles.pressed]}>
                      <Image source={{ uri: url }} style={styles.expenseAttachmentImage} resizeMode="contain" />
                      <Text style={styles.expenseAttachmentName} numberOfLines={2}>{attachmentDisplayName(attachment, (attachmentExpense?.attachments || []).indexOf(attachment))}</Text>
                    </Pressable>}
              </View>;
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>

    <ExpenseFormModal
      visible={expenseFormVisible}
      onClose={closeAddExpenseForm}
      title="إضافة مصروف"
      categories={options}
      category={category}
      setCategory={setCategory}
      categoryLocked
      amount={amount}
      setAmount={setAmount}
      dateValue={expenseDate}
      setDateValue={setExpenseDate}
      description={description}
      setDescription={setDescription}
      attachments={attachments}
      existingAttachments={[]}
      onPickAttachments={() => pickExpenseFiles([], attachments, setAttachments)}
      onRemoveAttachment={(index) => setAttachments((items) => items.filter((_, i) => i !== index))}
      onRenameAttachment={(index, value) => setAttachments((items) => items.map((item, i) => i === index ? { ...item, displayName: value } : item))}
      onSave={add}
      loading={loading}
      saveTitle="حفظ المصروف"
    />

    <ExpenseFormModal
      visible={editExpenseVisible}
      onClose={() => setEditExpenseVisible(false)}
      title="تعديل المصروف"
      categories={options}
      category={editCategory}
      setCategory={setEditCategory}
      categoryLocked
      amount={editAmount}
      setAmount={setEditAmount}
      dateValue={editDate}
      setDateValue={setEditDate}
      description={editDescription}
      setDescription={setEditDescription}
      attachments={editNewAttachments}
      existingAttachments={editingExpense?.attachments || []}
      onPickAttachments={() => pickExpenseFiles(editingExpense?.attachments || [], editNewAttachments, setEditNewAttachments)}
      onRemoveAttachment={(index) => setEditNewAttachments((items) => items.filter((_, i) => i !== index))}
      onRenameAttachment={(index, value) => setEditNewAttachments((items) => items.map((item, i) => i === index ? { ...item, displayName: value } : item))}
      onSave={saveExpense}
      loading={savingExpense}
      saveTitle="حفظ التعديل"
    />
  </View>;
}

function ExpenseTypeFormModal({ visible, onClose, categories, activeCategoryNames = [], selection, onSelect, notes, setNotes, newTypeName, setNewTypeName, onSave, loading }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  useEffect(() => { if (!visible) setDropdownOpen(false); }, [visible]);

  const activeNames = new Set(activeCategoryNames || []);
  const typeOptions = (categories || [])
    .map((item) => ({ id: item?.id, name: item?.name || item, notes: item?.notes || '', isActive: Boolean(item?.is_active) }))
    .filter((item) => item.name && item.name !== 'أخرى' && !item.isActive && !activeNames.has(item.name));
  const selectedLabel = selection === '__other__' ? 'أخرى' : selection || 'اختر نوع الصرف';

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalRoot}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.floatingFormCard}>
        <View style={styles.floatingFormHeader}>
          <Pressable onPress={onClose} style={styles.closeFloatingBtn}><Ionicons name="close" size={22} color="#0f172a" /></Pressable>
          <View style={styles.flex1}>
            <Text style={styles.floatingFormTitle}>إضافة نوع صرف</Text>
            <Text style={styles.ownerMeta}>نوع الصرف وملاحظاته فقط</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.floatingFormBody}>
          <Text style={styles.label}>نوع الصرف</Text>
          <Pressable onPress={() => setDropdownOpen((current) => !current)} style={({ pressed }) => [styles.typeDropdownField, pressed && styles.pressed]}>
            <Ionicons name={dropdownOpen ? "chevron-up-outline" : "chevron-down-outline"} size={20} color="#0f766e" />
            <Text style={[styles.typeDropdownText, !selection && styles.datePlaceholder]}>{selectedLabel}</Text>
          </Pressable>

          {dropdownOpen ? <View style={styles.typeDropdownMenu}>
            {typeOptions.map((item) => <Pressable key={String(item.id || item.name)} onPress={() => { onSelect(item.name); setDropdownOpen(false); }} style={({ pressed }) => [styles.typeDropdownItem, selection === item.name && styles.typeDropdownItemActive, pressed && styles.pressed]}>
              <Text style={[styles.typeDropdownItemText, selection === item.name && styles.typeDropdownItemTextActive]}>{item.name}</Text>
              {selection === item.name ? <Ionicons name="checkmark" size={18} color="#0f766e" /> : null}
            </Pressable>)}
            <Pressable onPress={() => { onSelect('__other__'); setDropdownOpen(false); }} style={({ pressed }) => [styles.typeDropdownItem, styles.typeDropdownOther, selection === '__other__' && styles.typeDropdownItemActive, pressed && styles.pressed]}>
              <Text style={[styles.typeDropdownItemText, selection === '__other__' && styles.typeDropdownItemTextActive]}>أخرى</Text>
              <Ionicons name="add-circle-outline" size={19} color="#0f766e" />
            </Pressable>
          </View> : null}

          {selection === '__other__' ? <Field label="اسم نوع الصرف الجديد" value={newTypeName} onChangeText={setNewTypeName} placeholder="مثال: مكافحة حشرات" /> : null}
          <Field label="ملاحظات" value={notes} onChangeText={setNotes} placeholder="ملاحظات على نوع الصرف - اختياري" multiline />

          <PrimaryButton title="حفظ نوع الصرف" icon="save-outline" onPress={onSave} loading={loading} />
          <PrimaryButton title="إلغاء" icon="close-outline" onPress={onClose} variant="light" />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

function ExpenseFormModal({ visible, onClose, title, categories, category, setCategory, categoryLocked = false, amount, setAmount, dateValue, setDateValue, description, setDescription, attachments = [], existingAttachments = [], onPickAttachments, onRemoveAttachment, onRenameAttachment, onSave, loading, saveTitle }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalRoot}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.floatingFormCard}>
        <View style={styles.floatingFormHeader}>
          <Pressable onPress={onClose} style={styles.closeFloatingBtn}><Ionicons name="close" size={22} color="#0f172a" /></Pressable>
          <View style={styles.flex1}>
            <Text style={styles.screenCodeText}>{title === 'إضافة مصروف' ? '#S-010' : '#S-011'}</Text>
            <Text style={styles.floatingFormTitle}>{title}</Text>
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.floatingFormBody}>
          <Text style={styles.label}>نوع الصرف</Text>
          {categoryLocked
            ? <View style={styles.lockedCategoryField}><Ionicons name="lock-closed-outline" size={18} color="#0f766e" /><Text style={styles.lockedCategoryText}>{category}</Text></View>
            : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>{(categories || DEFAULT_EXPENSE_CATEGORIES).map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}><Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text></Pressable>)}</ScrollView>}
          <Field label="المبلغ" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" />
          <DatePickerField label="تاريخ المصروف" value={dateValue} onChange={setDateValue} />
          <Field label="ملاحظة" value={description} onChangeText={setDescription} placeholder="وصف المصروف" multiline />
          <Text style={styles.label}>المرفقات</Text>
          <Pressable accessibilityLabel="إضافة مرفق للمصروف" onPress={onPickAttachments} style={({ pressed }) => [styles.expenseAttachmentPicker, pressed && styles.pressed]}>
            <Ionicons name="attach-outline" size={23} color="#7c3aed" />
            <View style={styles.flex1}>
              <Text style={styles.expenseAttachmentPickerTitle}>إضافة صورتين أو ملف PDF</Text>
              <Text style={styles.expenseAttachmentHint}>الحد الأعلى: صورتان أو ملف PDF واحد، حتى 10 م.ب للملف</Text>
            </View>
          </Pressable>
          {existingAttachments.length > 0 ? <View style={styles.expenseExistingAttachments}><Ionicons name="checkmark-circle-outline" size={18} color="#0f766e" /><Text style={styles.expenseExistingAttachmentsText}>المرفقات المحفوظة: {existingAttachments.length}</Text></View> : null}
          {attachments.map((attachment, index) => {
            const source = attachmentFileSource(attachment);
            return <View key={`${source?.uri || source?.name || 'attachment'}-${index}`} style={styles.expenseSelectedAttachment}>
              <View style={styles.expenseSelectedAttachmentTop}>
                <Ionicons name={isPdfAttachment(attachment) ? "document-text-outline" : "image-outline"} size={20} color={isPdfAttachment(attachment) ? "#dc2626" : "#0f766e"} />
                <Text style={styles.expenseSelectedAttachmentName} numberOfLines={1}>{attachmentDisplayName(attachment, index)}</Text>
                <Pressable accessibilityLabel="إزالة المرفق" onPress={() => onRemoveAttachment?.(index)} style={styles.expenseAttachmentRemoveBtn}><Ionicons name="close" size={17} color="#ef4444" /></Pressable>
              </View>
              <TextInput
                value={attachment.displayName || ''}
                onChangeText={(value) => onRenameAttachment?.(index, value)}
                placeholder={`اسم المرفق (اختياري) - مثال: فاتورة ${index + 1}`}
                placeholderTextColor="#94a3b8"
                style={styles.expenseAttachmentNameInput}
                textAlign="right"
                maxLength={120}
              />
            </View>;
          })}
          <PrimaryButton title={saveTitle} icon="save-outline" onPress={onSave} loading={loading} />
          <PrimaryButton title="إلغاء" icon="close-outline" onPress={onClose} variant="light" />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

function ExpenseCategoriesScreen({ token, buildingId, categories, reload, user }) {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const reset = () => { setName(''); setEditing(null); };
  const save = async () => {
    const value = name.trim();
    if (!value) return Alert.alert('تنبيه', 'أدخل اسم التصنيف');
    try {
      setLoading(true);
      await request(`/buildings/${buildingId}/expense-categories${editing ? `/${editing.id}` : ''}`, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(editing ? { name: value } : { name: value, base_type: true }) }, token);
      reset();
      await reload();
    } catch (e) {
      Alert.alert('تعذر حفظ التصنيف', e.message);
    } finally {
      setLoading(false);
    }
  };
  const remove = (item) => Alert.alert('حذف التصنيف', `هل تريد حذف تصنيف ${item.name}؟ لن يتم حذف المصروفات السابقة التي تحمل نفس الاسم.`, [{ text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: async () => { try { await request(`/buildings/${buildingId}/expense-categories/${item.id}`, { method: 'DELETE' }, token); if (editing?.id === item.id) reset(); await reload(); } catch (e) { Alert.alert('تعذر حذف التصنيف', e.message); } } }]);
  if (user?.role !== 'admin') return <ScrollView contentContainerStyle={styles.screenContent}><EmptyState icon="lock-closed-outline" title="غير متاح" text="إدارة الأنواع الأساسية للصرف متاحة للـ admin فقط." /></ScrollView>;
  return <ScrollView contentContainerStyle={styles.screenContent}><ScreenCode code="#S-007" /><SectionTitle icon="pricetags-outline" title="الأنواع الأساسية للصرف" /><Text style={styles.settingsHint}>تضاف هنا الأنواع الأساسية بواسطة admin، ثم تظهر للمستخدم ضمن قائمة اختيار نوع الصرف إذا لم تكن مستخدمة مسبقًا.</Text><View style={styles.formCard}><Field label={editing ? 'تعديل اسم النوع' : 'إضافة نوع أساسي جديد'} value={name} onChangeText={setName} placeholder="مثال: صيانة المصعد" /><PrimaryButton title={editing ? 'حفظ التعديل' : 'إضافة النوع الأساسي'} icon="save-outline" onPress={save} loading={loading} />{editing ? <PrimaryButton title="إلغاء التعديل" icon="close-outline" onPress={reset} variant="light" /> : null}</View><SectionTitle icon="list-outline" title="الأنواع الحالية" />{(categories || []).length === 0 ? <EmptyState icon="pricetags-outline" title="لا توجد تصنيفات" text="أضف أول تصنيف ليظهر في شاشة إضافة المصروف." /> : null}{(categories || []).map((item) => <View key={item.id || item.name} style={styles.manageOwnerCard}><View style={styles.rowCard}><View style={styles.rowIcon}><Ionicons name="pricetag-outline" size={20} color="#0f766e" /></View><View style={styles.flex1}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.cardSub}>{item.is_active ? 'مستخدم حاليًا في شاشة المصروفات' : 'متاح للاختيار من قائمة أنواع الصرف'}</Text></View></View><View style={styles.actionsRow}><Pressable style={styles.actionBtn} onPress={() => { setEditing(item); setName(item.name); }}><Ionicons name="create-outline" size={18} color="#0f766e" /><Text style={styles.actionText}>تعديل</Text></Pressable><Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => remove(item)}><Ionicons name="trash-outline" size={18} color="#ef4444" /><Text style={[styles.actionText, styles.deleteText]}>حذف</Text></Pressable></View></View>)}</ScrollView>;
}

const emptyOwnerForm = { name: '', phone: '', national_id: '', email: '', notes: '' };

function ApartmentOwnerCard({ apartment, onEdit, onPayments }) {
  const owner = apartment?.owner;
  const isDue = owner?.status === 'due';
  const isSurplus = owner?.status === 'surplus';

  return <View style={styles.manageOwnerCard}>
    <View style={styles.ownerCard}>
      <View style={styles.ownerTop}>
        <View style={styles.ownerAvatar}><Ionicons name="home-outline" size={21} color="#0f766e" /></View>
        <View style={styles.flex1}>
          <Text style={styles.cardTitle}>الشقة {apartment?.number || '-'}</Text>
          <Text style={styles.cardSub}>{owner?.name || 'بيانات المالك غير مدخلة'}</Text>
        </View>
        <View style={[styles.badge, owner ? (isDue ? styles.badgeDue : isSurplus ? styles.badgeSurplus : styles.badgeBalanced) : styles.badgeBalanced]}>
          <Text style={styles.badgeText}>{owner ? (isDue ? 'عليه مبلغ' : isSurplus ? 'له فائض' : 'متعادل') : 'غير مكتملة'}</Text>
        </View>
      </View>
      {owner ? <View style={styles.ownerAmounts}>
        <SmallAmount title="دفعاته" value={money(owner.total_payments)} />
        <SmallAmount title="نصيبه" value={money(owner.expense_share)} />
        <SmallAmount title="المتبقي" value={money(owner.unpaid_amount)} />
        <SmallAmount title="الرصيد" value={money(owner.balance)} />
      </View> : <Text style={[styles.cardSub, { marginTop: 10 }]}>اضغط تعديل لإدخال بيانات مالك هذه الشقة.</Text>}
    </View>
    {owner ? <View style={styles.ownerMetaRow}>
      <Text style={styles.ownerMeta}>الدخول: {owner.login || owner.national_id || owner.phone || '-'}</Text>
      <Text style={styles.ownerMeta}>الجوال: {owner.phone || '-'}</Text>
    </View> : null}
    <View style={styles.actionsRow}>
      <Pressable style={styles.actionBtn} onPress={() => onEdit(apartment)}>
        <Ionicons name="create-outline" size={18} color="#0f766e" />
        <Text style={styles.actionText}>تعديل بيانات الشقة</Text>
      </Pressable>
      <Pressable style={styles.actionBtn} onPress={() => onPayments(apartment)}>
        <Ionicons name="wallet-outline" size={18} color="#0f766e" />
        <Text style={styles.actionText}>الدفعات</Text>
      </Pressable>
    </View>
  </View>;
}

function OwnersScreen({ token, buildingId, apartments, expenses, payments, reload }) {
  const [form, setForm] = useState(emptyOwnerForm);
  const [editingApartment, setEditingApartment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ownerFormVisible, setOwnerFormVisible] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [paymentsVisible, setPaymentsVisible] = useState(false);
  const [paymentFormVisible, setPaymentFormVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayDate());
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const apartmentRows = useMemo(
    () => [...(apartments || [])].sort((a, b) => Number(a?.number || 0) - Number(b?.number || 0)),
    [apartments]
  );

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const resetForm = () => {
    setForm(emptyOwnerForm);
    setEditingApartment(null);
    setOwnerFormVisible(false);
  };
  const startEdit = (apartment) => {
    const owner = apartment?.owner || {};
    setEditingApartment(apartment);
    setForm({
      name: owner.name || '',
      phone: owner.phone || '',
      national_id: owner.national_id || owner.login || '',
      email: owner.email || '',
      notes: owner.notes || '',
    });
    setOwnerFormVisible(true);
  };
  const save = async () => {
    if (!editingApartment) return;
    const data = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      national_id: form.national_id.trim(),
      email: form.email.trim(),
      notes: form.notes.trim(),
    };
    if (!data.name) return Alert.alert('تنبيه', 'أدخل اسم المالك');
    if (!data.national_id) return Alert.alert('تنبيه', 'أدخل رقم الهوية أو اسم الدخول');

    try {
      setLoading(true);
      await request(`/buildings/${buildingId}/apartments/${editingApartment.id}/owner`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }, token);
      const apartmentNumber = editingApartment.number;
      resetForm();
      await reload();
      Alert.alert('تم', `تم حفظ بيانات الشقة ${apartmentNumber}`);
    } catch (e) {
      Alert.alert('تعذر حفظ بيانات الشقة', e.message);
    } finally {
      setLoading(false);
    }
  };

  const openPayments = (apartment) => {
    const ownerId = apartment?.owner?.id || apartment?.owner_id;
    if (!ownerId) {
      Alert.alert('تنبيه', 'أدخل بيانات مالك الشقة أولًا');
      return;
    }
    setSelectedApartment(apartment);
    setPaymentFormVisible(false);
    setPaymentAmount('');
    setPaymentDate(todayDate());
    setPaymentNotes('');
    setPaymentsVisible(true);
  };

  const closePayments = () => {
    setPaymentsVisible(false);
    setPaymentFormVisible(false);
    setSelectedApartment(null);
    setPaymentAmount('');
    setPaymentDate(todayDate());
    setPaymentNotes('');
  };

  const selectedOwner = selectedApartment?.owner;
  const ownerApartmentCount = Math.max(1, Number(selectedOwner?.apartment_count || selectedOwner?.apartments?.length || 1));
  const selectedApartmentId = Number(selectedApartment?.id || 0);
  const selectedOwnerId = Number(selectedOwner?.id || selectedApartment?.owner_id || 0);

  const statementRows = useMemo(() => {
    if (!selectedApartmentId || !selectedOwnerId) return [];

    const expenseRows = (expenses || []).flatMap((expense) => {
      let share = 0;
      if (expense?.scope === 'selected' && Array.isArray(expense?.owners) && expense.owners.length > 0) {
        const matchedOwner = expense.owners.find((owner) => Number(owner?.id) === selectedOwnerId);
        if (!matchedOwner) return [];
        const ownerShare = Number(matchedOwner?.pivot?.share_amount || 0) || (Number(expense.amount || 0) / expense.owners.length);
        share = ownerShare / ownerApartmentCount;
      } else {
        share = Number(expense?.amount || 0) / Math.max(1, apartmentRows.length);
      }

      return [{
        key: `expense-${expense.id}`,
        date: expense.expense_date,
        description: expense.category || 'مصروف',
        debit: share,
        credit: 0,
        sortId: Number(expense.id || 0),
      }];
    });

    const paymentRows = (payments || [])
      .filter((payment) => Number(payment?.apartment_id || 0) === selectedApartmentId)
      .map((payment) => ({
        key: `payment-${payment.id}`,
        date: payment.payment_date,
        description: payment.notes || 'دفعة',
        debit: 0,
        credit: Number(payment.amount || 0),
        sortId: Number(payment.id || 0),
      }));

    let runningBalance = 0;
    return [...expenseRows, ...paymentRows]
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || a.sortId - b.sortId)
      .map((row) => {
        runningBalance += row.credit - row.debit;
        return { ...row, balance: runningBalance };
      })
      .reverse();
  }, [expenses, payments, selectedApartmentId, selectedOwnerId, ownerApartmentCount, apartmentRows.length]);

  const statementTotals = useMemo(() => statementRows.reduce((totals, row) => ({
    debit: totals.debit + Number(row.debit || 0),
    credit: totals.credit + Number(row.credit || 0),
  }), { debit: 0, credit: 0 }), [statementRows]);

  const saveApartmentPayment = async () => {
    if (!selectedApartment || !selectedOwnerId) return;
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) return Alert.alert('تنبيه', 'أدخل مبلغ الدفعة بشكل صحيح');

    try {
      setSavingPayment(true);
      await request(`/buildings/${buildingId}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          owner_id: selectedOwnerId,
          apartment_id: selectedApartment.id,
          amount,
          payment_date: normalizeDateForApi(paymentDate),
          method: 'تحويل',
          notes: paymentNotes.trim(),
        }),
      }, token);
      setPaymentAmount('');
      setPaymentDate(todayDate());
      setPaymentNotes('');
      setPaymentFormVisible(false);
      await reload({ silent: true });
    } catch (e) {
      Alert.alert('تعذر إضافة الدفعة', e.message);
    } finally {
      setSavingPayment(false);
    }
  };

  return <View style={styles.screenWrapper}>
    <ScrollView contentContainerStyle={[styles.screenContent, styles.ownersScreenContent]}>
      <ScreenCode code="#S-002" />
      {apartmentRows.length === 0
        ? <EmptyState icon="business-outline" title="لا توجد شقق مجهزة" text="حدد عدد الشقق أولًا من إعدادات المبنى، وسيتم تجهيزها تلقائيًا." />
        : apartmentRows.map((apartment) => <ApartmentOwnerCard key={apartment.id} apartment={apartment} onEdit={startEdit} onPayments={openPayments} />)}
    </ScrollView>

    <Modal visible={ownerFormVisible} transparent animationType="fade" onRequestClose={resetForm}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={resetForm} />
        <View style={styles.floatingFormCard}>
          <View style={styles.floatingFormHeader}>
            <Pressable onPress={resetForm} style={styles.closeFloatingBtn}><Ionicons name="close" size={22} color="#0f172a" /></Pressable>
            <View style={styles.flex1}>
              <Text style={styles.screenCodeText}>#S-009</Text>
              <Text style={styles.floatingFormTitle}>تعديل بيانات الشقة {editingApartment?.number || ''}</Text>
            </View>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.floatingFormBody}>
            <Text style={styles.label}>رقم الشقة</Text>
            <View style={styles.lockedCategoryField}>
              <Ionicons name="lock-closed-outline" size={18} color="#0f766e" />
              <Text style={styles.lockedCategoryText}>{editingApartment?.number || '-'}</Text>
            </View>
            <Field label="اسم المالك" value={form.name} onChangeText={(v) => setField('name', v)} placeholder="اسم المالك" />
            <Field label="رقم الجوال" value={form.phone} onChangeText={(v) => setField('phone', v)} placeholder="05xxxxxxxx" keyboardType="phone-pad" />
            <Field label="رقم الهوية أو اسم الدخول" value={form.national_id} onChangeText={(v) => setField('national_id', v)} placeholder="اسم دخول المالك" />
            <Field label="البريد الإلكتروني" value={form.email} onChangeText={(v) => setField('email', v)} placeholder="اختياري" keyboardType="email-address" />
            <Field label="ملاحظة" value={form.notes} onChangeText={(v) => setField('notes', v)} placeholder="ملاحظة اختيارية" multiline />
            <PrimaryButton title="حفظ بيانات الشقة" icon="save-outline" onPress={save} loading={loading} />
            <PrimaryButton title="إلغاء" icon="close-outline" onPress={resetForm} variant="light" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    <Modal visible={paymentsVisible} transparent animationType="fade" onRequestClose={closePayments}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={closePayments} />
        <View style={styles.floatingFormCard}>
          <View style={styles.floatingFormHeader}>
            <Pressable onPress={closePayments} style={styles.closeFloatingBtn}><Ionicons name="close" size={22} color="#0f172a" /></Pressable>
            <View style={styles.flex1}>
              <Text style={styles.floatingFormTitle}>كشف الحركة المالية - الشقة {selectedApartment?.number || ''}</Text>
              <Text style={styles.ownerMeta}>{selectedOwner?.name || ''}</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.floatingFormBody}>
            <View style={styles.statementSummaryRow}>
              <View style={styles.statementSummaryBox}><Text style={styles.statementSummaryLabel}>المصروفات</Text><Text style={styles.statementDebitText}>{money(statementTotals.debit)}</Text></View>
              <View style={styles.statementSummaryBox}><Text style={styles.statementSummaryLabel}>الدفعات</Text><Text style={styles.statementCreditText}>{money(statementTotals.credit)}</Text></View>
              <View style={styles.statementSummaryBox}><Text style={styles.statementSummaryLabel}>الرصيد</Text><Text style={styles.statementBalanceText}>{money(statementTotals.credit - statementTotals.debit)}</Text></View>
            </View>

            <Pressable onPress={() => setPaymentFormVisible((current) => !current)} style={({ pressed }) => [styles.statementAddPaymentBtn, pressed && styles.pressed]}>
              <Ionicons name={paymentFormVisible ? "close-outline" : "add-circle-outline"} size={20} color="#fff" />
              <Text style={styles.statementAddPaymentText}>{paymentFormVisible ? 'إغلاق إضافة الدفعة' : 'إضافة دفعة'}</Text>
            </Pressable>

            {paymentFormVisible ? <View style={styles.statementPaymentForm}>
              <Field label="مبلغ الدفعة" value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="numeric" placeholder="0" />
              <DatePickerField label="تاريخ الدفعة" value={paymentDate} onChange={setPaymentDate} />
              <Field label="ملاحظة" value={paymentNotes} onChangeText={setPaymentNotes} placeholder="ملاحظة اختيارية" multiline />
              <PrimaryButton title="حفظ الدفعة" icon="save-outline" onPress={saveApartmentPayment} loading={savingPayment} />
            </View> : null}

            <SectionTitle icon="receipt-outline" title="الحركة المالية" />
            {statementRows.length === 0
              ? <EmptyState icon="receipt-outline" title="لا توجد حركة مالية" text="لا توجد مصروفات أو دفعات مسجلة لهذه الشقة حتى الآن." />
              : statementRows.map((row) => <View key={row.key} style={styles.statementRow}>
                  <View style={styles.statementRowTop}>
                    <Text style={styles.statementDescription}>{row.description}</Text>
                    <Text style={styles.statementDate}>{displayDate(row.date)}</Text>
                  </View>
                  <View style={styles.statementAmountsRow}>
                    <View style={styles.statementAmountCell}><Text style={styles.statementAmountLabel}>مدين</Text><Text style={styles.statementDebitText}>{row.debit ? money(row.debit) : '-'}</Text></View>
                    <View style={styles.statementAmountCell}><Text style={styles.statementAmountLabel}>دائن</Text><Text style={styles.statementCreditText}>{row.credit ? money(row.credit) : '-'}</Text></View>
                    <View style={styles.statementAmountCell}><Text style={styles.statementAmountLabel}>الرصيد</Text><Text style={styles.statementBalanceText}>{money(row.balance)}</Text></View>
                  </View>
                </View>)}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </View>;
}
function PaymentsScreen({ token, buildingId, owners, payments, reload, initialOwnerId }) {
  const [ownerId, setOwnerId] = useState(null); const [amount, setAmount] = useState(''); const [paymentDate, setPaymentDate] = useState(todayDate()); const [notes, setNotes] = useState(''); const [loading, setLoading] = useState(false);
  useEffect(() => { if (initialOwnerId && owners?.some((owner) => owner.id === initialOwnerId)) { setOwnerId(initialOwnerId); return; } if (!ownerId && owners?.[0]?.id) setOwnerId(owners[0].id); }, [owners, ownerId, initialOwnerId]);
  const add = async () => { const apiDate = normalizeDateForApi(paymentDate); if (!ownerId) return Alert.alert('تنبيه', 'اختر المالك'); if (!amount) return Alert.alert('تنبيه', 'أدخل مبلغ الدفعة'); try { setLoading(true); await request(`/buildings/${buildingId}/payments`, { method: 'POST', body: JSON.stringify({ owner_id: ownerId, amount: Number(amount), payment_date: apiDate, method: 'تحويل', notes }) }, token); setAmount(''); setPaymentDate(todayDate()); setNotes(''); await reload(); } catch (e) { Alert.alert('تعذر إضافة الدفعة', e.message); } finally { setLoading(false); } };
  return <ScrollView contentContainerStyle={styles.screenContent}><SectionTitle icon="card-outline" title="تسجيل دفعة مالك" /><View style={styles.formCard}><Text style={styles.label}>المالك</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>{(owners || []).map((owner) => <Pressable key={owner.id} onPress={() => setOwnerId(owner.id)} style={[styles.chip, ownerId === owner.id && styles.chipActive]}><Text style={[styles.chipText, ownerId === owner.id && styles.chipTextActive]}>{owner.name}</Text></Pressable>)}</ScrollView><Field label="المبلغ" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" /><DatePickerField label="تاريخ الدفعة" value={paymentDate} onChange={setPaymentDate} /><Field label="ملاحظة" value={notes} onChangeText={setNotes} placeholder="ملاحظة اختيارية" multiline /><PrimaryButton title="حفظ الدفعة" icon="save-outline" onPress={add} loading={loading} /></View><SectionTitle icon="wallet-outline" title="آخر الدفعات" />{(payments || []).map((item) => <View key={item.id} style={styles.rowCard}><View style={styles.rowIcon}><Ionicons name="wallet" size={20} color="#0f766e" /></View><View style={styles.flex1}><Text style={styles.cardTitle}>{item.owner?.name || 'مالك'}</Text><Text style={styles.cardSub}>{displayDate(item.payment_date)} - {displayTextDates(item.notes || item.method) || 'دفعة'}</Text></View><Text style={styles.amountText}>{money(item.amount)}</Text></View>)}</ScrollView>;
}
function SettingsScreen({ dashboard, setTab, user, onManageBuildings, onLogout }) { const count = dashboard?.stats?.apartment_count || 0; const cycle = displayDate(dashboard?.building?.annual_cycle_starts_on, 'غير محدد'); const confirmLogout = () => Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج من الحساب؟', [{ text: 'إلغاء', style: 'cancel' }, { text: 'خروج', style: 'destructive', onPress: onLogout }]); return <ScrollView contentContainerStyle={styles.screenContent}><SettingsLink icon="person-circle-outline" title="إعدادات المستخدم" text="اسم المستخدم، رقم الجوال، البريد الإلكتروني، وتعديل البيانات." onPress={() => setTab('userSettings')} /><SettingsLink icon="key-outline" title="تغيير الرقم السري" text="تعديل الرقم السري للحساب الحالي." onPress={() => setTab('passwordSettings')} /><SettingsLink icon="business-outline" title="المباني" text="التنقل بين المباني وإضافة وتعديل وحذف المباني، مع فصل كامل لبيانات كل مبنى." onPress={onManageBuildings} />{user?.role === 'admin' ? <><SettingsLink icon="people-circle-outline" title="المستخدمون والصلاحيات" text="عرض المستخدمين، صلاحية كل مستخدم والمبنى المرتبط به." onPress={() => setTab('adminUsers')} /><SettingsLink icon="pricetags-outline" title="الأنواع الأساسية للصرف" text="إضافة وتعديل أنواع الصرف الأساسية للـ admin" onPress={() => setTab('expenseCategories')} /></> : null}<SettingsLink icon="business-outline" title="إعدادات المبنى" text={`عدد الشقق: ${count} - بداية الدورة: ${cycle}`} onPress={() => setTab('buildingSettings')} /><Pressable onPress={confirmLogout} style={({ pressed }) => [styles.settingsLogoutLink, pressed && styles.pressed]}><View style={styles.settingsLogoutIcon}><MaterialCommunityIcons name="logout-variant" size={24} color="#dc2626" /></View><View style={styles.flex1}><Text style={styles.settingsLogoutTitle}>تسجيل الخروج</Text><Text style={styles.settingsLogoutText}>الخروج من الحساب الحالي</Text></View><Ionicons name="chevron-back" size={22} color="#dc2626" /></Pressable></ScrollView>; }
function SettingsLink({ icon, title, text, onPress }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.settingsLink, pressed && styles.pressed]}><View style={styles.settingsIcon}><Ionicons name={icon} size={24} color="#0f766e" /></View><View style={styles.flex1}><Text style={styles.settingsTitle}>{title}</Text><Text style={styles.settingsText}>{displayTextDates(text)}</Text></View><Ionicons name="chevron-back" size={22} color="#64748b" /></Pressable>; }

function AdminUsersScreen({ token, setTab }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [buildingDropdownOpen, setBuildingDropdownOpen] = useState(false);

  useEffect(() => {
    request('/admin/users', {}, token)
      .then((data) => setUsers(data?.data || []))
      .catch((error) => Alert.alert('تعذر تحميل المستخدمين', error.message))
      .finally(() => setLoading(false));
  }, [token]);

  const roleLabel = (role) => role === 'admin' ? 'مدير التطبيق' : role === 'manager' ? 'مدير مبنى' : role === 'owner' ? 'مالك' : role || '-';
  const roleOrder = { admin: 1, manager: 2, owner: 3 };
  const buildingMap = new Map();

  (users || []).forEach((item) => {
    (item.buildings || []).forEach((building) => {
      if (!building?.id) return;
      if (!buildingMap.has(building.id)) buildingMap.set(building.id, building);
    });
  });

  const buildings = Array.from(buildingMap.values()).sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'ar'));
  const roleOptions = [
    { key: 'all', label: 'جميع الصلاحيات' },
    { key: 'admin', label: 'مدير التطبيق' },
    { key: 'manager', label: 'مدير مبنى' },
    { key: 'owner', label: 'مالك' },
  ];
  const buildingOptions = [
    { key: 'all', label: 'جميع المباني' },
    ...buildings.map((building) => ({ key: String(building.id), label: building.name })),
    { key: 'none', label: 'غير مرتبط بمبنى' },
  ];

  const selectedRoleLabel = roleOptions.find((item) => item.key === roleFilter)?.label || 'جميع الصلاحيات';
  const selectedBuildingLabel = buildingOptions.find((item) => item.key === buildingFilter)?.label || 'جميع المباني';

  const filteredUsers = (users || [])
    .filter((item) => {
      const roleMatch = roleFilter === 'all' || item.role === roleFilter;
      const itemBuildings = item.buildings || [];
      const buildingMatch =
        buildingFilter === 'all' ||
        (buildingFilter === 'none' ? itemBuildings.length === 0 : itemBuildings.some((building) => String(building?.id) === String(buildingFilter)));
      return roleMatch && buildingMatch;
    })
    .sort((a, b) => (roleOrder[a.role] || 9) - (roleOrder[b.role] || 9) || String(a?.name || a?.username || '').localeCompare(String(b?.name || b?.username || ''), 'ar'));

  const renderPermissions = (item) => <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
    {(item.permissions || []).map((permission, index) => <View key={index} style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 }}><Text style={{ color: '#475569', fontSize: 11, fontWeight: '700' }}>{permission}</Text></View>)}
  </View>;

  const renderUserCard = (item) => {
    const buildingNames = (item.buildings || []).map((building) => building?.name).filter(Boolean);
    return <View key={item.id} style={[styles.formCard, { marginBottom: 8, padding: 12 }]}>
      <View style={styles.ownerTop}>
        <View style={styles.ownerAvatar}><MaterialCommunityIcons name="account-circle-outline" size={24} color="#0f766e" /></View>
        <View style={styles.flex1}>
          <Text style={styles.cardTitle}>{item.name || item.username || 'مستخدم'}</Text>
          <Text style={styles.cardSub}>اسم الدخول: {item.username || '-'}</Text>
        </View>
        <View style={[styles.badge, styles.badgeBalanced]}><Text style={styles.badgeText}>{roleLabel(item.role)}</Text></View>
      </View>
      <Text style={[styles.settingsText, { marginTop: 8 }]}>الحالة: {item.status === 'active' ? 'نشط' : (item.status || '-')}</Text>
      <Text style={styles.settingsText}>المبنى: {buildingNames.length ? buildingNames.join('، ') : 'غير مرتبط بمبنى'}</Text>
      <Text style={[styles.settingsTitle, { marginTop: 8, fontSize: 14 }]}>الصلاحيات</Text>
      {renderPermissions(item)}
    </View>;
  };

  const renderDropdown = ({ label, valueLabel, open, setOpen, options, value, onChange }) => <View style={{ marginBottom: 12 }}>
    <Text style={[styles.label, { marginBottom: 6 }]}>{label}</Text>
    <Pressable onPress={() => {
      if (label === 'الصلاحية') setBuildingDropdownOpen(false);
      else setRoleDropdownOpen(false);
      setOpen((current) => !current);
    }} style={({ pressed }) => [styles.typeDropdownField, pressed && styles.pressed]}>
      <Ionicons name={open ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color="#0f766e" />
      <Text style={styles.typeDropdownText}>{valueLabel}</Text>
    </Pressable>
    {open ? <View style={styles.typeDropdownMenu}>
      {options.map((option) => <Pressable key={option.key} onPress={() => { onChange(option.key); setOpen(false); }} style={({ pressed }) => [styles.typeDropdownItem, value === option.key && styles.typeDropdownItemActive, pressed && styles.pressed]}>
        <Text style={[styles.typeDropdownItemText, value === option.key && styles.typeDropdownItemTextActive]}>{option.label}</Text>
        {value === option.key ? <Ionicons name="checkmark" size={18} color="#0f766e" /> : null}
      </Pressable>)}
    </View> : null}
  </View>;

  if (loading) return <LoadingScreen />;

  return <ScrollView contentContainerStyle={styles.screenContent}>
    <SectionTitle icon="people-circle-outline" title="المستخدمون والصلاحيات" />

    <View style={[styles.formCard, { padding: 12, marginBottom: 12 }]}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Ionicons name="filter-outline" size={21} color="#0f766e" />
        <Text style={styles.settingsTitle}>فلترة المستخدمين</Text>
      </View>

      {renderDropdown({
        label: 'الصلاحية',
        valueLabel: selectedRoleLabel,
        open: roleDropdownOpen,
        setOpen: setRoleDropdownOpen,
        options: roleOptions,
        value: roleFilter,
        onChange: setRoleFilter,
      })}

      {renderDropdown({
        label: 'المبنى',
        valueLabel: selectedBuildingLabel,
        open: buildingDropdownOpen,
        setOpen: setBuildingDropdownOpen,
        options: buildingOptions,
        value: buildingFilter,
        onChange: setBuildingFilter,
      })}

      {(roleFilter !== 'all' || buildingFilter !== 'all') ? <Pressable onPress={() => { setRoleFilter('all'); setBuildingFilter('all'); setRoleDropdownOpen(false); setBuildingDropdownOpen(false); }} style={({ pressed }) => [{ alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#f1f5f9' }, pressed && styles.pressed]}>
        <Text style={{ color: '#475569', fontWeight: '800' }}>مسح الفلاتر</Text>
      </Pressable> : null}
    </View>

    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={styles.settingsTitle}>النتائج</Text>
      <Text style={styles.settingsText}>{filteredUsers.length} مستخدم</Text>
    </View>

    {filteredUsers.map(renderUserCard)}
    {filteredUsers.length === 0 ? <EmptyState icon="search-outline" title="لا توجد نتائج" text="غيّر فلتر الصلاحية أو المبنى لعرض مستخدمين آخرين." /> : null}

    <PrimaryButton title="رجوع للإعدادات" icon="arrow-forward-outline" onPress={() => setTab('settings')} variant="light" />
  </ScrollView>;
}

function UserSettingsScreen({ token, user, setTab, onUserUpdated, backTab = 'settings', title = 'إعدادات المستخدم' }) {
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    setUsername(user?.username || '');
    setPhone(user?.phone || '');
    setEmail(user?.email || '');
  }, [user?.username, user?.phone, user?.email]);

  const saveProfile = async () => {
    const nextUsername = String(username || '').trim();
    if (!nextUsername) return Alert.alert('تنبيه', 'أدخل اسم المستخدم');

    try {
      setProfileLoading(true);
      const data = await request('/me', {
        method: 'PUT',
        body: JSON.stringify({
          username: nextUsername,
          phone: String(phone || '').trim() || null,
          email: String(email || '').trim() || null,
        }),
      }, token);
      if (data?.user) onUserUpdated?.(data.user);
      Alert.alert('تم', 'تم حفظ بيانات المستخدم');
    } catch (error) {
      Alert.alert('تعذر حفظ بيانات المستخدم', error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  return <ScrollView contentContainerStyle={styles.screenContent}>
    <SectionTitle icon="person-circle-outline" title={title} />
    <View style={styles.formCard}>
      <Field label="اسم المستخدم" value={username} onChangeText={setUsername} placeholder="اسم المستخدم" />
      <Field label="رقم الجوال" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="05xxxxxxxx" />
      <Field label="البريد الإلكتروني" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="name@example.com" />
      <PrimaryButton title="حفظ بيانات المستخدم" icon="save-outline" onPress={saveProfile} loading={profileLoading} />
      <PrimaryButton title="رجوع للإعدادات" icon="arrow-forward-outline" onPress={() => setTab(backTab)} variant="light" />
    </View>
  </ScrollView>;
}


function PasswordSettingsScreen({ token, setTab, backTab = 'settings' }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const savePassword = async () => {
    if (!currentPassword) return Alert.alert('تنبيه', 'أدخل الرقم السري الحالي');
    if (!newPassword || newPassword.length < 6) return Alert.alert('تنبيه', 'الرقم السري الجديد يجب ألا يقل عن 6 أحرف');
    if (newPassword !== passwordConfirmation) return Alert.alert('تنبيه', 'تأكيد الرقم السري غير مطابق');

    try {
      setLoading(true);
      await request('/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: passwordConfirmation,
        }),
      }, token);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordConfirmation('');
      Alert.alert('تم', 'تم تعديل الرقم السري بنجاح');
    } catch (error) {
      Alert.alert('تعذر تعديل الرقم السري', error.message);
    } finally {
      setLoading(false);
    }
  };

  return <ScrollView contentContainerStyle={styles.screenContent}>
    <SectionTitle icon="lock-closed-outline" title="تغيير الرقم السري" />
    <View style={styles.formCard}>
      <Field label="الرقم السري الحالي" value={currentPassword} onChangeText={setCurrentPassword} placeholder="••••••" secureTextEntry />
      <Field label="الرقم السري الجديد" value={newPassword} onChangeText={setNewPassword} placeholder="6 أحرف على الأقل" secureTextEntry />
      <Field label="تأكيد الرقم السري الجديد" value={passwordConfirmation} onChangeText={setPasswordConfirmation} placeholder="أعد إدخال الرقم السري" secureTextEntry />
      <PrimaryButton title="حفظ الرقم السري الجديد" icon="key-outline" onPress={savePassword} loading={loading} />
      <PrimaryButton title="رجوع للإعدادات" icon="arrow-forward-outline" onPress={() => setTab(backTab)} variant="light" />
    </View>
  </ScrollView>;
}

function BuildingSettingsScreen({ token, buildingId, dashboard, reload, setTab }) {
  const [buildingName, setBuildingName] = useState(dashboard?.building?.name || ''); const [apartmentCount, setApartmentCount] = useState(String(dashboard?.stats?.apartment_count || '')); const [annualCycleStartsOn, setAnnualCycleStartsOn] = useState(normalizeDateForApi(dashboard?.building?.annual_cycle_starts_on || todayDate())); const [loading, setLoading] = useState(false);
  useEffect(() => { setBuildingName(dashboard?.building?.name || ''); setApartmentCount(String(dashboard?.stats?.apartment_count || '')); setAnnualCycleStartsOn(normalizeDateForApi(dashboard?.building?.annual_cycle_starts_on || todayDate())); }, [dashboard?.building?.name, dashboard?.stats?.apartment_count, dashboard?.building?.annual_cycle_starts_on]);
  const save = async () => { const count = Number(apartmentCount); const apiDate = normalizeDateForApi(annualCycleStartsOn); const nextName = String(buildingName || '').trim(); if (!nextName) return Alert.alert('تنبيه', 'أدخل اسم المبنى'); if (!Number.isInteger(count) || count < 0) return Alert.alert('تنبيه', 'أدخل عدد الشقق بشكل صحيح'); try { setLoading(true); await request(`/buildings/${buildingId}/apartment-count`, { method: 'PUT', body: JSON.stringify({ name: nextName, apartment_count: count, annual_cycle_starts_on: apiDate || null }) }, token); await reload(); Alert.alert('تم', 'تم حفظ إعدادات المبنى'); setTab('settings'); } catch (e) { Alert.alert('تعذر حفظ إعدادات المبنى', e.message); } finally { setLoading(false); } };
  return <ScrollView contentContainerStyle={styles.screenContent}><ScreenCode code="#S-006" /><SectionTitle icon="business-outline" title="إعدادات المبنى" /><View style={styles.formCard}><Field label="اسم المبنى" value={buildingName} onChangeText={setBuildingName} placeholder="اسم المبنى" /><Field label="عدد الشقق" value={apartmentCount} onChangeText={setApartmentCount} keyboardType="numeric" placeholder="مثال: 12" /><DatePickerField label="تاريخ بداية الدورة السنوية" value={annualCycleStartsOn} onChange={setAnnualCycleStartsOn} /><Text style={styles.settingsHint}>تاريخ بداية الدورة يحدد بداية السنة المالية للمصروفات والتقارير.</Text><Text style={styles.settingsHint}>عدد الشقق هنا هو المعتمد في شاشة الملاك، ويتم تجهيز الشقق تلقائيًا بأرقام متسلسلة من 1 إلى العدد المحدد.</Text><Text style={styles.settingsHint}>عند تقليل العدد لن يتم حذف أي شقة تحتوي على بيانات مالك حفاظًا على البيانات.</Text><PrimaryButton title="حفظ إعدادات المبنى" icon="save-outline" onPress={save} loading={loading} /><PrimaryButton title="رجوع للإعدادات" icon="arrow-forward-outline" onPress={() => setTab('settings')} variant="light" /></View></ScrollView>;
}
function OwnerStatisticsScreen({ profile }) {
  return <Dashboard dashboard={{ building: profile?.building, stats: profile?.stats || {}, owners: profile?.summary ? [profile.summary] : [] }} />;
}
function OwnerOwnersReadOnlyScreen({ owners }) {
  return <ScrollView contentContainerStyle={styles.screenContent}>
    <SectionTitle icon="people-outline" title="الملاك" />
    {(owners || []).length === 0 ? <EmptyState icon="people-outline" title="لا توجد بيانات ملاك" text="لا توجد بيانات متاحة للعرض." /> : null}
    {sortOwnersByApartment(owners || []).map((owner) => <OwnerCard key={owner.id} owner={owner} />)}
  </ScrollView>;
}
function OwnerExpensesReadOnlyScreen({ expenses }) {
  return <ScrollView contentContainerStyle={styles.screenContent}>
    <SectionTitle icon="receipt-outline" title="المصروفات" />
    {(expenses || []).length === 0 ? <EmptyState icon="receipt-outline" title="لا توجد مصروفات" text="لا توجد مصروفات مسجلة حاليًا." /> : null}
    {(expenses || []).map((item) => <View key={item.id} style={styles.rowCard}>
      <View style={styles.rowIcon}><Ionicons name="receipt-outline" size={20} color="#0f766e" /></View>
      <View style={styles.flex1}>
        <Text style={styles.cardTitle}>{item.category || 'مصروف'}</Text>
        <Text style={styles.cardSub}>{displayDate(item.expense_date)}{item.description ? ` - ${displayTextDates(item.description)}` : ''}</Text>
        <Text style={styles.cardSub}>إجمالي المصروف: {money(item.amount)} • نصيبك: {money(item.owner_share)}</Text>
      </View>
    </View>)}
  </ScrollView>;
}
function OwnerSettingsScreen({ setTab, onLogout }) {
  const confirmLogout = () => Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج من الحساب؟', [{ text: 'إلغاء', style: 'cancel' }, { text: 'خروج', style: 'destructive', onPress: onLogout }]);
  return <ScrollView contentContainerStyle={styles.screenContent}>
    <SettingsLink icon="person-circle-outline" title="معلومات الحساب" text="عرض وتعديل اسم المستخدم، رقم الجوال والبريد الإلكتروني." onPress={() => setTab('account')} />
    <SettingsLink icon="key-outline" title="تغيير الرقم السري" text="تعديل الرقم السري للحساب الحالي." onPress={() => setTab('password')} />
    <Pressable onPress={confirmLogout} style={({ pressed }) => [styles.settingsLogoutLink, pressed && styles.pressed]}>
      <View style={styles.settingsLogoutIcon}><MaterialCommunityIcons name="logout-variant" size={24} color="#dc2626" /></View>
      <View style={styles.flex1}><Text style={styles.settingsLogoutTitle}>تسجيل الخروج</Text><Text style={styles.settingsLogoutText}>الخروج من الحساب الحالي</Text></View>
      <Ionicons name="chevron-back" size={22} color="#dc2626" />
    </Pressable>
  </ScrollView>;
}
function OwnerOnlyScreen({ token, user, selectedBuildingId, onLogout, onUserUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('statistics');

  useEffect(() => {
    request('/owner/dashboard', {}, token)
      .then(setData)
      .catch((e) => Alert.alert('خطأ', e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingScreen />;
  const profile = data?.owners?.find((item) => String(item?.building?.id) === String(selectedBuildingId)) || data?.owners?.[0];
  if (!profile) return <EmptyState icon="home-outline" title="لا توجد بيانات" text="لم يتم ربط حسابك بمالك بعد." />;

  const settingsActive = tab === 'settings' || tab === 'account' || tab === 'password';
  return <View style={styles.flex1}>
    {tab === 'statistics' && <OwnerStatisticsScreen profile={profile} />}
    {tab === 'owners' && <OwnerOwnersReadOnlyScreen owners={profile.building_owners || []} />}
    {tab === 'expenses' && <OwnerExpensesReadOnlyScreen expenses={profile.expenses || []} />}
    {tab === 'settings' && <OwnerSettingsScreen setTab={setTab} onLogout={onLogout} />}
    {tab === 'account' && <UserSettingsScreen token={token} user={user} setTab={setTab} onUserUpdated={onUserUpdated} backTab="settings" title="معلومات الحساب" />}
    {tab === 'password' && <PasswordSettingsScreen token={token} setTab={setTab} backTab="settings" />}
    <View style={styles.tabs}>
      <TabButton active={tab === 'statistics'} icon="grid-outline" title="إحصائيات" onPress={() => setTab('statistics')} />
      <TabButton active={tab === 'owners'} icon="people-outline" title="الملاك" onPress={() => setTab('owners')} />
      <TabButton active={tab === 'expenses'} icon="receipt-outline" title="المصروفات" onPress={() => setTab('expenses')} />
      <TabButton active={settingsActive} icon="settings-outline" title="الإعدادات" onPress={() => setTab('settings')} />
    </View>
  </View>;
}
function LoadingScreen() { return <View style={styles.loading}><ActivityIndicator color="#0f766e" size="large" /><Text style={styles.loadingText}>جاري التحميل...</Text></View>; }
function AppShell({ token, user, selectedBuilding, setSelectedBuilding, onLogout, onUserUpdated }) { const [tab, setTab] = useState('dashboard'); const [initialPaymentOwnerId, setInitialPaymentOwnerId] = useState(null); const [dashboard, setDashboard] = useState(null); const [expenses, setExpenses] = useState([]); const [payments, setPayments] = useState([]); const [expenseCategories, setExpenseCategories] = useState([]); const [loading, setLoading] = useState(true); const reload = async (options = {}) => { if (!selectedBuilding) return; const silent = options?.silent === true; if (!silent) setLoading(true); try { const [dash, expenseData, paymentData, categoryData] = await Promise.all([request(`/buildings/${selectedBuilding.id}/dashboard`, {}, token), request(`/buildings/${selectedBuilding.id}/expenses`, {}, token), request(`/buildings/${selectedBuilding.id}/payments`, {}, token), request(`/buildings/${selectedBuilding.id}/expense-categories`, {}, token)]); setDashboard(dash); setExpenses(expenseData.data || []); setPayments(paymentData.data || []); setExpenseCategories(categoryData.data || []); } catch (e) { Alert.alert('تعذر تحميل البيانات', e.message); } finally { if (!silent) setLoading(false); } }; useEffect(() => { if (user?.role !== 'owner') reload(); }, [selectedBuilding?.id, user?.role]); if (user?.role === 'owner') return <SafeAreaView style={styles.container}><Header title={selectedBuilding?.name || 'حسابي'} subtitle={user.name} onBack={user?.buildings?.length > 1 ? () => setSelectedBuilding(null) : undefined} token={token} /><OwnerOnlyScreen token={token} user={user} selectedBuildingId={selectedBuilding?.id} onLogout={onLogout} onUserUpdated={onUserUpdated} /></SafeAreaView>; const owners = sortOwnersByApartment(dashboard?.owners || []); return <SafeAreaView style={styles.container}><Header title={tab === 'owners' ? 'إدارة الملاك' : selectedBuilding?.name || 'المبنى'} subtitle={tab === 'settings' ? 'الإعدادات' : tab === 'passwordSettings' ? 'تغيير الرقم السري' : tab === 'adminUsers' ? 'المستخدمون والصلاحيات' : 'إدارة اتحاد الملاك'} onBack={() => (tab === 'userSettings' || tab === 'passwordSettings' || tab === 'buildingSettings' || tab === 'expenseCategories' || tab === 'adminUsers') ? setTab('settings') : setSelectedBuilding(null)} token={token} />{loading ? <LoadingScreen /> : <>{tab === 'dashboard' && <Dashboard dashboard={dashboard} />}{tab === 'owners' && <OwnersScreen token={token} buildingId={selectedBuilding.id} apartments={dashboard?.apartments || []} expenses={expenses} payments={payments} reload={reload} />}{tab === 'expenses' && <ExpensesScreen token={token} buildingId={selectedBuilding.id} expenses={expenses} categories={expenseCategories} reload={reload} />}{tab === 'expenseCategories' && <ExpenseCategoriesScreen token={token} buildingId={selectedBuilding.id} categories={expenseCategories} reload={reload} user={user} />}{tab === 'adminUsers' && user?.role === 'admin' && <AdminUsersScreen token={token} setTab={setTab} />}{tab === 'payments' && <PaymentsScreen token={token} buildingId={selectedBuilding.id} owners={owners} payments={payments} reload={reload} initialOwnerId={initialPaymentOwnerId} />}{tab === 'settings' && <SettingsScreen dashboard={dashboard} setTab={setTab} user={user} onManageBuildings={() => setSelectedBuilding(null)} onLogout={onLogout} />}{tab === 'userSettings' && <UserSettingsScreen token={token} user={user} setTab={setTab} onUserUpdated={onUserUpdated} />}{tab === 'passwordSettings' && <PasswordSettingsScreen token={token} setTab={setTab} />}{tab === 'buildingSettings' && <BuildingSettingsScreen token={token} buildingId={selectedBuilding.id} dashboard={dashboard} reload={reload} setTab={setTab} />}</>}<View style={styles.tabs}><TabButton active={tab === 'dashboard'} icon="grid-outline" title="الملخص" onPress={() => setTab('dashboard')} /><TabButton active={tab === 'owners'} icon="people-outline" title="الملاك" onPress={() => setTab('owners')} /><TabButton active={tab === 'expenses'} icon="receipt-outline" title="المصروفات" onPress={() => setTab('expenses')} /><TabButton active={tab === 'settings' || tab === 'userSettings' || tab === 'passwordSettings' || tab === 'buildingSettings' || tab === 'expenseCategories' || tab === 'adminUsers'} icon="settings-outline" title="الإعدادات" onPress={() => setTab('settings')} /></View></SafeAreaView>; }
function TabButton({ active, icon, title, onPress }) { return <Pressable onPress={onPress} style={styles.tabBtn}><Ionicons name={icon} size={21} color={active ? '#0f766e' : '#94a3b8'} /><Text style={[styles.tabText, active && styles.tabTextActive]}>{title}</Text></Pressable>; }
export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync('bm_token')
      .then(async (saved) => {
        if (saved) {
          const data = await request('/me', {}, saved);
          setToken(saved);
          setUser(data.user);
          if (data.user?.buildings?.length === 1) setSelectedBuilding(data.user.buildings[0]);
        }
      })
      .catch(() => SecureStore.deleteItemAsync('bm_token'))
      .finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    if (!token) return;
    registerPushNotifications(token);
  }, [token]);

  const logout = async () => {
    try {
      if (token) {
        await unregisterPushNotifications(token);
        await request('/logout', { method: 'POST' }, token);
      }
    } catch (_) {}
    await SecureStore.deleteItemAsync('bm_token');
    setToken(null);
    setUser(null);
    setSelectedBuilding(null);
  };

  if (booting) return <SafeAreaProvider><LoadingScreen /></SafeAreaProvider>;
  return <SafeAreaProvider>
    {!token
      ? <LoginScreen onLogin={(nextToken, nextUser) => {
          setToken(nextToken);
          setUser(nextUser);
          if (nextUser?.buildings?.length === 1) setSelectedBuilding(nextUser.buildings[0]);
        }} />
      : !selectedBuilding
        ? <BuildingPicker token={token} user={user} onSelect={setSelectedBuilding} onBuildingsChanged={(nextBuildings) => setUser((current) => current ? { ...current, buildings: nextBuildings } : current)} />
        : <AppShell token={token} user={user} selectedBuilding={selectedBuilding} setSelectedBuilding={setSelectedBuilding} onLogout={logout} onUserUpdated={setUser} />}
  </SafeAreaProvider>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' }, screenWrapper: { flex: 1, backgroundColor: '#f8fafc' }, loginContainer: { flex: 1, backgroundColor: '#ecfdf5' }, loginContent: { flexGrow: 1, padding: 22, paddingBottom: 36, justifyContent: 'center' }, logoCircle: { width: 98, height: 98, borderRadius: 49, backgroundColor: '#fff', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 }, appName: { fontSize: 27, fontWeight: '900', textAlign: 'center', color: '#0f172a' }, subtitle: { fontSize: 14, color: '#475569', textAlign: 'center', marginTop: 8, lineHeight: 23 }, loginCard: { backgroundColor: '#fff', borderRadius: 24, padding: 18, marginTop: 24, shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 },
  notificationCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 18, padding: 12, marginBottom: 9, flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10 }, notificationIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center' }, notificationTitle: { color: '#0f172a', fontSize: 14, fontWeight: '900', textAlign: 'right' }, notificationBody: { color: '#475569', fontSize: 13, lineHeight: 21, textAlign: 'right', marginTop: 3 }, notificationDate: { color: '#94a3b8', fontSize: 10, textAlign: 'right', marginTop: 5 },
  field: { marginBottom: 12 }, requiredHint: { color: '#ef4444', fontSize: 11, fontWeight: '800', textAlign: 'right', marginTop: 4 }, label: { color: '#334155', fontSize: 13, fontWeight: '800', textAlign: 'right', marginBottom: 6 }, input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0f172a' }, dateInput: { minHeight: 54, justifyContent: 'center', flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }, dateInputText: { flex: 1, textAlign: 'right', color: '#0f172a', fontWeight: '900' }, datePlaceholder: { color: '#94a3b8' }, textarea: { minHeight: 82, textAlignVertical: 'top' }, button: { height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 8, marginTop: 8 }, button_primary: { backgroundColor: '#0f766e' }, button_light: { backgroundColor: '#ecfdf5' }, buttonText: { color: '#fff', fontWeight: '900', fontSize: 15 }, buttonTextLight: { color: '#0f766e' }, pressed: { opacity: 0.75 },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 10 }, headerActions: { flexDirection: 'row', gap: 8 }, circleBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }, circleBtnLabel: { fontSize: 9, color: '#64748b', fontWeight: '900', marginTop: 1 }, headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', textAlign: 'right' }, headerSubtitle: { fontSize: 12, color: '#64748b', textAlign: 'right', marginTop: 2 }, flex1: { flex: 1 },
  listContent: { padding: 16, gap: 12 }, buildingsListContent: { padding: 16, paddingBottom: 40, gap: 12 }, buildingManageCard: { backgroundColor: '#fff', borderRadius: 22, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }, buildingCard: { backgroundColor: '#fff', padding: 16, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }, buildingIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center' }, buildingMetaText: { color: '#94a3b8', fontSize: 10, marginTop: 5, textAlign: 'right', fontWeight: '700' }, buildingAddButton: { minHeight: 54, borderRadius: 18, backgroundColor: '#0f766e', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 2, shadowColor: '#0f172a', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }, buildingAddButtonText: { color: '#fff', fontWeight: '900', fontSize: 15 }, buildingActionsRow: { flexDirection: 'row-reverse', gap: 8, paddingHorizontal: 12, paddingBottom: 12 }, buildingEditButton: { flex: 1, minHeight: 40, borderRadius: 13, backgroundColor: '#ecfdf5', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6 }, buildingEditButtonText: { color: '#0f766e', fontWeight: '900', fontSize: 12 }, buildingDeleteButton: { flex: 1, minHeight: 40, borderRadius: 13, backgroundColor: '#fef2f2', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6 }, buildingDeleteButtonText: { color: '#ef4444', fontWeight: '900', fontSize: 12 }, cardTitle: { fontWeight: '900', color: '#0f172a', fontSize: 15, textAlign: 'right' }, cardSub: { color: '#64748b', fontSize: 12, marginTop: 3, textAlign: 'right' },
  screenContent: { padding: 16, paddingBottom: 110 }, ownersScreenContent: { paddingTop: 14 }, expensesScreenContent: { paddingTop: 14 }, expensesScreenCodeBadge: { transform: [{ translateX: 150 }] }, heroCard: { backgroundColor: '#0f766e', borderRadius: 26, padding: 18, flexDirection: 'row-reverse', alignItems: 'center', gap: 14, marginBottom: 14 }, heroIcon: { width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }, heroTitle: { color: '#fff', fontWeight: '900', fontSize: 20, textAlign: 'right' }, heroSub: { color: '#ccfbf1', marginTop: 4, textAlign: 'right' },
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 }, statCard: { width: '48.5%', backgroundColor: '#fff', borderRadius: 22, padding: 14, minHeight: 122, borderWidth: 1, borderColor: '#e2e8f0' }, statIconWrap: { width: 40, height: 40, borderRadius: 15, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, statTitle: { color: '#64748b', fontSize: 12, textAlign: 'right' }, statValue: { color: '#0f172a', fontSize: 15, fontWeight: '900', marginTop: 6, textAlign: 'right' }, warningCard: { backgroundColor: '#fff7ed', borderColor: '#fed7aa', borderWidth: 1, borderRadius: 18, padding: 12, marginTop: 12 }, warningTitle: { color: '#9a3412', fontWeight: '900', textAlign: 'right' }, warningText: { color: '#9a3412', textAlign: 'right', marginTop: 4 },
  sectionTitle: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, marginTop: 18, marginBottom: 10 }, sectionText: { fontSize: 17, fontWeight: '900', color: '#0f172a' }, screenCodeBadge: { alignSelf: 'flex-start', backgroundColor: '#e0f2fe', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 2 }, screenCodeText: { color: '#0369a1', fontWeight: '900', fontSize: 11, textAlign: 'right' },
  ownerCard: { backgroundColor: '#fff', borderRadius: 17, padding: 9, borderWidth: 1, borderColor: '#e2e8f0' }, ownerTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 }, ownerAvatar: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }, badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }, badgeDue: { backgroundColor: '#fee2e2' }, badgeSurplus: { backgroundColor: '#dcfce7', transform: [{ translateX: 50 }] }, badgeBalanced: { backgroundColor: '#e0f2fe' }, badgeText: { color: '#0f172a', fontWeight: '800', fontSize: 10 }, ownerAmounts: { flexDirection: 'row-reverse', gap: 6, marginTop: 7, flexWrap: 'wrap' }, smallAmount: { flexGrow: 1, minWidth: '45%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 6 }, smallTitle: { fontSize: 10, color: '#64748b', textAlign: 'right' }, smallValue: { fontSize: 12, color: '#0f172a', fontWeight: '900', textAlign: 'right', marginTop: 2 },
  formCard: { backgroundColor: '#fff', borderRadius: 22, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' }, chipsRow: { flexDirection: 'row-reverse', gap: 8, paddingVertical: 4 }, chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' }, chipActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' }, chipText: { color: '#475569', fontWeight: '800' }, chipTextActive: { color: '#fff' }, rowCard: { backgroundColor: '#fff', borderRadius: 18, padding: 13, marginBottom: 9, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e2e8f0' }, rowIcon: { width: 40, height: 40, borderRadius: 15, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' }, amountText: { color: '#0f172a', fontWeight: '900' },
  expenseCompactCard: { minHeight: 72, backgroundColor: '#fff', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 9, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  expenseInfo: { flex: 1, minWidth: 0 }, expenseMainLine: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, expenseDateText: { color: '#64748b', fontSize: 13, fontWeight: '700', textAlign: 'right' },
  expenseIconActions: { flexDirection: 'row', alignItems: 'center', gap: 6 }, expenseIconBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }, expenseIconBtnMuted: { backgroundColor: '#fff' }, expenseEditIconBtn: { backgroundColor: '#ecfdf5', borderColor: '#d1fae5' }, expenseDeleteIconBtn: { backgroundColor: '#fef2f2', borderColor: '#fee2e2' },
  expenseAttachmentIconBtn: { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe', position: 'relative' }, expenseAttachmentBadge: { position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }, expenseAttachmentBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  expenseAttachmentPicker: { minHeight: 64, borderRadius: 16, borderWidth: 1, borderColor: '#ddd6fe', backgroundColor: '#faf5ff', paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 10 }, expenseAttachmentPickerTitle: { color: '#5b21b6', fontWeight: '900', fontSize: 14, textAlign: 'right' }, expenseAttachmentHint: { color: '#64748b', fontSize: 11, marginTop: 3, textAlign: 'right' },
  expenseExistingAttachments: { minHeight: 38, borderRadius: 12, backgroundColor: '#ecfdf5', flexDirection: 'row-reverse', alignItems: 'center', gap: 7, paddingHorizontal: 10, marginBottom: 8 }, expenseExistingAttachmentsText: { color: '#0f766e', fontWeight: '800', fontSize: 12 },
  expenseSelectedAttachment: { borderRadius: 13, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', padding: 10, marginBottom: 7 }, expenseSelectedAttachmentTop: { minHeight: 34, flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }, expenseSelectedAttachmentName: { flex: 1, color: '#334155', fontWeight: '800', fontSize: 12, textAlign: 'right' }, expenseAttachmentNameInput: { minHeight: 42, marginTop: 7, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 11, paddingHorizontal: 10, color: '#0f172a', fontSize: 13 }, expenseAttachmentRemoveBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' },
  expenseAttachmentViewerCard: { position: 'relative', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', padding: 10, marginBottom: 10 }, expenseAttachmentDeleteBtn: { position: 'absolute', top: 8, left: 8, width: 36, height: 36, borderRadius: 12, backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3', alignItems: 'center', justifyContent: 'center', zIndex: 20, elevation: 5 }, expenseAttachmentImage: { width: '100%', height: 260, backgroundColor: '#f8fafc', borderRadius: 14, marginBottom: 8 }, expenseAttachmentName: { color: '#0f172a', fontWeight: '900', fontSize: 13, textAlign: 'right' }, expensePdfOpenBtn: { minHeight: 76, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 8, paddingLeft: 50, backgroundColor: '#fef2f2', borderRadius: 14 },
  categoryModalAddBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 },
  lockedCategoryField: { minHeight: 54, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start', gap: 8, marginBottom: 12 }, lockedCategoryText: { color: '#0f766e', fontWeight: '900', fontSize: 15, textAlign: 'right' },
  expenseSummaryCard: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#dbe5ea', padding: 16, marginBottom: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 14, shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 }, expenseSummaryMain: { flex: 1, alignItems: 'flex-end' }, expenseSummaryLabel: { color: '#64748b', fontSize: 12, fontWeight: '800', textAlign: 'right' }, expenseSummaryAmount: { color: '#0f172a', fontSize: 23, fontWeight: '900', textAlign: 'right', marginTop: 4 }, expenseSummaryMeta: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textAlign: 'right', marginTop: 4 }, expenseSummaryAddBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  categoryTypeNote: { color: '#64748b', fontSize: 11, marginTop: 4, textAlign: 'right' }, typeDropdownField: { minHeight: 54, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8 }, typeDropdownText: { flex: 1, color: '#0f172a', fontWeight: '900', fontSize: 15, textAlign: 'right' }, typeDropdownMenu: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }, typeDropdownItem: { minHeight: 48, paddingHorizontal: 14, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }, typeDropdownItemActive: { backgroundColor: '#ecfdf5' }, typeDropdownItemText: { flex: 1, color: '#334155', fontWeight: '800', textAlign: 'right' }, typeDropdownItemTextActive: { color: '#0f766e' }, typeDropdownOther: { borderBottomWidth: 0, backgroundColor: '#f8fafc' },
  statementSummaryRow: { flexDirection: 'row-reverse', gap: 7, marginBottom: 10 }, statementSummaryBox: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 9 }, statementSummaryLabel: { color: '#64748b', fontSize: 10, fontWeight: '800', textAlign: 'right' }, statementAddPaymentBtn: { minHeight: 46, borderRadius: 15, backgroundColor: '#0f766e', flexDirection: 'row-reverse', gap: 7, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, statementAddPaymentText: { color: '#fff', fontWeight: '900', fontSize: 14 }, statementPaymentForm: { backgroundColor: '#f8fafc', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 4 }, statementRow: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 11, marginBottom: 8 }, statementRowTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, statementDescription: { flex: 1, color: '#0f172a', fontWeight: '900', fontSize: 13, textAlign: 'right' }, statementDate: { color: '#64748b', fontSize: 11, fontWeight: '700' }, statementAmountsRow: { flexDirection: 'row-reverse', gap: 6, marginTop: 8 }, statementAmountCell: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 11, padding: 7 }, statementAmountLabel: { color: '#94a3b8', fontSize: 9, textAlign: 'right' }, statementDebitText: { color: '#b91c1c', fontWeight: '900', fontSize: 11, textAlign: 'right', marginTop: 2 }, statementCreditText: { color: '#047857', fontWeight: '900', fontSize: 11, textAlign: 'right', marginTop: 2 }, statementBalanceText: { color: '#0f172a', fontWeight: '900', fontSize: 11, textAlign: 'right', marginTop: 2 },
  manageOwnerCard: { marginBottom: 7, backgroundColor: '#fff', borderRadius: 18, padding: 6, borderWidth: 1, borderColor: '#e2e8f0' }, manageOwnerCardWithMenu: { position: 'relative', overflow: 'visible' }, ownerCardMenuButton: { position: 'absolute', top: 11, left: 12, width: 42, height: 42, borderRadius: 21, backgroundColor: '#ecfeff', borderWidth: 1, borderColor: '#a7f3d0', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3, zIndex: 20 }, ownerCardMenu: { position: 'absolute', top: 54, left: 12, width: 132, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 6, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOpacity: 0.14, shadowRadius: 14, elevation: 8, zIndex: 30 }, ownerCardMenuItem: { minHeight: 40, paddingHorizontal: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start', gap: 8 }, ownerCardMenuText: { color: '#0f172a', fontWeight: '900', fontSize: 13, textAlign: 'right' }, ownerMetaRow: { flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap', paddingHorizontal: 3, paddingTop: 4 }, ownerMeta: { fontSize: 10, color: '#64748b', textAlign: 'right' }, actionsRow: { flexDirection: 'row-reverse', gap: 6, marginTop: 6 }, actionBtn: { flex: 1, height: 33, borderRadius: 11, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 5 }, deleteBtn: { backgroundColor: '#fef2f2' }, actionText: { color: '#0f766e', fontWeight: '900', fontSize: 12 }, deleteText: { color: '#ef4444' }, ownerFloatingAdd: { position: 'absolute', top: 8, left: 16, width: 46, height: 46, borderRadius: 23, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.18, shadowRadius: 11, elevation: 8, zIndex: 10 },
  modalRoot: { flex: 1, justifyContent: 'flex-start', paddingTop: Platform.OS === 'ios' ? 70 : 44, paddingHorizontal: 14 }, modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.42)' }, floatingFormCard: { maxHeight: '86%', backgroundColor: '#fff', borderRadius: 26, padding: 14, shadowColor: '#0f172a', shadowOpacity: 0.18, shadowRadius: 18, elevation: 10 }, floatingFormHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 12, marginBottom: 8 }, closeFloatingBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }, floatingFormTitle: { color: '#0f172a', fontWeight: '900', fontSize: 18, textAlign: 'right' }, floatingFormBody: { paddingTop: 4, paddingBottom: 8 },
  settingsHint: { color: '#64748b', textAlign: 'right', lineHeight: 21, marginBottom: 12 }, settingsLink: { backgroundColor: '#fff', borderRadius: 22, padding: 14, marginBottom: 10, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#e2e8f0' }, settingsIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }, settingsTitle: { color: '#0f172a', fontWeight: '900', fontSize: 15, textAlign: 'right' }, settingsText: { color: '#64748b', fontSize: 12, marginTop: 4, textAlign: 'right' }, settingsLogoutLink: { backgroundColor: '#fff7f7', borderRadius: 22, padding: 14, marginTop: 4, marginBottom: 10, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#fecaca' }, settingsLogoutIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' }, settingsLogoutTitle: { color: '#dc2626', fontWeight: '900', fontSize: 15, textAlign: 'right' }, settingsLogoutText: { color: '#b91c1c', fontSize: 12, marginTop: 4, textAlign: 'right' },
  tabs: { position: 'absolute', left: 8, right: 8, bottom: Platform.OS === 'ios' ? 20 : 12, backgroundColor: '#fff', borderRadius: 24, padding: 8, flexDirection: 'row-reverse', justifyContent: 'space-around', shadowColor: '#0f172a', shadowOpacity: 0.1, shadowRadius: 18, elevation: 7 }, tabBtn: { alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 54 }, tabText: { fontSize: 10, color: '#94a3b8', fontWeight: '800' }, tabTextActive: { color: '#0f766e' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 28 }, emptyTitle: { color: '#0f172a', fontWeight: '900', fontSize: 17, marginTop: 10 }, emptyText: { color: '#64748b', textAlign: 'center', lineHeight: 21, marginTop: 6 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }, loadingText: { marginTop: 10, color: '#64748b', fontWeight: '800' }
});
