// Utility functions for Proctoring System Check

export interface LatencyResult {
  ping: number; // in ms
  downloadSpeedMbps: number; // in Mbps
  status: 'stable' | 'moderate' | 'poor' | 'offline';
  isOnline: boolean;
}

export interface SecureBrowserResult {
  fullscreen: boolean;
  localStorage: boolean;
  cookies: boolean;
  mediaDevices: boolean;
  webRTC: boolean;
  permissionsApi: boolean;
  status: 'Secure' | 'Partially Supported' | 'Unsupported';
}

export interface ResolutionResult {
  width: number;
  height: number;
  passed: boolean;
}

export interface BrowserInfoResult {
  name: string;
  version: string;
  status: 'supported' | 'warning';
  message: string;
}

export interface DevicePerformanceResult {
  cores: number;
  memoryGb: number | null;
  grade: 'Excellent' | 'Good' | 'Low';
}

export interface BatteryStatusResult {
  supported: boolean;
  charging: boolean;
  level: number; // 0 to 100
  isLow: boolean;
}

export interface PermissionSummaryResult {
  camera: 'granted' | 'prompt' | 'denied' | 'unknown';
  microphone: 'granted' | 'prompt' | 'denied' | 'unknown';
  notifications: 'granted' | 'prompt' | 'denied' | 'unknown';
}

/**
 * Measures network latency (ping) and estimates download speed
 */
export async function measureLatencyAndSpeed(): Promise<LatencyResult> {
  if (!navigator.onLine) {
    return { ping: 9999, downloadSpeedMbps: 0, status: 'offline', isOnline: false };
  }

  try {
    const startTime = performance.now();
    // Cache-busted HEAD request to measure latency
    await fetch('/favicon.svg?cacheBust=' + Date.now(), {
      method: 'HEAD',
      cache: 'no-store'
    });
    const endTime = performance.now();
    const ping = Math.round(endTime - startTime);

    // Measure download speed using favicon payload (~9.5KB)
    const imgStart = performance.now();
    const response = await fetch('/favicon.svg?speedTest=' + Date.now(), { cache: 'no-store' });
    const blob = await response.blob();
    const imgEnd = performance.now();
    const durationSec = (imgEnd - imgStart) / 1000;
    const bitsLoaded = blob.size * 8;
    const downloadSpeedMbps = durationSec > 0 ? parseFloat((bitsLoaded / (durationSec * 1024 * 1024)).toFixed(2)) : 10;

    let status: 'stable' | 'moderate' | 'poor' = 'stable';
    if (ping < 100) {
      status = 'stable';
    } else if (ping <= 250) {
      status = 'moderate';
    } else {
      status = 'poor';
    }

    return {
      ping,
      downloadSpeedMbps,
      status,
      isOnline: true
    };
  } catch (error) {
    // If fetch fails but navigator is online
    return {
      ping: 500,
      downloadSpeedMbps: 0.5,
      status: 'poor',
      isOnline: navigator.onLine
    };
  }
}

/**
 * Verifies secure browser capabilities
 */
export function checkSecureBrowser(): SecureBrowserResult {
  const fullscreen = !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled
  );

  let localStorageAvail = false;
  try {
    const testKey = '__system_check_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    localStorageAvail = true;
  } catch {
    localStorageAvail = false;
  }

  const cookies = navigator.cookieEnabled;
  const mediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const webRTC = !!(
    window.RTCPeerConnection ||
    (window as any).webkitRTCPeerConnection ||
    (window as any).mozRTCPeerConnection
  );
  const permissionsApi = !!navigator.permissions;

  const checks = [fullscreen, localStorageAvail, cookies, mediaDevices, webRTC, permissionsApi];
  const passedCount = checks.filter(Boolean).length;

  let status: 'Secure' | 'Partially Supported' | 'Unsupported' = 'Secure';
  if (passedCount === checks.length) {
    status = 'Secure';
  } else if (passedCount >= 4) {
    status = 'Partially Supported';
  } else {
    status = 'Unsupported';
  }

  return {
    fullscreen,
    localStorage: localStorageAvail,
    cookies,
    mediaDevices,
    webRTC,
    permissionsApi,
    status
  };
}

/**
 * Checks screen resolution against 1366x768 requirement
 */
export function checkScreenResolution(): ResolutionResult {
  const width = window.screen.width;
  const height = window.screen.height;
  const passed = width >= 1366 && height >= 768;

  return {
    width,
    height,
    passed
  };
}

/**
 * Detects browser compatibility (Chrome & Edge are supported, Firefox/Safari/Others raise warnings)
 */
export function detectBrowser(): BrowserInfoResult {
  const ua = navigator.userAgent;
  let name = 'Other';
  let version = '';

  if (ua.includes('Edg/')) {
    name = 'Edge';
    const match = ua.match(/Edg\/([\d.]+)/);
    if (match) version = match[1];
  } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    name = 'Chrome';
    const match = ua.match(/Chrome\/([\d.]+)/);
    if (match) version = match[1];
  } else if (ua.includes('Firefox/')) {
    name = 'Firefox';
    const match = ua.match(/Firefox\/([\d.]+)/);
    if (match) version = match[1];
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    name = 'Safari';
    const match = ua.match(/Version\/([\d.]+)/);
    if (match) version = match[1];
  }

  const isSupported = name === 'Chrome' || name === 'Edge';

  return {
    name,
    version,
    status: isSupported ? 'supported' : 'warning',
    message: isSupported
      ? `${name} ${version ? 'v' + version.split('.')[0] : ''} is fully supported for AI proctoring.`
      : `${name} is not officially supported. Please use Google Chrome or Microsoft Edge for the best experience.`
  };
}

/**
 * Evaluates hardware performance based on available CPU cores & RAM
 */
export function getDevicePerformance(): DevicePerformanceResult {
  const cores = navigator.hardwareConcurrency || 2;
  const memoryGb = (navigator as any).deviceMemory ? (navigator as any).deviceMemory : null;

  let grade: 'Excellent' | 'Good' | 'Low' = 'Good';
  if (cores >= 8 && (memoryGb === null || memoryGb >= 8)) {
    grade = 'Excellent';
  } else if (cores >= 4) {
    grade = 'Good';
  } else {
    grade = 'Low';
  }

  return {
    cores,
    memoryGb,
    grade
  };
}

/**
 * Fetches Battery API status if supported
 */
export async function getBatteryStatus(): Promise<BatteryStatusResult> {
  if ('getBattery' in navigator) {
    try {
      const battery = await (navigator as any).getBattery();
      const charging = battery.charging;
      const level = Math.round(battery.level * 100);
      const isLow = !charging && level < 20;

      return {
        supported: true,
        charging,
        level,
        isLow
      };
    } catch {
      return { supported: false, charging: false, level: 100, isLow: false };
    }
  }

  return { supported: false, charging: false, level: 100, isLow: false };
}

/**
 * Queries current permission statuses for Camera, Microphone, and Notifications
 */
export async function queryPermissionStatuses(): Promise<PermissionSummaryResult> {
  const result: PermissionSummaryResult = {
    camera: 'unknown',
    microphone: 'unknown',
    notifications: 'unknown'
  };

  if (navigator.permissions && navigator.permissions.query) {
    try {
      const camPerm = await navigator.permissions.query({ name: 'camera' as any });
      result.camera = camPerm.state as any;
    } catch {
      result.camera = 'unknown';
    }

    try {
      const micPerm = await navigator.permissions.query({ name: 'microphone' as any });
      result.microphone = micPerm.state as any;
    } catch {
      result.microphone = 'unknown';
    }

    try {
      const notifPerm = await navigator.permissions.query({ name: 'notifications' as any });
      result.notifications = notifPerm.state as any;
    } catch {
      if ('Notification' in window) {
        result.notifications = Notification.permission as any;
      }
    }
  } else if ('Notification' in window) {
    result.notifications = Notification.permission as any;
  }

  return result;
}
