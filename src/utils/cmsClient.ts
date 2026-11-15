import { DEFAULT_CMS_DATA } from '../data/defaultCmsData.ts';
import type { CmsPayload, InquiryItem } from '../types/cms.ts';

const CMS_STORAGE_KEY = 'dansai_hr_cms_v1';
const INQUIRIES_STORAGE_KEY = 'dansai_hr_inquiries_v1';
const PASSCODE_SHA256 = '3610b6b64b9452a5d84d7a44bf6748e78b7cabbc99faba174960f7b2722f6957';

function isJsonResponse(res: Response): boolean {
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json');
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function readLocalCms(): CmsPayload | null {
  try {
    const raw = localStorage.getItem(CMS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CmsPayload;
    if (parsed && parsed.siteSettings && Array.isArray(parsed.navbarMenus)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeLocalCms(cms: CmsPayload): void {
  try {
    localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(cms));
  } catch {
    // ignore storage quota errors
  }
}

function readLocalInquiries(): InquiryItem[] {
  try {
    const raw = localStorage.getItem(INQUIRIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as InquiryItem[]) : [];
  } catch {
    return [];
  }
}

function writeLocalInquiries(items: InquiryItem[]): void {
  try {
    localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

/**
 * โหลดข้อมูล CMS โดยลองเชื่อมต่อ Backend API ก่อน หากไม่มีเซิร์ฟเวอร์ (เช่น GitHub Pages)
 * จะอ่านจากไฟล์ cms-data.json หรือ localStorage ของเบราว์เซอร์โดยอัตโนมัติ
 */
export async function loadCmsData(): Promise<{ cms: CmsPayload; isServerless: boolean }> {
  try {
    const res = await fetch('/api/cms');
    if (res.ok && isJsonResponse(res)) {
      const data = (await res.json()) as CmsPayload;
      if (data?.siteSettings) {
        return { cms: data, isServerless: false };
      }
    }
  } catch {
    // Fallback to static/local mode
  }

  const localSaved = readLocalCms();
  if (localSaved) {
    return { cms: localSaved, isServerless: true };
  }

  try {
    const staticRes = await fetch('./cms-data.json');
    if (staticRes.ok && isJsonResponse(staticRes)) {
      const data = (await staticRes.json()) as CmsPayload;
      if (data?.siteSettings) {
        return { cms: data, isServerless: true };
      }
    }
  } catch {
    // Fallback to built-in default
  }

  return { cms: DEFAULT_CMS_DATA, isServerless: true };
}

export async function authenticateAdmin(
  passcode: string
): Promise<{ ok: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });
    if (isJsonResponse(res)) {
      const data = await res.json();
      if (res.ok && data.token) {
        return { ok: true, token: data.token };
      }
      return { ok: false, error: data.error || 'รหัสผ่านไม่ถูกต้อง' };
    }
  } catch {
    // Fallback to client-side hash check when deployed on static hosting
  }

  const hash = await sha256Hex(passcode);
  if (hash === PASSCODE_SHA256) {
    return { ok: true, token: `local-session-${Date.now()}` };
  }
  return { ok: false, error: 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง' };
}

export async function verifyAdminSession(token: string): Promise<boolean> {
  if (token.startsWith('local-session-')) {
    return true;
  }
  try {
    const res = await fetch('/api/auth/verify', {
      headers: { 'x-admin-token': token },
    });
    if (res.ok && isJsonResponse(res)) {
      const data = await res.json();
      return Boolean(data.authenticated);
    }
  } catch {
    // ignore
  }
  return false;
}

export async function saveCmsData(
  nextCms: CmsPayload,
  token: string
): Promise<{ ok: boolean; cms?: CmsPayload; unauthorized?: boolean }> {
  if (!token.startsWith('local-session-')) {
    try {
      const res = await fetch('/api/cms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify(nextCms),
      });
      if (res.status === 401) {
        return { ok: false, unauthorized: true };
      }
      if (res.ok && isJsonResponse(res)) {
        const data = await res.json();
        return { ok: true, cms: data.cms || nextCms };
      }
    } catch {
      // Fallback to localStorage
    }
  }

  writeLocalCms(nextCms);
  return { ok: true, cms: nextCms };
}

export async function resetCmsData(token: string): Promise<{ ok: boolean; cms: CmsPayload }> {
  if (!token.startsWith('local-session-')) {
    try {
      const res = await fetch('/api/cms/reset', {
        method: 'POST',
        headers: { 'x-admin-token': token },
      });
      if (res.ok && isJsonResponse(res)) {
        const data = await res.json();
        return { ok: true, cms: data.cms || DEFAULT_CMS_DATA };
      }
    } catch {
      // Fallback
    }
  }

  try {
    localStorage.removeItem(CMS_STORAGE_KEY);
  } catch {
    // ignore
  }
  return { ok: true, cms: DEFAULT_CMS_DATA };
}

export async function submitPublicInquiry(payload: {
  fullName: string;
  contact: string;
  department: string;
  topic: string;
  message: string;
}): Promise<{ ok: boolean; inquiry?: InquiryItem; error?: string }> {
  try {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (isJsonResponse(res)) {
      const data = await res.json();
      if (res.ok) {
        return { ok: true, inquiry: data.inquiry };
      }
      return { ok: false, error: data.error || 'ไม่สามารถส่งข้อมูลได้' };
    }
  } catch {
    // Fallback to local storage in serverless static hosting
  }

  const now = new Date();
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
  ];
  const thaiYear = (now.getFullYear() + 543) % 100;
  const current = readLocalInquiries();
  const newInquiry: InquiryItem = {
    id: `inq-${Date.now()}`,
    fullName: payload.fullName,
    contact: payload.contact,
    department: payload.department || 'ไม่ระบุแผนก/ฝ่าย',
    topic: payload.topic,
    message: payload.message,
    status: 'pending',
    createdAt: `${now.getDate()} ${thaiMonths[now.getMonth()]} 25${thaiYear} · ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`,
    ticketCode: `HR-${thaiYear}${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      current.length + 1
    ).padStart(3, '0')}`,
  };
  writeLocalInquiries([newInquiry, ...current]);
  return { ok: true, inquiry: newInquiry };
}

export async function loadAdminInquiries(token: string): Promise<InquiryItem[]> {
  if (!token.startsWith('local-session-')) {
    try {
      const res = await fetch('/api/inquiries', {
        headers: { 'x-admin-token': token },
      });
      if (res.ok && isJsonResponse(res)) {
        const data = await res.json();
        return Array.isArray(data.inquiries) ? data.inquiries : [];
      }
    } catch {
      // Fallback
    }
  }
  return readLocalInquiries();
}

export async function updateAdminInquiryStatus(
  id: string,
  status: 'pending' | 'resolved',
  token: string
): Promise<boolean> {
  if (!token.startsWith('local-session-')) {
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok && isJsonResponse(res)) return true;
    } catch {
      // Fallback
    }
  }
  const next = readLocalInquiries().map((item) =>
    item.id === id ? { ...item, status } : item
  );
  writeLocalInquiries(next);
  return true;
}

export async function deleteAdminInquiry(id: string, token: string): Promise<boolean> {
  if (!token.startsWith('local-session-')) {
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      });
      if (res.ok && isJsonResponse(res)) return true;
    } catch {
      // Fallback
    }
  }
  const next = readLocalInquiries().filter((item) => item.id !== id);
  writeLocalInquiries(next);
  return true;
}
