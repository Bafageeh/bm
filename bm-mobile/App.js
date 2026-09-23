import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, I18nManager, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Line, Path, Polyline, Rect } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import * as SecureStore from 'expo-secure-store';

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
  'camera-outline': 'camera', 'image-outline': 'image',
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

function getNotificationsModule() {
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
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { message: text || 'حدث خطأ غير متوقع' }; }
  if (!response.ok) throw new Error(data?.message || Object.values(data?.errors || {})?.flat()?.[0] || 'حدث خطأ غير متوقع');
  return data;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry = false, multiline = false }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={[styles.input, multiline && styles.textarea]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#94a3b8" keyboardType={keyboardType} secureTextEntry={secureTextEntry} multiline={multiline} textAlign="right" />{label.includes('*') ? <Text style={styles.requiredHint}>* حقل إجباري</Text> : null}</View>;
}
function PrimaryButton({ title, icon, onPress, loading, variant = 'primary' }) {
  return <Pressable disabled={loading} onPress={onPress} style={({ pressed }) => [styles.button, styles[`button_${variant}`], pressed && styles.pressed]}>{loading ? <ActivityIndicator color={variant === 'light' ? '#0f766e' : '#fff'} /> : <Ionicons name={icon} size={20} color={variant === 'light' ? '#0f766e' : '#fff'} />}<Text style={[styles.buttonText, variant === 'light' && styles.buttonTextLight]}>{title}</Text></Pressable>;
}
function Header({ title, subtitle, onLogout, onBack }) {
  return <View style={styles.header}><View style={styles.headerActions}>{onBack ? <HeaderIconButton icon="arrow-right" color="#0f766e" label="رجوع" onPress={onBack} /> : null}<HeaderIconButton icon="bell-ring-outline" color="#7c3aed" label="تنبيه" onPress={() => notifyLocal('التنبيهات جاهزة', 'تم تفعيل مكتبة التنبيهات لاستخدامها مستقبلاً.')} />{onLogout ? <HeaderIconButton icon="logout-variant" color="#ef4444" label="خروج" onPress={onLogout} /> : null}</View><View style={styles.flex1}><Text style={styles.headerTitle}>{title}</Text>{subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}</View></View>;
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
  return <SafeAreaView style={styles.loginContainer}><StatusBar style="dark" /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.loginContent}><ScreenCode code="#S-001" /><View style={styles.logoCircle}><MaterialCommunityIcons name="office-building-cog" size={54} color="#0f766e" /></View><Text style={styles.appName}>إدارة اتحاد الملاك</Text><Text style={styles.subtitle}>مصروفات المبنى، دفعات الملاك، والرصيد في شاشة سهلة وواضحة</Text><View style={styles.loginCard}><Field label="اسم المستخدم أو الجوال" value={login} onChangeText={setLogin} placeholder="مثال: manager" /><Field label="كلمة المرور" value={password} onChangeText={setPassword} placeholder="••••••" secureTextEntry /><PrimaryButton title="دخول" icon="log-in-outline" onPress={submit} loading={loading} /></View></KeyboardAvoidingView></SafeAreaView>;
}
function BuildingPicker({ user, onSelect, onLogout }) {
  return <SafeAreaView style={styles.container}><Header title="اختر المبنى" subtitle={`مرحبًا ${user?.name || ''}`} onLogout={onLogout} /><FlatList contentContainerStyle={styles.listContent} data={user?.buildings || []} keyExtractor={(item) => String(item.id)} ListEmptyComponent={<EmptyState icon="business-outline" title="لا توجد مبانٍ" text="لم يتم ربط حسابك بأي مبنى بعد." />} renderItem={({ item }) => <Pressable style={styles.buildingCard} onPress={() => onSelect(item)}><View style={styles.buildingIcon}><Ionicons name="business" size={28} color="#0f766e" /></View><View style={styles.flex1}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.cardSub}>{displayTextDates([item.city, item.district].filter(Boolean).join(' - ') || 'بدون موقع')}</Text></View><Ionicons name="chevron-back" size={22} color="#64748b" /></Pressable>} /></SafeAreaView>;
}
function Dashboard({ dashboard }) {
  const stats = dashboard?.stats || {};
  return <ScrollView contentContainerStyle={styles.screenContent}><View style={styles.heroCard}><View style={styles.heroIcon}><MaterialCommunityIcons name="home-city-outline" size={30} color="#fff" /></View><View style={styles.flex1}><Text style={styles.heroTitle}>{dashboard?.building?.name || 'المبنى'}</Text><Text style={styles.heroSub}>كل مبنى مستقل ببياناته ومصروفاته وأرصدته</Text></View></View><View style={styles.statsGrid}><Stat icon="cash-outline" title="إجمالي المدفوعات" value={money(stats.total_payments)} /><Stat icon="receipt-outline" title="إجمالي المصروفات" value={money(stats.total_expenses)} /><Stat icon="wallet-outline" title="رصيد المبنى" value={money(stats.building_balance)} /><Stat icon="business-outline" title="عدد الشقق" value={stats.apartment_count || 0} /><Stat icon="calendar-outline" title="بداية الدورة" value={displayDate(dashboard?.building?.annual_cycle_starts_on)} /><Stat icon="alert-circle-outline" title="شقق غير مدخلة" value={stats.unassigned_apartment_count || 0} /></View>{stats.unassigned_apartment_count > 0 ? <View style={styles.warningCard}><Text style={styles.warningTitle}>شقق تحتاج إكمال بيانات</Text><Text style={styles.warningText}>عددها: {stats.unassigned_apartment_count} - مبلغها التقديري: {money(stats.unassigned_apartment_amount)}</Text><Text style={styles.warningText}>الأرقام: {(stats.unassigned_apartments || []).join('، ') || '-'}</Text></View> : null}<SectionTitle icon="people-outline" title="ملخص الملاك" />{(dashboard?.owners || []).map((owner) => <OwnerCard key={owner.id} owner={owner} />)}</ScrollView>;
}
function Stat({ icon, title, value }) { return <View style={styles.statCard}><View style={styles.statIconWrap}><Ionicons name={icon} size={22} color="#0f766e" /></View><Text style={styles.statTitle}>{title}</Text><Text style={styles.statValue}>{value}</Text></View>; }
function OwnerCard({ owner }) { const isDue = owner.status === 'due'; const isSurplus = owner.status === 'surplus'; return <View style={styles.ownerCard}><View style={styles.ownerTop}><View style={styles.ownerAvatar}><MaterialCommunityIcons name="account-circle-outline" size={22} color="#0f766e" /></View><View style={styles.flex1}><Text style={styles.cardTitle}>{owner.name}</Text><Text style={styles.cardSub}>الشقق: {owner.apartments?.join('، ') || '-'}</Text></View><View style={[styles.badge, isDue ? styles.badgeDue : isSurplus ? styles.badgeSurplus : styles.badgeBalanced]}><Text style={styles.badgeText}>{isDue ? 'عليه مبلغ' : isSurplus ? 'له فائض' : 'متعادل'}</Text></View></View><View style={styles.ownerAmounts}><SmallAmount title="دفعاته" value={money(owner.total_payments)} /><SmallAmount title="نصيبه" value={money(owner.expense_share)} /><SmallAmount title="المتبقي" value={money(owner.unpaid_amount)} /><SmallAmount title="الرصيد" value={money(owner.balance)} /></View></View>; }
function SmallAmount({ title, value }) { return <View style={styles.smallAmount}><Text style={styles.smallTitle}>{title}</Text><Text style={styles.smallValue}>{value}</Text></View>; }
function ExpenseRow({ item, onShowNote, onEdit, onDelete }) {
  const hasNote = Boolean(String(item.description || '').trim());
  return <View style={styles.expenseCompactCard}><View style={styles.expenseInfo}><View style={styles.expenseMainLine}><Text style={styles.expenseDateText}>{displayDate(item.expense_date)}</Text><Text style={styles.amountText}>{money(item.amount)}</Text></View></View><View style={styles.expenseIconActions}><Pressable accessibilityLabel="ملاحظة المصروف" onPress={() => onShowNote(item)} style={({ pressed }) => [styles.expenseIconBtn, !hasNote && styles.expenseIconBtnMuted, pressed && styles.pressed]}><Ionicons name={hasNote ? "chatbubble-ellipses-outline" : "chatbubble-outline"} size={19} color={hasNote ? '#64748b' : '#cbd5e1'} /></Pressable><Pressable accessibilityLabel="تعديل المصروف" onPress={() => onEdit(item)} style={({ pressed }) => [styles.expenseIconBtn, styles.expenseEditIconBtn, pressed && styles.pressed]}><Ionicons name="create-outline" size={19} color="#0f766e" /></Pressable><Pressable accessibilityLabel="حذف المصروف" onPress={() => onDelete(item)} style={({ pressed }) => [styles.expenseIconBtn, styles.expenseDeleteIconBtn, pressed && styles.pressed]}><Ionicons name="trash-outline" size={19} color="#ef4444" /></Pressable></View></View>;
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

  const add = async () => {
    const apiDate = normalizeDateForApi(expenseDate);
    if (!amount) return Alert.alert('تنبيه', 'أدخل مبلغ المصروف');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(apiDate)) return Alert.alert('تنبيه', 'اختر تاريخ المصروف');
    try {
      setLoading(true);
      await request(`/buildings/${buildingId}/expenses`, {
        method: 'POST',
        body: JSON.stringify({ category, amount: Number(amount), expense_date: apiDate, description }),
      }, token);
      closeAddExpenseForm();
      await reload();
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
      setEditExpenseVisible(false);
      setExpenseCategoryDetailsVisible(false);
      await reload();
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
            {(selectedExpenseCategory?.items || []).map((item) => <ExpenseRow key={item.id} item={item} onShowNote={showExpenseNote} onEdit={startEditExpense} onDelete={deleteExpense} />)}
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
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

function ExpenseFormModal({ visible, onClose, title, categories, category, setCategory, categoryLocked = false, amount, setAmount, dateValue, setDateValue, description, setDescription, onSave, loading, saveTitle }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
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

const emptyOwnerForm = { name: '', phone: '', national_id: '', email: '', apartmentsText: '', notes: '' };
function OwnersScreen({ token, buildingId, owners, reload, setTab, setInitialPaymentOwnerId }) {
  const [form, setForm] = useState(emptyOwnerForm); const [editingOwner, setEditingOwner] = useState(null); const [loading, setLoading] = useState(false); const [deletingId, setDeletingId] = useState(null); const [ownerFormVisible, setOwnerFormVisible] = useState(false); const [openOwnerMenuId, setOpenOwnerMenuId] = useState(null);
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const resetForm = () => { setForm(emptyOwnerForm); setEditingOwner(null); setOwnerFormVisible(false); setOpenOwnerMenuId(null); };
  const startEdit = (owner) => { setOpenOwnerMenuId(null); setEditingOwner(owner); setForm({ name: owner.name || '', phone: owner.phone || '', national_id: owner.national_id || owner.login || '', email: owner.email || '', apartmentsText: (owner.apartments || []).join('، '), notes: owner.notes || '' }); setOwnerFormVisible(true); };
  const payload = () => ({ name: form.name.trim(), phone: form.phone.trim(), national_id: form.national_id.trim(), email: form.email.trim(), notes: form.notes.trim(), apartments: form.apartmentsText.split(/[،,\n]+/).map((n) => n.trim()).filter(Boolean).map((number) => ({ number })) });
  const setApartmentNumbers = (value) => setField('apartmentsText', value.replace(/[^0-9،,\n\s]/g, ''));
  const save = async () => { const data = payload(); if (!data.name || data.apartments.length === 0) return Alert.alert('تنبيه', 'أدخل اسم المالك ورقم شقة واحد على الأقل'); if (data.apartments.some((apartment) => !/^\d+$/.test(apartment.number))) return Alert.alert('تنبيه', 'رقم الشقة يجب أن يكون أرقام فقط'); try { setLoading(true); await request(`/buildings/${buildingId}/owners${editingOwner ? `/${editingOwner.id}` : ''}`, { method: editingOwner ? 'PUT' : 'POST', body: JSON.stringify(data) }, token); resetForm(); await reload(); Alert.alert('تم', editingOwner ? 'تم تعديل بيانات المالك' : 'تم إضافة المالك'); } catch (e) { Alert.alert('تعذر حفظ المالك', e.message); } finally { setLoading(false); } };
  const remove = async (owner) => { try { setOpenOwnerMenuId(null); setDeletingId(owner.id); await request(`/buildings/${buildingId}/owners/${owner.id}`, { method: 'DELETE' }, token); await reload(); } catch (e) { Alert.alert('تعذر حذف المالك', e.message); } finally { setDeletingId(null); } }; const openOwnerPayments = (owner) => { setOpenOwnerMenuId(null); setInitialPaymentOwnerId?.(owner.id); setTab?.('payments'); };
  return <View style={styles.screenWrapper}><ScrollView contentContainerStyle={[styles.screenContent, styles.ownersScreenContent]}><ScreenCode code="#S-002" />{(owners || []).length === 0 ? <EmptyState icon="people-outline" title="لا يوجد ملاك" text="اضغط زر الإضافة العائم لإضافة أول مالك لهذا المبنى." /> : null}{(owners || []).map((owner) => <View key={owner.id} style={[styles.manageOwnerCard, styles.manageOwnerCardWithMenu]}><Pressable onPress={() => setOpenOwnerMenuId(openOwnerMenuId === owner.id ? null : owner.id)} style={({ pressed }) => [styles.ownerCardMenuButton, pressed && styles.pressed]}><MaterialCommunityIcons name="dots-vertical-circle-outline" size={24} color="#0f766e" /></Pressable>{openOwnerMenuId === owner.id ? <View style={styles.ownerCardMenu}><Pressable style={({ pressed }) => [styles.ownerCardMenuItem, pressed && styles.pressed]} onPress={() => startEdit(owner)}><Ionicons name="create-outline" size={18} color="#0f766e" /><Text style={styles.ownerCardMenuText}>تعديل</Text></Pressable><Pressable style={({ pressed }) => [styles.ownerCardMenuItem, pressed && styles.pressed]} onPress={() => Alert.alert('حذف المالك', `هل تريد حذف ${owner.name}؟`, [{ text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: () => remove(owner) }])} disabled={deletingId === owner.id}>{deletingId === owner.id ? <ActivityIndicator size="small" color="#ef4444" /> : <Ionicons name="trash-outline" size={18} color="#ef4444" />}<Text style={[styles.ownerCardMenuText, styles.deleteText]}>حذف</Text></Pressable><Pressable style={({ pressed }) => [styles.ownerCardMenuItem, pressed && styles.pressed]} onPress={() => openOwnerPayments(owner)}><Ionicons name="wallet-outline" size={18} color="#0f766e" /><Text style={styles.ownerCardMenuText}>الدفعات</Text></Pressable></View> : null}<OwnerCard owner={owner} /><View style={styles.ownerMetaRow}><Text style={styles.ownerMeta}>الدخول: {owner.login || owner.national_id || owner.phone || '-'}</Text><Text style={styles.ownerMeta}>الجوال: {owner.phone || '-'}</Text></View></View>)}</ScrollView><Pressable onPress={() => { setForm(emptyOwnerForm); setEditingOwner(null); setOwnerFormVisible(true); }} style={({ pressed }) => [styles.ownerFloatingAdd, pressed && styles.pressed]}><Ionicons name="person-add" size={24} color="#fff" /></Pressable><Modal visible={ownerFormVisible} transparent animationType="fade" onRequestClose={resetForm}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}><Pressable style={styles.modalBackdrop} onPress={resetForm} /><View style={styles.floatingFormCard}><View style={styles.floatingFormHeader}><Pressable onPress={resetForm} style={styles.closeFloatingBtn}><Ionicons name="close" size={22} color="#0f172a" /></Pressable><View style={styles.flex1}><Text style={styles.screenCodeText}>{editingOwner ? '#S-009' : '#S-008'}</Text><Text style={styles.floatingFormTitle}>{editingOwner ? 'تعديل بيانات المالك' : 'إضافة مالك'}</Text></View></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.floatingFormBody}><Field label="اسم المالك" value={form.name} onChangeText={(v) => setField('name', v)} placeholder="اسم المالك" /><Field label="رقم الجوال" value={form.phone} onChangeText={(v) => setField('phone', v)} placeholder="05xxxxxxxx" keyboardType="phone-pad" /><Field label="رقم الهوية أو اسم الدخول" value={form.national_id} onChangeText={(v) => setField('national_id', v)} placeholder="اسم دخول المالك" /><Field label="البريد الإلكتروني" value={form.email} onChangeText={(v) => setField('email', v)} placeholder="اختياري" keyboardType="email-address" /><Field label="رقم الشقة *" value={form.apartmentsText} onChangeText={setApartmentNumbers} placeholder="مطلوب - أرقام فقط مثال: 1، 2، 3" keyboardType="numeric" /><Field label="ملاحظة" value={form.notes} onChangeText={(v) => setField('notes', v)} placeholder="ملاحظة اختيارية" multiline /><PrimaryButton title={editingOwner ? 'حفظ التعديل' : 'حفظ المالك'} icon="save-outline" onPress={save} loading={loading} /><PrimaryButton title="إلغاء" icon="close-outline" onPress={resetForm} variant="light" /></ScrollView></View></KeyboardAvoidingView></Modal></View>;
}
function PaymentsScreen({ token, buildingId, owners, payments, reload, initialOwnerId }) {
  const [ownerId, setOwnerId] = useState(null); const [amount, setAmount] = useState(''); const [paymentDate, setPaymentDate] = useState(todayDate()); const [notes, setNotes] = useState(''); const [loading, setLoading] = useState(false);
  useEffect(() => { if (initialOwnerId && owners?.some((owner) => owner.id === initialOwnerId)) { setOwnerId(initialOwnerId); return; } if (!ownerId && owners?.[0]?.id) setOwnerId(owners[0].id); }, [owners, ownerId, initialOwnerId]);
  const add = async () => { const apiDate = normalizeDateForApi(paymentDate); if (!ownerId) return Alert.alert('تنبيه', 'اختر المالك'); if (!amount) return Alert.alert('تنبيه', 'أدخل مبلغ الدفعة'); try { setLoading(true); await request(`/buildings/${buildingId}/payments`, { method: 'POST', body: JSON.stringify({ owner_id: ownerId, amount: Number(amount), payment_date: apiDate, method: 'تحويل', notes }) }, token); setAmount(''); setPaymentDate(todayDate()); setNotes(''); await reload(); } catch (e) { Alert.alert('تعذر إضافة الدفعة', e.message); } finally { setLoading(false); } };
  return <ScrollView contentContainerStyle={styles.screenContent}><SectionTitle icon="card-outline" title="تسجيل دفعة مالك" /><View style={styles.formCard}><Text style={styles.label}>المالك</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>{(owners || []).map((owner) => <Pressable key={owner.id} onPress={() => setOwnerId(owner.id)} style={[styles.chip, ownerId === owner.id && styles.chipActive]}><Text style={[styles.chipText, ownerId === owner.id && styles.chipTextActive]}>{owner.name}</Text></Pressable>)}</ScrollView><Field label="المبلغ" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" /><DatePickerField label="تاريخ الدفعة" value={paymentDate} onChange={setPaymentDate} /><Field label="ملاحظة" value={notes} onChangeText={setNotes} placeholder="ملاحظة اختيارية" multiline /><PrimaryButton title="حفظ الدفعة" icon="save-outline" onPress={add} loading={loading} /></View><SectionTitle icon="wallet-outline" title="آخر الدفعات" />{(payments || []).map((item) => <View key={item.id} style={styles.rowCard}><View style={styles.rowIcon}><Ionicons name="wallet" size={20} color="#0f766e" /></View><View style={styles.flex1}><Text style={styles.cardTitle}>{item.owner?.name || 'مالك'}</Text><Text style={styles.cardSub}>{displayDate(item.payment_date)} - {displayTextDates(item.notes || item.method) || 'دفعة'}</Text></View><Text style={styles.amountText}>{money(item.amount)}</Text></View>)}</ScrollView>;
}
function SettingsScreen({ dashboard, setTab, user }) { const count = dashboard?.stats?.apartment_count || 0; const cycle = displayDate(dashboard?.building?.annual_cycle_starts_on, 'غير محدد'); return <ScrollView contentContainerStyle={styles.screenContent}><ScreenCode code="#S-005" /><SectionTitle icon="settings-outline" title="الإعدادات" /><Text style={styles.settingsHint}>روابط التحكم الرئيسية للمبنى.</Text><SettingsLink icon="people-outline" title="التحكم بالملاك" text="إضافة، تعديل، حذف الملاك وربط الشقق" onPress={() => setTab('owners')} /><SettingsLink icon="receipt-outline" title="التحكم بالمصروفات" text="إضافة المصروفات ومتابعة مصروفات المبنى" onPress={() => setTab('expenses')} />{user?.role === 'admin' ? <SettingsLink icon="pricetags-outline" title="الأنواع الأساسية للصرف" text="إضافة وتعديل أنواع الصرف الأساسية للـ admin" onPress={() => setTab('expenseCategories')} /> : null}<SettingsLink icon="business-outline" title="إعدادات المبنى" text={`عدد الشقق: ${count} - بداية الدورة: ${cycle}`} onPress={() => setTab('buildingSettings')} /></ScrollView>; }
function SettingsLink({ icon, title, text, onPress }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.settingsLink, pressed && styles.pressed]}><View style={styles.settingsIcon}><Ionicons name={icon} size={24} color="#0f766e" /></View><View style={styles.flex1}><Text style={styles.settingsTitle}>{title}</Text><Text style={styles.settingsText}>{displayTextDates(text)}</Text></View><Ionicons name="chevron-back" size={22} color="#64748b" /></Pressable>; }
function BuildingSettingsScreen({ token, buildingId, dashboard, reload, setTab }) {
  const [buildingName, setBuildingName] = useState(dashboard?.building?.name || ''); const [apartmentCount, setApartmentCount] = useState(String(dashboard?.stats?.apartment_count || '')); const [annualCycleStartsOn, setAnnualCycleStartsOn] = useState(normalizeDateForApi(dashboard?.building?.annual_cycle_starts_on || todayDate())); const [loading, setLoading] = useState(false);
  useEffect(() => { setBuildingName(dashboard?.building?.name || ''); setApartmentCount(String(dashboard?.stats?.apartment_count || '')); setAnnualCycleStartsOn(normalizeDateForApi(dashboard?.building?.annual_cycle_starts_on || todayDate())); }, [dashboard?.building?.name, dashboard?.stats?.apartment_count, dashboard?.building?.annual_cycle_starts_on]);
  const save = async () => { const count = Number(apartmentCount); const apiDate = normalizeDateForApi(annualCycleStartsOn); const nextName = String(buildingName || '').trim(); if (!nextName) return Alert.alert('تنبيه', 'أدخل اسم المبنى'); if (!Number.isInteger(count) || count < 0) return Alert.alert('تنبيه', 'أدخل عدد الشقق بشكل صحيح'); try { setLoading(true); await request(`/buildings/${buildingId}/apartment-count`, { method: 'PUT', body: JSON.stringify({ name: nextName, apartment_count: count, annual_cycle_starts_on: apiDate || null }) }, token); await reload(); Alert.alert('تم', 'تم حفظ إعدادات المبنى'); setTab('settings'); } catch (e) { Alert.alert('تعذر حفظ إعدادات المبنى', e.message); } finally { setLoading(false); } };
  return <ScrollView contentContainerStyle={styles.screenContent}><ScreenCode code="#S-006" /><SectionTitle icon="business-outline" title="إعدادات المبنى" /><View style={styles.formCard}><Field label="اسم المبنى" value={buildingName} onChangeText={setBuildingName} placeholder="اسم المبنى" /><Field label="عدد الشقق" value={apartmentCount} onChangeText={setApartmentCount} keyboardType="numeric" placeholder="مثال: 12" /><DatePickerField label="تاريخ بداية الدورة السنوية" value={annualCycleStartsOn} onChange={setAnnualCycleStartsOn} /><Text style={styles.settingsHint}>تاريخ بداية الدورة يحدد بداية السنة المالية للمصروفات والتقارير.</Text><Text style={styles.settingsHint}>عند زيادة العدد سيتم إنشاء الشقق الناقصة تلقائيًا بأرقام متسلسلة.</Text><PrimaryButton title="حفظ إعدادات المبنى" icon="save-outline" onPress={save} loading={loading} /><PrimaryButton title="رجوع للإعدادات" icon="arrow-forward-outline" onPress={() => setTab('settings')} variant="light" /></View></ScrollView>;
}
function OwnerOnlyScreen({ token }) { const [data, setData] = useState(null); const [loading, setLoading] = useState(true); useEffect(() => { request('/owner/dashboard', {}, token).then(setData).catch((e) => Alert.alert('خطأ', e.message)).finally(() => setLoading(false)); }, [token]); if (loading) return <LoadingScreen />; const profile = data?.owners?.[0]; if (!profile) return <EmptyState icon="home-outline" title="لا توجد بيانات" text="لم يتم ربط حسابك بمالك بعد." />; return <ScrollView contentContainerStyle={styles.screenContent}><ScreenCode code="#S-012" /><Dashboard dashboard={{ building: profile.building, stats: {}, owners: [profile.summary] }} /><SectionTitle icon="receipt-outline" title="تفصيل نصيبك من المصروفات" />{(profile.expenses || []).map((item) => <ExpenseRow key={item.id} item={{ ...item, amount: item.owner_share }} />)}</ScrollView>; }
function useAutomaticOtaUpdates() {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return undefined;

    let alive = true;
    let checking = false;
    let lastCheckAt = 0;

    const checkAndApply = async () => {
      const now = Date.now();
      if (!alive || checking || now - lastCheckAt < 30000) return;
      checking = true;
      lastCheckAt = now;
      try {
        const result = await Updates.checkForUpdateAsync();
        if (alive && result.isAvailable) {
          await Updates.fetchUpdateAsync();
          if (alive) await Updates.reloadAsync();
        }
      } catch (error) {
        console.warn('BM automatic update check failed', error?.message || error);
      } finally {
        checking = false;
      }
    };

    checkAndApply();
    const { AppState } = require('react-native');
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkAndApply();
    });
    const timer = setInterval(checkAndApply, 30 * 60 * 1000);

    return () => {
      alive = false;
      clearInterval(timer);
      subscription?.remove?.();
    };
  }, []);
}

function LoadingScreen() { return <View style={styles.loading}><ActivityIndicator color="#0f766e" size="large" /><Text style={styles.loadingText}>جاري التحميل...</Text></View>; }
function AppShell({ token, user, selectedBuilding, setSelectedBuilding, onLogout }) { const [tab, setTab] = useState('dashboard'); const [initialPaymentOwnerId, setInitialPaymentOwnerId] = useState(null); const [dashboard, setDashboard] = useState(null); const [expenses, setExpenses] = useState([]); const [payments, setPayments] = useState([]); const [expenseCategories, setExpenseCategories] = useState([]); const [loading, setLoading] = useState(true); const reload = async () => { if (!selectedBuilding) return; setLoading(true); try { const [dash, expenseData, paymentData, categoryData] = await Promise.all([request(`/buildings/${selectedBuilding.id}/dashboard`, {}, token), request(`/buildings/${selectedBuilding.id}/expenses`, {}, token), request(`/buildings/${selectedBuilding.id}/payments`, {}, token), request(`/buildings/${selectedBuilding.id}/expense-categories`, {}, token)]); setDashboard(dash); setExpenses(expenseData.data || []); setPayments(paymentData.data || []); setExpenseCategories(categoryData.data || []); } catch (e) { Alert.alert('تعذر تحميل البيانات', e.message); } finally { setLoading(false); } }; useEffect(() => { reload(); }, [selectedBuilding?.id]); if (user?.role === 'owner') return <SafeAreaView style={styles.container}><Header title="حسابي" subtitle={user.name} onLogout={onLogout} /><OwnerOnlyScreen token={token} /></SafeAreaView>; const owners = dashboard?.owners || []; return <SafeAreaView style={styles.container}><Header title={tab === 'owners' ? 'إدارة الملاك' : selectedBuilding?.name || 'المبنى'} subtitle="إدارة اتحاد الملاك" onLogout={onLogout} onBack={() => setSelectedBuilding(null)} />{loading ? <LoadingScreen /> : <>{tab === 'dashboard' && <Dashboard dashboard={dashboard} />}{tab === 'owners' && <OwnersScreen token={token} buildingId={selectedBuilding.id} owners={owners} reload={reload} setTab={setTab} setInitialPaymentOwnerId={setInitialPaymentOwnerId} />}{tab === 'expenses' && <ExpensesScreen token={token} buildingId={selectedBuilding.id} expenses={expenses} categories={expenseCategories} reload={reload} />}{tab === 'expenseCategories' && <ExpenseCategoriesScreen token={token} buildingId={selectedBuilding.id} categories={expenseCategories} reload={reload} user={user} />}{tab === 'payments' && <PaymentsScreen token={token} buildingId={selectedBuilding.id} owners={owners} payments={payments} reload={reload} initialOwnerId={initialPaymentOwnerId} />}{tab === 'settings' && <SettingsScreen dashboard={dashboard} setTab={setTab} user={user} />}{tab === 'buildingSettings' && <BuildingSettingsScreen token={token} buildingId={selectedBuilding.id} dashboard={dashboard} reload={reload} setTab={setTab} />}</>}<View style={styles.tabs}><TabButton active={tab === 'dashboard'} icon="grid-outline" title="الملخص" onPress={() => setTab('dashboard')} /><TabButton active={tab === 'owners'} icon="people-outline" title="الملاك" onPress={() => setTab('owners')} /><TabButton active={tab === 'expenses'} icon="receipt-outline" title="المصروفات" onPress={() => setTab('expenses')} /><TabButton active={tab === 'payments'} icon="wallet-outline" title="الدفعات" onPress={() => setTab('payments')} /><TabButton active={tab === 'settings' || tab === 'buildingSettings' || tab === 'expenseCategories'} icon="settings-outline" title="الإعدادات" onPress={() => setTab('settings')} /></View></SafeAreaView>; }
function TabButton({ active, icon, title, onPress }) { return <Pressable onPress={onPress} style={styles.tabBtn}><Ionicons name={icon} size={21} color={active ? '#0f766e' : '#94a3b8'} /><Text style={[styles.tabText, active && styles.tabTextActive]}>{title}</Text></Pressable>; }
export default function App() {
  useAutomaticOtaUpdates();
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
      : !selectedBuilding && user?.role !== 'owner'
        ? <BuildingPicker user={user} onSelect={setSelectedBuilding} onLogout={logout} />
        : <AppShell token={token} user={user} selectedBuilding={selectedBuilding} setSelectedBuilding={setSelectedBuilding} onLogout={logout} />}
  </SafeAreaProvider>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' }, screenWrapper: { flex: 1, backgroundColor: '#f8fafc' }, loginContainer: { flex: 1, backgroundColor: '#ecfdf5' }, loginContent: { flex: 1, padding: 22, justifyContent: 'center' }, logoCircle: { width: 98, height: 98, borderRadius: 49, backgroundColor: '#fff', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 }, appName: { fontSize: 27, fontWeight: '900', textAlign: 'center', color: '#0f172a' }, subtitle: { fontSize: 14, color: '#475569', textAlign: 'center', marginTop: 8, lineHeight: 23 }, loginCard: { backgroundColor: '#fff', borderRadius: 24, padding: 18, marginTop: 24, shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 },
  field: { marginBottom: 12 }, requiredHint: { color: '#ef4444', fontSize: 11, fontWeight: '800', textAlign: 'right', marginTop: 4 }, label: { color: '#334155', fontSize: 13, fontWeight: '800', textAlign: 'right', marginBottom: 6 }, input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0f172a' }, dateInput: { minHeight: 54, justifyContent: 'center', flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }, dateInputText: { flex: 1, textAlign: 'right', color: '#0f172a', fontWeight: '900' }, datePlaceholder: { color: '#94a3b8' }, textarea: { minHeight: 82, textAlignVertical: 'top' }, button: { height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 8, marginTop: 8 }, button_primary: { backgroundColor: '#0f766e' }, button_light: { backgroundColor: '#ecfdf5' }, buttonText: { color: '#fff', fontWeight: '900', fontSize: 15 }, buttonTextLight: { color: '#0f766e' }, pressed: { opacity: 0.75 },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 10 }, headerActions: { flexDirection: 'row', gap: 8 }, circleBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }, circleBtnLabel: { fontSize: 9, color: '#64748b', fontWeight: '900', marginTop: 1 }, headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', textAlign: 'right' }, headerSubtitle: { fontSize: 12, color: '#64748b', textAlign: 'right', marginTop: 2 }, flex1: { flex: 1 },
  listContent: { padding: 16, gap: 12 }, buildingCard: { backgroundColor: '#fff', padding: 16, borderRadius: 22, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }, buildingIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center' }, cardTitle: { fontWeight: '900', color: '#0f172a', fontSize: 15, textAlign: 'right' }, cardSub: { color: '#64748b', fontSize: 12, marginTop: 3, textAlign: 'right' },
  screenContent: { padding: 16, paddingBottom: 110 }, ownersScreenContent: { paddingTop: 44 }, expensesScreenContent: { paddingTop: 14 }, expensesScreenCodeBadge: { transform: [{ translateX: 150 }] }, heroCard: { backgroundColor: '#0f766e', borderRadius: 26, padding: 18, flexDirection: 'row-reverse', alignItems: 'center', gap: 14, marginBottom: 14 }, heroIcon: { width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }, heroTitle: { color: '#fff', fontWeight: '900', fontSize: 20, textAlign: 'right' }, heroSub: { color: '#ccfbf1', marginTop: 4, textAlign: 'right' },
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 }, statCard: { width: '48.5%', backgroundColor: '#fff', borderRadius: 22, padding: 14, minHeight: 122, borderWidth: 1, borderColor: '#e2e8f0' }, statIconWrap: { width: 40, height: 40, borderRadius: 15, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, statTitle: { color: '#64748b', fontSize: 12, textAlign: 'right' }, statValue: { color: '#0f172a', fontSize: 15, fontWeight: '900', marginTop: 6, textAlign: 'right' }, warningCard: { backgroundColor: '#fff7ed', borderColor: '#fed7aa', borderWidth: 1, borderRadius: 18, padding: 12, marginTop: 12 }, warningTitle: { color: '#9a3412', fontWeight: '900', textAlign: 'right' }, warningText: { color: '#9a3412', textAlign: 'right', marginTop: 4 },
  sectionTitle: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, marginTop: 18, marginBottom: 10 }, sectionText: { fontSize: 17, fontWeight: '900', color: '#0f172a' }, screenCodeBadge: { alignSelf: 'flex-start', backgroundColor: '#e0f2fe', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 2 }, screenCodeText: { color: '#0369a1', fontWeight: '900', fontSize: 11, textAlign: 'right' },
  ownerCard: { backgroundColor: '#fff', borderRadius: 17, padding: 9, borderWidth: 1, borderColor: '#e2e8f0' }, ownerTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 }, ownerAvatar: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }, badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }, badgeDue: { backgroundColor: '#fee2e2' }, badgeSurplus: { backgroundColor: '#dcfce7', transform: [{ translateX: 50 }] }, badgeBalanced: { backgroundColor: '#e0f2fe' }, badgeText: { color: '#0f172a', fontWeight: '800', fontSize: 10 }, ownerAmounts: { flexDirection: 'row-reverse', gap: 6, marginTop: 7, flexWrap: 'wrap' }, smallAmount: { flexGrow: 1, minWidth: '45%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 6 }, smallTitle: { fontSize: 10, color: '#64748b', textAlign: 'right' }, smallValue: { fontSize: 12, color: '#0f172a', fontWeight: '900', textAlign: 'right', marginTop: 2 },
  formCard: { backgroundColor: '#fff', borderRadius: 22, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' }, chipsRow: { flexDirection: 'row-reverse', gap: 8, paddingVertical: 4 }, chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' }, chipActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' }, chipText: { color: '#475569', fontWeight: '800' }, chipTextActive: { color: '#fff' }, rowCard: { backgroundColor: '#fff', borderRadius: 18, padding: 13, marginBottom: 9, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e2e8f0' }, rowIcon: { width: 40, height: 40, borderRadius: 15, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' }, amountText: { color: '#0f172a', fontWeight: '900' },
  expenseCompactCard: { minHeight: 72, backgroundColor: '#fff', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 9, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  expenseInfo: { flex: 1, minWidth: 0 }, expenseMainLine: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, expenseDateText: { color: '#64748b', fontSize: 13, fontWeight: '700', textAlign: 'right' },
  expenseIconActions: { flexDirection: 'row', alignItems: 'center', gap: 6 }, expenseIconBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }, expenseIconBtnMuted: { backgroundColor: '#fff' }, expenseEditIconBtn: { backgroundColor: '#ecfdf5', borderColor: '#d1fae5' }, expenseDeleteIconBtn: { backgroundColor: '#fef2f2', borderColor: '#fee2e2' },
  categoryModalAddBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 },
  lockedCategoryField: { minHeight: 54, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start', gap: 8, marginBottom: 12 }, lockedCategoryText: { color: '#0f766e', fontWeight: '900', fontSize: 15, textAlign: 'right' },
  expenseSummaryCard: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#dbe5ea', padding: 16, marginBottom: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 14, shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 }, expenseSummaryMain: { flex: 1, alignItems: 'flex-end' }, expenseSummaryLabel: { color: '#64748b', fontSize: 12, fontWeight: '800', textAlign: 'right' }, expenseSummaryAmount: { color: '#0f172a', fontSize: 23, fontWeight: '900', textAlign: 'right', marginTop: 4 }, expenseSummaryMeta: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textAlign: 'right', marginTop: 4 }, expenseSummaryAddBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  categoryTypeNote: { color: '#64748b', fontSize: 11, marginTop: 4, textAlign: 'right' }, typeDropdownField: { minHeight: 54, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8 }, typeDropdownText: { flex: 1, color: '#0f172a', fontWeight: '900', fontSize: 15, textAlign: 'right' }, typeDropdownMenu: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }, typeDropdownItem: { minHeight: 48, paddingHorizontal: 14, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }, typeDropdownItemActive: { backgroundColor: '#ecfdf5' }, typeDropdownItemText: { flex: 1, color: '#334155', fontWeight: '800', textAlign: 'right' }, typeDropdownItemTextActive: { color: '#0f766e' }, typeDropdownOther: { borderBottomWidth: 0, backgroundColor: '#f8fafc' },
  manageOwnerCard: { marginBottom: 7, backgroundColor: '#fff', borderRadius: 18, padding: 6, borderWidth: 1, borderColor: '#e2e8f0' }, manageOwnerCardWithMenu: { position: 'relative', overflow: 'visible' }, ownerCardMenuButton: { position: 'absolute', top: 11, left: 12, width: 42, height: 42, borderRadius: 21, backgroundColor: '#ecfeff', borderWidth: 1, borderColor: '#a7f3d0', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3, zIndex: 20 }, ownerCardMenu: { position: 'absolute', top: 54, left: 12, width: 132, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 6, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOpacity: 0.14, shadowRadius: 14, elevation: 8, zIndex: 30 }, ownerCardMenuItem: { minHeight: 40, paddingHorizontal: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start', gap: 8 }, ownerCardMenuText: { color: '#0f172a', fontWeight: '900', fontSize: 13, textAlign: 'right' }, ownerMetaRow: { flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap', paddingHorizontal: 3, paddingTop: 4 }, ownerMeta: { fontSize: 10, color: '#64748b', textAlign: 'right' }, actionsRow: { flexDirection: 'row-reverse', gap: 6, marginTop: 6 }, actionBtn: { flex: 1, height: 33, borderRadius: 11, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 5 }, deleteBtn: { backgroundColor: '#fef2f2' }, actionText: { color: '#0f766e', fontWeight: '900', fontSize: 12 }, deleteText: { color: '#ef4444' }, ownerFloatingAdd: { position: 'absolute', top: 8, left: 16, width: 46, height: 46, borderRadius: 23, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.18, shadowRadius: 11, elevation: 8, zIndex: 10 },
  modalRoot: { flex: 1, justifyContent: 'flex-start', paddingTop: Platform.OS === 'ios' ? 70 : 44, paddingHorizontal: 14 }, modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.42)' }, floatingFormCard: { maxHeight: '86%', backgroundColor: '#fff', borderRadius: 26, padding: 14, shadowColor: '#0f172a', shadowOpacity: 0.18, shadowRadius: 18, elevation: 10 }, floatingFormHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 12, marginBottom: 8 }, closeFloatingBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }, floatingFormTitle: { color: '#0f172a', fontWeight: '900', fontSize: 18, textAlign: 'right' }, floatingFormBody: { paddingTop: 4, paddingBottom: 8 },
  settingsHint: { color: '#64748b', textAlign: 'right', lineHeight: 21, marginBottom: 12 }, settingsLink: { backgroundColor: '#fff', borderRadius: 22, padding: 14, marginBottom: 10, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#e2e8f0' }, settingsIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }, settingsTitle: { color: '#0f172a', fontWeight: '900', fontSize: 15, textAlign: 'right' }, settingsText: { color: '#64748b', fontSize: 12, marginTop: 4, textAlign: 'right' },
  tabs: { position: 'absolute', left: 8, right: 8, bottom: Platform.OS === 'ios' ? 20 : 12, backgroundColor: '#fff', borderRadius: 24, padding: 8, flexDirection: 'row-reverse', justifyContent: 'space-around', shadowColor: '#0f172a', shadowOpacity: 0.1, shadowRadius: 18, elevation: 7 }, tabBtn: { alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 54 }, tabText: { fontSize: 10, color: '#94a3b8', fontWeight: '800' }, tabTextActive: { color: '#0f766e' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 28 }, emptyTitle: { color: '#0f172a', fontWeight: '900', fontSize: 17, marginTop: 10 }, emptyText: { color: '#64748b', textAlign: 'center', lineHeight: 21, marginTop: 6 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }, loadingText: { marginTop: 10, color: '#64748b', fontWeight: '800' }
});
