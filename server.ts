import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { DEFAULT_CMS_DATA } from './src/data/defaultCmsData.ts';
import type { CmsPayload, InquiryItem } from './src/types/cms.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'Hr.42120';
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'dansai-hr-portal-secret-key-2569';

const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'cms-store.json');

interface StoreSchema {
  cms: CmsPayload;
  inquiries: InquiryItem[];
}

/**
 * ตรวจสอบและสร้างไฟล์ฐานข้อมูล JSON เริ่มต้นหากยังไม่มี
 */
function ensureStore(): StoreSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const initial: StoreSchema = {
      cms: structuredClone(DEFAULT_CMS_DATA),
      inquiries: [
        {
          id: 'inq-demo-1',
          fullName: 'นางสาวกัญญา ใจดี',
          contact: '089-412-5589',
          department: 'แผนกวิชาคอมพิวเตอร์ธุรกิจ',
          topic: 'หนังสือรับรอง/ก.พ.7',
          message: 'ขอความอนุเคราะห์ออกหนังสือรับรองเงินเดือนสำหรับใช้ยื่นขอสินเชื่อสวัสดิการออมทรัพย์ 1 ฉบับค่ะ',
          status: 'pending',
          createdAt: '14 พ.ย. 2569 · 09:45 น.',
          ticketCode: 'HR-6911-001',
        },
      ],
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as StoreSchema;
    if (!parsed.cms || !parsed.cms.siteSettings) {
      throw new Error('Invalid store format');
    }
    return parsed;
  } catch {
    const fallback: StoreSchema = {
      cms: structuredClone(DEFAULT_CMS_DATA),
      inquiries: [],
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

function saveStore(store: StoreSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

function signAdminToken(issuedAt: number): string {
  const payload = `admin:${issuedAt}`;
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(':');
  if (parts.length !== 3) return false;
  const [role, issuedAtStr, sig] = parts;
  if (role !== 'admin') return false;
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt)) return false;
  // Token expires after 24 hours
  if (Date.now() - issuedAt > 24 * 60 * 60 * 1000) return false;

  const expectedSig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${role}:${issuedAtStr}`)
    .digest('hex');

  const sigBuf = Buffer.from(sig, 'utf-8');
  const expectedBuf = Buffer.from(expectedSig, 'utf-8');
  if (sigBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = req.header('x-admin-token');
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'กรุณาเข้าสู่ระบบผู้ดูแลก่อนดำเนินการ' });
    return;
  }
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Ensure initial store exists at startup
  ensureStore();

  // --- Public CMS Endpoints ---
  app.get('/api/cms', (_req: Request, res: Response) => {
    const store = ensureStore();
    res.json(store.cms);
  });

  // --- Admin Auth Endpoints ---
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (!passcode || passcode !== ADMIN_PASSCODE) {
      res.status(401).json({ error: 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง' });
      return;
    }
    const token = signAdminToken(Date.now());
    res.json({ token, role: 'admin' });
  });

  app.get('/api/auth/verify', (req: Request, res: Response) => {
    const token = req.header('x-admin-token');
    res.json({ authenticated: verifyAdminToken(token) });
  });

  // --- Admin CMS Update & Reset Endpoints ---
  app.put('/api/cms', requireAdmin, (req: Request, res: Response) => {
    const body = req.body as Partial<CmsPayload>;
    if (
      !body ||
      !Array.isArray(body.navbarMenus) ||
      !Array.isArray(body.services) ||
      !Array.isArray(body.news) ||
      !Array.isArray(body.faqs) ||
      !body.siteSettings
    ) {
      res.status(400).json({ error: 'โครงสร้างข้อมูล CMS ไม่ครบถ้วน' });
      return;
    }
    const store = ensureStore();
    store.cms = {
      navbarMenus: body.navbarMenus,
      services: body.services,
      news: body.news,
      faqs: body.faqs,
      siteSettings: body.siteSettings,
    };
    saveStore(store);
    res.json({ ok: true, cms: store.cms });
  });

  app.post('/api/cms/reset', requireAdmin, (_req: Request, res: Response) => {
    const store = ensureStore();
    store.cms = structuredClone(DEFAULT_CMS_DATA);
    saveStore(store);
    res.json({ ok: true, cms: store.cms });
  });

  // --- Public & Admin Inquiries Endpoints ---
  app.post('/api/inquiries', (req: Request, res: Response) => {
    const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
    const contact = typeof req.body?.contact === 'string' ? req.body.contact.trim() : '';
    const department = typeof req.body?.department === 'string' ? req.body.department.trim() : '';
    const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : '';
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

    if (fullName.length < 3 || contact.length < 5 || !topic || message.length < 10) {
      res.status(400).json({ error: 'กรุณากรอกข้อมูลติดต่อและรายละเอียดให้ครบถ้วน' });
      return;
    }

    const store = ensureStore();
    const now = new Date();
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
    ];
    const thaiYear = (now.getFullYear() + 543) % 100;
    const formattedDate = `${now.getDate()} ${thaiMonths[now.getMonth()]} 25${thaiYear} · ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;
    const ticketCode = `HR-${thaiYear}${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      store.inquiries.length + 1
    ).padStart(3, '0')}`;

    const newInquiry: InquiryItem = {
      id: `inq-${Date.now()}`,
      fullName,
      contact,
      department: department || 'ไม่ระบุแผนก/ฝ่าย',
      topic,
      message,
      status: 'pending',
      createdAt: formattedDate,
      ticketCode,
    };

    store.inquiries.unshift(newInquiry);
    saveStore(store);
    res.status(201).json({ ok: true, inquiry: newInquiry });
  });

  app.get('/api/inquiries', requireAdmin, (_req: Request, res: Response) => {
    const store = ensureStore();
    res.json({ inquiries: store.inquiries });
  });

  app.patch('/api/inquiries/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const status = req.body?.status === 'resolved' ? 'resolved' : 'pending';
    const store = ensureStore();
    const target = store.inquiries.find((item) => item.id === id);
    if (!target) {
      res.status(404).json({ error: 'ไม่พบรายการข้อความที่ระบุ' });
      return;
    }
    target.status = status;
    saveStore(store);
    res.json({ ok: true, inquiry: target });
  });

  app.delete('/api/inquiries/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const store = ensureStore();
    store.inquiries = store.inquiries.filter((item) => item.id !== id);
    saveStore(store);
    res.json({ ok: true });
  });

  // --- Vite Dev Middleware or Static Production Build ---
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use('/src/assets/images', express.static(path.join(__dirname, 'src', 'assets', 'images')));
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dan Sai HR Portal running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
