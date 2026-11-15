import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu as MenuIcon,
  Newspaper,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  CmsPayload,
  FaqItem,
  HrService,
  InquiryItem,
  NavbarItem,
  NewsItem,
  ServiceIconKey,
  SiteSettings,
} from '../types/cms.ts';
import { IconRenderer, SERVICE_ICON_OPTIONS } from './IconRenderer.tsx';
import {
  deleteAdminInquiry,
  loadAdminInquiries,
  updateAdminInquiryStatus,
} from '../utils/cmsClient.ts';

type AdminTab =
  | 'overview'
  | 'menus'
  | 'services'
  | 'news'
  | 'faqs'
  | 'settings'
  | 'inquiries';

interface AdminDashboardProps {
  cms: CmsPayload;
  adminToken: string;
  onSaveCms: (nextCms: CmsPayload, toastMessage?: string) => Promise<boolean>;
  onResetCms: () => Promise<boolean>;
  onLogout: () => void;
  onExitAdmin: () => void;
  onNotify: (msg: string) => void;
}

const PRESET_NEWS_IMAGES = [
  {
    label: 'ห้องให้คำปรึกษางานบุคคล',
    url: 'assets/images/news_welfare_service_1794754436897.jpg',
  },
  {
    label: 'การอบรมพัฒนาบุคลากร',
    url: 'assets/images/news_training_workshop_1794754435088.jpg',
  },
  {
    label: 'หอประชุมและพิธีมอบรางวัล',
    url: 'assets/images/news_award_ceremony_1794754437515.jpg',
  },
  {
    label: 'สำนักงานบริหารทรัพยากรบุคคล',
    url: 'assets/images/hero_hr_office_1794754435803.jpg',
  },
];

/**
 * ระบบหลังบ้าน (Admin CMS Workspace)
 * ช่วยให้ผู้ดูแลระบบเพิ่ม ลบ แก้ไข และจัดลำดับเมนูนำทาง บริการงานบุคคล ข่าวสาร FAQ และตั้งค่าเว็บไซต์ได้ทันที
 */
export function AdminDashboard({
  cms,
  adminToken,
  onSaveCms,
  onResetCms,
  onLogout,
  onExitAdmin,
  onNotify,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // --- Menu Editor Modal State ---
  const [menuForm, setMenuForm] = useState<NavbarItem | null>(null);
  const [menuMode, setMenuMode] = useState<'create' | 'edit'>('create');

  // --- Service Editor Modal State ---
  const [serviceForm, setServiceForm] = useState<HrService | null>(null);
  const [serviceMode, setServiceMode] = useState<'create' | 'edit'>('create');

  // --- News Editor Modal State ---
  const [newsForm, setNewsForm] = useState<NewsItem | null>(null);
  const [newsMode, setNewsMode] = useState<'create' | 'edit'>('create');

  // --- FAQ Editor Modal State ---
  const [faqForm, setFaqForm] = useState<FaqItem | null>(null);
  const [faqMode, setFaqMode] = useState<'create' | 'edit'>('create');

  // --- Site Settings Form State ---
  const [settingsDraft, setSettingsDraft] = useState<SiteSettings>(cms.siteSettings);

  useEffect(() => {
    setSettingsDraft(cms.siteSettings);
  }, [cms.siteSettings]);

  const fetchInquiries = async () => {
    setLoadingInquiries(true);
    try {
      const items = await loadAdminInquiries(adminToken);
      setInquiries(items);
    } finally {
      setLoadingInquiries(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [adminToken]);

  const pendingInquiriesCount = inquiries.filter((i) => i.status === 'pending').length;

  const sidebarItems: { id: AdminTab; label: string; icon: typeof LayoutDashboard; count?: number }[] = [
    { id: 'overview', label: 'ภาพรวมระบบ', icon: LayoutDashboard },
    { id: 'menus', label: 'จัดการเมนูนำทาง', icon: MenuIcon, count: cms.navbarMenus.length },
    { id: 'services', label: 'บริการงานบุคคล', icon: Layers, count: cms.services.length },
    { id: 'news', label: 'ข่าวประชาสัมพันธ์', icon: Newspaper, count: cms.news.length },
    { id: 'faqs', label: 'คำถามที่พบบ่อย', icon: HelpCircle, count: cms.faqs.length },
    { id: 'settings', label: 'ตั้งค่าเว็บไซต์ & Hero', icon: Settings },
    { id: 'inquiries', label: 'กล่องข้อความติดต่อ', icon: Inbox, count: pendingInquiriesCount },
  ];

  // ==========================
  // 1. Navbar Menu CRUD Handlers
  // ==========================
  const sortedMenus = [...cms.navbarMenus].sort((a, b) => a.order - b.order);

  const openCreateMenu = () => {
    setMenuMode('create');
    setMenuForm({
      id: `nav-${Date.now()}`,
      label: '',
      href: '#services',
      type: 'anchor',
      visible: true,
      order: sortedMenus.length + 1,
    });
  };

  const openEditMenu = (item: NavbarItem) => {
    setMenuMode('edit');
    setMenuForm({ ...item });
  };

  const handleSubmitMenu = async (e: FormEvent) => {
    e.preventDefault();
    if (!menuForm || !menuForm.label.trim() || !menuForm.href.trim()) {
      onNotify('กรุณากรอกชื่อเมนูและลิงก์ปลายทางให้ครบถ้วน');
      return;
    }

    const updatedMenus =
      menuMode === 'create'
        ? [...cms.navbarMenus, { ...menuForm, label: menuForm.label.trim(), href: menuForm.href.trim() }]
        : cms.navbarMenus.map((m) =>
            m.id === menuForm.id
              ? { ...menuForm, label: menuForm.label.trim(), href: menuForm.href.trim() }
              : m
          );

    const ok = await onSaveCms({ ...cms, navbarMenus: updatedMenus }, 'บันทึกเมนูนำทางเรียบร้อยแล้ว');
    if (ok) setMenuForm(null);
  };

  const moveMenu = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sortedMenus.length) return;
    const cloned = [...sortedMenus];
    const temp = cloned[index];
    cloned[index] = cloned[nextIndex];
    cloned[nextIndex] = temp;
    const reindexed = cloned.map((item, idx) => ({ ...item, order: idx + 1 }));
    await onSaveCms({ ...cms, navbarMenus: reindexed }, 'จัดลำดับเมนูเรียบร้อยแล้ว');
  };

  const toggleMenuVisibility = async (id: string) => {
    const updated = cms.navbarMenus.map((m) =>
      m.id === id ? { ...m, visible: !m.visible } : m
    );
    await onSaveCms({ ...cms, navbarMenus: updated }, 'อัปเดตการแสดงผลเมนูแล้ว');
  };

  const deleteMenu = async (id: string) => {
    const updated = cms.navbarMenus
      .filter((m) => m.id !== id)
      .sort((a, b) => a.order - b.order)
      .map((item, idx) => ({ ...item, order: idx + 1 }));
    await onSaveCms({ ...cms, navbarMenus: updated }, 'ลบเมนูนำทางเรียบร้อยแล้ว');
  };

  // ==========================
  // 2. HR Services CRUD Handlers
  // ==========================
  const sortedServices = [...cms.services].sort((a, b) => a.order - b.order);

  const openCreateService = () => {
    setServiceMode('create');
    setServiceForm({
      id: `srv-${Date.now()}`,
      title: '',
      category: 'บริการทั่วไป',
      description: '',
      url: 'https://',
      icon: 'Link2',
      updatedAt: 'พ.ย. 2569',
      requiredDocs: '',
      visible: true,
      order: sortedServices.length + 1,
    });
  };

  const handleSubmitService = async (e: FormEvent) => {
    e.preventDefault();
    if (!serviceForm || !serviceForm.title.trim() || !serviceForm.url.trim()) {
      onNotify('กรุณากรอกชื่อบริการและลิงก์ระบบให้ครบถ้วน');
      return;
    }

    const cleaned: HrService = {
      ...serviceForm,
      title: serviceForm.title.trim(),
      category: serviceForm.category.trim() || 'บริการทั่วไป',
      description: serviceForm.description.trim(),
      url: serviceForm.url.trim(),
    };

    const updatedServices =
      serviceMode === 'create'
        ? [...cms.services, cleaned]
        : cms.services.map((s) => (s.id === cleaned.id ? cleaned : s));

    const ok = await onSaveCms({ ...cms, services: updatedServices }, 'บันทึกลิงก์บริการงานบุคคลแล้ว');
    if (ok) setServiceForm(null);
  };

  const moveService = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sortedServices.length) return;
    const cloned = [...sortedServices];
    const temp = cloned[index];
    cloned[index] = cloned[nextIndex];
    cloned[nextIndex] = temp;
    const reindexed = cloned.map((item, idx) => ({ ...item, order: idx + 1 }));
    await onSaveCms({ ...cms, services: reindexed }, 'จัดลำดับบริการเรียบร้อยแล้ว');
  };

  const toggleServiceVisibility = async (id: string) => {
    const updated = cms.services.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s));
    await onSaveCms({ ...cms, services: updated }, 'อัปเดตสถานะบริการแล้ว');
  };

  const deleteService = async (id: string) => {
    const updated = cms.services
      .filter((s) => s.id !== id)
      .sort((a, b) => a.order - b.order)
      .map((item, idx) => ({ ...item, order: idx + 1 }));
    await onSaveCms({ ...cms, services: updated }, 'ลบบริการเรียบร้อยแล้ว');
  };

  // ==========================
  // 3. News CRUD Handlers
  // ==========================
  const openCreateNews = () => {
    setNewsMode('create');
    setNewsForm({
      id: `news-${Date.now()}`,
      title: '',
      category: 'ประกาศสำคัญ',
      summary: '',
      content: '',
      imageUrl: PRESET_NEWS_IMAGES[0].url,
      publishedAt: '15 พ.ย. 2569',
      author: 'งานบริหารและพัฒนาทรัพยากรบุคคล',
      featured: false,
      visible: true,
      attachmentUrl: '',
    });
  };

  const handleSubmitNews = async (e: FormEvent) => {
    e.preventDefault();
    if (!newsForm || !newsForm.title.trim() || !newsForm.summary.trim()) {
      onNotify('กรุณากรอกพาดหัวข่าวและคำอธิบายย่อ');
      return;
    }

    const cleaned: NewsItem = {
      ...newsForm,
      title: newsForm.title.trim(),
      summary: newsForm.summary.trim(),
      content: newsForm.content.trim() || newsForm.summary.trim(),
    };

    let updatedNews =
      newsMode === 'create'
        ? [cleaned, ...cms.news]
        : cms.news.map((n) => (n.id === cleaned.id ? cleaned : n));

    if (cleaned.featured) {
      updatedNews = updatedNews.map((n) => ({
        ...n,
        featured: n.id === cleaned.id,
      }));
    }

    const ok = await onSaveCms({ ...cms, news: updatedNews }, 'บันทึกข่าวประชาสัมพันธ์แล้ว');
    if (ok) setNewsForm(null);
  };

  const setFeaturedNews = async (id: string) => {
    const updated = cms.news.map((n) => ({ ...n, featured: n.id === id }));
    await onSaveCms({ ...cms, news: updated }, 'ตั้งเป็นข่าวเด่นเรียบร้อยแล้ว');
  };

  const toggleNewsVisibility = async (id: string) => {
    const updated = cms.news.map((n) => (n.id === id ? { ...n, visible: !n.visible } : n));
    await onSaveCms({ ...cms, news: updated }, 'อัปเดตสถานะข่าวสารแล้ว');
  };

  const deleteNews = async (id: string) => {
    const updated = cms.news.filter((n) => n.id !== id);
    await onSaveCms({ ...cms, news: updated }, 'ลบข่าวประชาสัมพันธ์แล้ว');
  };

  // ==========================
  // 4. FAQ CRUD Handlers
  // ==========================
  const sortedFaqs = [...cms.faqs].sort((a, b) => a.order - b.order);

  const openCreateFaq = () => {
    setFaqMode('create');
    setFaqForm({
      id: `faq-${Date.now()}`,
      question: '',
      answer: '',
      category: 'ทั่วไป',
      visible: true,
      order: sortedFaqs.length + 1,
    });
  };

  const handleSubmitFaq = async (e: FormEvent) => {
    e.preventDefault();
    if (!faqForm || !faqForm.question.trim() || !faqForm.answer.trim()) {
      onNotify('กรุณากรอกคำถามและคำตอบให้ครบถ้วน');
      return;
    }

    const cleaned: FaqItem = {
      ...faqForm,
      question: faqForm.question.trim(),
      answer: faqForm.answer.trim(),
      category: faqForm.category.trim() || 'ทั่วไป',
    };

    const updatedFaqs =
      faqMode === 'create'
        ? [...cms.faqs, cleaned]
        : cms.faqs.map((f) => (f.id === cleaned.id ? cleaned : f));

    const ok = await onSaveCms({ ...cms, faqs: updatedFaqs }, 'บันทึกคำถามที่พบบ่อยแล้ว');
    if (ok) setFaqForm(null);
  };

  const deleteFaq = async (id: string) => {
    const updated = cms.faqs
      .filter((f) => f.id !== id)
      .sort((a, b) => a.order - b.order)
      .map((item, idx) => ({ ...item, order: idx + 1 }));
    await onSaveCms({ ...cms, faqs: updated }, 'ลบคำถามเรียบร้อยแล้ว');
  };

  // ==========================
  // 5. Site Settings Handler
  // ==========================
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    await onSaveCms({ ...cms, siteSettings: settingsDraft }, 'บันทึกการตั้งค่าเว็บไซต์เรียบร้อยแล้ว');
  };

  // ==========================
  // 6. Inquiries Inbox Handlers
  // ==========================
  const toggleInquiryStatus = async (inq: InquiryItem) => {
    const nextStatus = inq.status === 'pending' ? 'resolved' : 'pending';
    const ok = await updateAdminInquiryStatus(inq.id, nextStatus, adminToken);
    if (ok) {
      setInquiries((prev) =>
        prev.map((item) => (item.id === inq.id ? { ...item, status: nextStatus } : item))
      );
      onNotify('อัปเดตสถานะข้อความติดต่อแล้ว');
    } else {
      onNotify('ไม่สามารถอัปเดตสถานะได้');
    }
  };

  const deleteInquiry = async (id: string) => {
    const ok = await deleteAdminInquiry(id, adminToken);
    if (ok) {
      setInquiries((prev) => prev.filter((item) => item.id !== id));
      onNotify('ลบข้อความติดต่อแล้ว');
    } else {
      onNotify('ไม่สามารถลบข้อความได้');
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(cms, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cms-data.json';
    a.click();
    URL.revokeObjectURL(url);
    onNotify('ส่งออกไฟล์ cms-data.json เรียบร้อยแล้ว');
  };

  const handleImportJson = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as CmsPayload;
        if (!parsed?.siteSettings || !Array.isArray(parsed.navbarMenus)) {
          throw new Error('Invalid format');
        }
        await onSaveCms(parsed, 'นำเข้าและบันทึกข้อมูลเว็บไซต์เรียบร้อยแล้ว');
      } catch {
        onNotify('ไฟล์ JSON ไม่ถูกต้อง กรุณาเลือกไฟล์ที่ส่งออกจากระบบ');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 flex flex-col lg:flex-row">
      {/* Left Admin Sidebar (256px desktop) */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 shrink-0 flex flex-col justify-between">
        <div className="p-4">
          <p className="px-3 py-2 text-xs font-semibold text-slate-400">
            เมนูผู้ดูแลระบบ (CMS)
          </p>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between gap-2 px-3 py-2.5 min-h-[42px] rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#0F2D5C] text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                  {typeof item.count === 'number' && (
                    <span
                      className={`text-xs font-mono-num ${
                        active ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-4 border-t border-slate-200 space-y-2">
          <button
            type="button"
            onClick={onExitAdmin}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#0F2D5C] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            <span>ดูหน้าเว็บไซต์จริง</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>ออกจากระบบแอดมิน</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Viewport */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl">
        {/* ================= OVERVIEW TAB ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900">
                  ระบบจัดการเว็บไซต์สำเร็จรูป (Admin CMS)
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  แก้ไขเมนูนำทาง เพิ่มลิงก์บริการงานบุคคล ประกาศข่าวสาร และคำถามที่พบบ่อยได้แบบเรียลไทม์
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบแอดมิน</span>
              </button>
            </div>

            {/* 4-Card Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-500 mb-1">เมนูนำทางด้านบน</p>
                <p className="font-display text-2xl font-bold text-[#0F2D5C] font-mono-num">
                  {cms.navbarMenus.filter((m) => m.visible).length} / {cms.navbarMenus.length}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('menus')}
                  className="mt-3 text-xs font-medium text-blue-700 hover:underline cursor-pointer"
                >
                  จัดการเมนู →
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-500 mb-1">ลิงก์บริการงานบุคคล</p>
                <p className="font-display text-2xl font-bold text-[#0F2D5C] font-mono-num">
                  {cms.services.filter((s) => s.visible).length} / {cms.services.length}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('services')}
                  className="mt-3 text-xs font-medium text-blue-700 hover:underline cursor-pointer"
                >
                  จัดการบริการ →
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-500 mb-1">ข่าวประชาสัมพันธ์</p>
                <p className="font-display text-2xl font-bold text-[#0F2D5C] font-mono-num">
                  {cms.news.filter((n) => n.visible).length} / {cms.news.length}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('news')}
                  className="mt-3 text-xs font-medium text-blue-700 hover:underline cursor-pointer"
                >
                  จัดการข่าวสาร →
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-500 mb-1">ข้อความติดต่อรอตรวจสอบ</p>
                <p className="font-display text-2xl font-bold text-[#0F2D5C] font-mono-num">
                  {pendingInquiriesCount}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('inquiries')}
                  className="mt-3 text-xs font-medium text-blue-700 hover:underline cursor-pointer"
                >
                  เปิดกล่องข้อความ →
                </button>
              </div>
            </div>

            {/* Export / Import JSON for Static GitHub Pages Sync */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900">
                  สำรองและเผยแพร่ข้อมูล (Export / Import JSON)
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  สำหรับโฮสต์แบบไม่มีเซิร์ฟเวอร์ (เช่น GitHub Pages) สามารถส่งออกไฟล์ <code className="font-mono-num text-xs bg-slate-100 px-1.5 py-0.5 rounded">cms-data.json</code> ไปวางในโฟลเดอร์ <code className="font-mono-num text-xs bg-slate-100 px-1.5 py-0.5 rounded">public/</code> เพื่อให้ทุกคนเห็นข้อมูลล่าสุดตรงกัน
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>ส่งออก JSON</span>
                </button>
                <label className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer">
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  <span>นำเข้า JSON</span>
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => {
                      handleImportJson(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Reset to Default Data Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900">
                  คืนค่าข้อมูลเริ่มต้นของระบบ (Factory Reset)
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  ใช้เมื่อต้องการรีเซ็ตเมนู ลิงก์บริการ และข่าวประชาสัมพันธ์กลับไปเป็นข้อมูลตัวอย่างตั้งต้น
                </p>
              </div>
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  <span>คืนค่าเริ่มต้น</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onResetCms();
                      setConfirmReset(false);
                    }}
                    className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
                  >
                    ยืนยันคืนค่าข้อมูล
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= NAVBAR MENUS TAB ================= */}
        {activeTab === 'menus' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                  จัดการเมนูนำทาง (Navbar Menu Builder)
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  เพิ่ม แก้ไข ซ่อน/แสดง และจัดลำดับเมนูบนแถบ Navigation Bar ด้านบนของเว็บไซต์
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateMenu}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-sm font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>เพิ่มเมนูใหม่</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                      <th className="py-3 px-4">ลำดับ</th>
                      <th className="py-3 px-4">ชื่อเมนู</th>
                      <th className="py-3 px-4">ลิงก์ปลายทาง</th>
                      <th className="py-3 px-4">ประเภท</th>
                      <th className="py-3 px-4">สถานะ</th>
                      <th className="py-3 px-4 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {sortedMenus.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono-num text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{item.label}</td>
                        <td className="py-3 px-4 font-mono-num text-xs text-slate-600">
                          {item.href}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {item.type === 'external' ? 'ลิงก์ภายนอก (แท็บใหม่)' : 'เลื่อนในหน้าเว็บ'}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => toggleMenuVisibility(item.id)}
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md cursor-pointer ${
                              item.visible
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {item.visible ? (
                              <>
                                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>แสดงผล</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>ซ่อนไว้</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveMenu(idx, -1)}
                              title="เลื่อนขึ้น"
                              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === sortedMenus.length - 1}
                              onClick={() => moveMenu(idx, 1)}
                              title="เลื่อนลง"
                              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditMenu(item)}
                              title="แก้ไขเมนู"
                              className="p-2 rounded-lg text-blue-700 hover:bg-blue-50 cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMenu(item.id)}
                              title="ลบเมนู"
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= HR SERVICES TAB ================= */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                  จัดการลิงก์บริการงานบุคคล
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  เพิ่มลิงก์ระบบออนไลน์ แก้ไขหมวดหมู่ เลือกไอคอน และจัดลำดับการ์ดบริการ
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateService}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-sm font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>เพิ่มบริการใหม่</span>
              </button>
            </div>

            <div className="space-y-3">
              {sortedServices.map((srv, idx) => (
                <div
                  key={srv.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0F2D5C] flex items-center justify-center shrink-0">
                      <IconRenderer name={srv.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-0.5">
                        <span className="font-medium text-blue-800">{srv.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num truncate max-w-xs">{srv.url}</span>
                      </div>
                      <h3 className="font-display text-base font-semibold text-slate-900">
                        {srv.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-1">
                        {srv.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 justify-end">
                    <button
                      type="button"
                      onClick={() => toggleServiceVisibility(srv.id)}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg cursor-pointer ${
                        srv.visible
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {srv.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{srv.visible ? 'แสดง' : 'ซ่อน'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveService(idx, -1)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sortedServices.length - 1}
                      onClick={() => moveService(idx, 1)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setServiceMode('edit');
                        setServiceForm({ ...srv });
                      }}
                      className="p-2 rounded-lg text-blue-700 hover:bg-blue-50 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteService(srv.id)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= NEWS TAB ================= */}
        {activeTab === 'news' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                  จัดการข่าวสารประชาสัมพันธ์
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  สร้างประกาศใหม่ แก้ไขเนื้อหา ปักหมุดข่าวเด่น หรือซ่อนข่าวที่หมดเขตแล้ว
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateNews}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-sm font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>เพิ่มข่าวประกาศ</span>
              </button>
            </div>

            <div className="space-y-3">
              {cms.news.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-medium text-blue-800">{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">{item.publishedAt}</span>
                      {item.featured && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-amber-700">ข่าวเด่นหน้าแรก</span>
                        </>
                      )}
                    </div>
                    <h3 className="font-display text-base font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-1 mt-0.5">
                      {item.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 justify-end">
                    <button
                      type="button"
                      onClick={() => setFeaturedNews(item.id)}
                      title="ตั้งเป็นข่าวเด่น"
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg cursor-pointer ${
                        item.featured
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>ปักหมุด</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleNewsVisibility(item.id)}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg cursor-pointer ${
                        item.visible
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{item.visible ? 'แสดง' : 'ซ่อน'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewsMode('edit');
                        setNewsForm({ ...item });
                      }}
                      className="p-2 rounded-lg text-blue-700 hover:bg-blue-50 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteNews(item.id)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= FAQ TAB ================= */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                  จัดการคำถามที่พบบ่อย (FAQ)
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  เพิ่ม แก้ไข หรือปรับปรุงคำถามและแนวทางปฏิบัติงานบุคคล
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateFaq}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-sm font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>เพิ่มคำถามใหม่</span>
              </button>
            </div>

            <div className="space-y-3">
              {sortedFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-blue-800">{faq.category}</span>
                    <h3 className="font-display text-base font-semibold text-slate-900">
                      {faq.question}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setFaqMode('edit');
                        setFaqForm({ ...faq });
                      }}
                      className="p-2 rounded-lg text-blue-700 hover:bg-blue-50 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFaq(faq.id)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SITE SETTINGS TAB ================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                ตั้งค่าข้อมูลเว็บไซต์และส่วน Hero Section
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                ปรับแต่งข้อความพาดหัวหลัก ชื่อหน่วยงาน ปุ่มกดหลัก และข้อมูลติดต่อในส่วนท้ายเว็บไซต์
              </p>
            </div>

            <form
              onSubmit={handleSaveSettings}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1.5">
                    ชื่อแบรนด์บน Navbar
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.brandTitle}
                    onChange={(e) =>
                      setSettingsDraft((s) => ({ ...s, brandTitle: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 min-h-[42px] rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1.5">
                    รอบการประเมินปัจจุบัน
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.evaluationCycle}
                    onChange={(e) =>
                      setSettingsDraft((s) => ({ ...s, evaluationCycle: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 min-h-[42px] rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1.5">
                    ชื่อฝ่ายงาน / กลุ่มงาน
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.divisionName}
                    onChange={(e) =>
                      setSettingsDraft((s) => ({ ...s, divisionName: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 min-h-[42px] rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1.5">
                    ชื่อสถานศึกษา / องค์กร
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.organizationName}
                    onChange={(e) =>
                      setSettingsDraft((s) => ({ ...s, organizationName: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 min-h-[42px] rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">
                  พาดหัวหลัก Hero Section
                </label>
                <input
                  type="text"
                  value={settingsDraft.heroTitle}
                  onChange={(e) =>
                    setSettingsDraft((s) => ({ ...s, heroTitle: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 min-h-[42px] rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">
                  คำอธิบายใต้พาดหัว Hero Section
                </label>
                <textarea
                  rows={3}
                  value={settingsDraft.heroSubtitle}
                  onChange={(e) =>
                    setSettingsDraft((s) => ({ ...s, heroSubtitle: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1.5">
                    ข้อความปุ่มหลัก (Primary CTA)
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.heroPrimaryCta}
                    onChange={(e) =>
                      setSettingsDraft((s) => ({ ...s, heroPrimaryCta: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 min-h-[42px] rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1.5">
                    ข้อความปุ่มรอง (Secondary CTA)
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.heroSecondaryCta}
                    onChange={(e) =>
                      setSettingsDraft((s) => ({ ...s, heroSecondaryCta: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 min-h-[42px] rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1.5">
                    เวลาทำการ
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.officeHours}
                    onChange={(e) =>
                      setSettingsDraft((s) => ({ ...s, officeHours: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 min-h-[42px] rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1.5">
                    เบอร์โทรศัพท์ติดต่อ
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.phone}
                    onChange={(e) =>
                      setSettingsDraft((s) => ({ ...s, phone: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 min-h-[42px] rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1.5">
                    อีเมลติดต่อ
                  </label>
                  <input
                    type="email"
                    value={settingsDraft.email}
                    onChange={(e) =>
                      setSettingsDraft((s) => ({ ...s, email: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 min-h-[42px] rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1.5">
                  ที่ตั้งหน่วยงาน
                </label>
                <input
                  type="text"
                  value={settingsDraft.address}
                  onChange={(e) =>
                    setSettingsDraft((s) => ({ ...s, address: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 min-h-[42px] rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[42px] text-sm font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" aria-hidden="true" />
                  <span>บันทึกการตั้งค่าทั้งหมด</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= INQUIRIES INBOX TAB ================= */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                  กล่องข้อความติดต่อจากบุคลากร
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  รายการคำร้องและข้อสอบถามที่ส่งผ่านแบบฟอร์มหน้าเว็บไซต์
                </p>
              </div>
            </div>

            {loadingInquiries ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
                กำลังโหลดข้อมูลข้อความ...
              </div>
            ) : inquiries.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
                ยังไม่มีข้อความติดต่อจากบุคลากร
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono-num font-semibold text-[#0F2D5C]">
                          {inq.ticketCode}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-blue-800">{inq.topic}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num">{inq.createdAt}</span>
                      </div>
                      <h3 className="font-display text-base font-semibold text-slate-900">
                        {inq.fullName}{' '}
                        <span className="text-sm font-normal text-slate-500">
                          ({inq.department})
                        </span>
                      </h3>
                      <p className="text-sm text-slate-700 leading-relaxed">{inq.message}</p>
                      <p className="text-xs text-slate-500 font-mono-num">
                        ช่องทางติดต่อกลับ: {inq.contact}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleInquiryStatus(inq)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                          inq.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          {inq.status === 'resolved' ? 'ดำเนินการแล้ว' : 'รอดำเนินการ'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteInquiry(inq.id)}
                        title="ลบข้อความ"
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= MODAL: MENU EDITOR ================= */}
      {menuForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-display text-base font-semibold text-slate-900">
                {menuMode === 'create' ? 'เพิ่มเมนูนำทางใหม่' : 'แก้ไขเมนูนำทาง'}
              </h3>
              <button
                type="button"
                onClick={() => setMenuForm(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitMenu} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  ชื่อเมนู
                </label>
                <input
                  type="text"
                  required
                  value={menuForm.label}
                  onChange={(e) => setMenuForm({ ...menuForm, label: e.target.value })}
                  placeholder="เช่น คู่มือบุคลากร"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  ประเภทลิงก์
                </label>
                <select
                  value={menuForm.type}
                  onChange={(e) =>
                    setMenuForm({
                      ...menuForm,
                      type: e.target.value === 'external' ? 'external' : 'anchor',
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                >
                  <option value="anchor">เลื่อนไปยังส่วนในหน้าเว็บ (#services, #news, #faq, #contact)</option>
                  <option value="external">ลิงก์เว็บไซต์ภายนอก (เปิดแท็บใหม่)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  ปลายทาง (Anchor หรือ URL)
                </label>
                <input
                  type="text"
                  required
                  value={menuForm.href}
                  onChange={(e) => setMenuForm({ ...menuForm, href: e.target.value })}
                  placeholder={menuForm.type === 'anchor' ? '#services' : 'https://vec.go.th'}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono-num"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMenuForm(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 rounded-lg cursor-pointer"
                >
                  บันทึกเมนู
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SERVICE EDITOR ================= */}
      {serviceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-display text-base font-semibold text-slate-900">
                {serviceMode === 'create' ? 'เพิ่มลิงก์บริการงานบุคคล' : 'แก้ไขลิงก์บริการงานบุคคล'}
              </h3>
              <button
                type="button"
                onClick={() => setServiceForm(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitService} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">ชื่อบริการ</label>
                <input
                  type="text"
                  required
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">หมวดหมู่</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">ไอคอน</label>
                  <select
                    value={serviceForm.icon}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        icon: e.target.value as ServiceIconKey,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                  >
                    {SERVICE_ICON_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  ลิงก์ปลายทาง (URL หรือ #contact)
                </label>
                <input
                  type="text"
                  required
                  value={serviceForm.url}
                  onChange={(e) => setServiceForm({ ...serviceForm, url: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">คำอธิบาย</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  เอกสารประกอบ / ข้อแนะนำ
                </label>
                <textarea
                  rows={3}
                  value={serviceForm.requiredDocs}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, requiredDocs: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setServiceForm(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 rounded-lg cursor-pointer"
                >
                  บันทึกบริการ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: NEWS EDITOR ================= */}
      {newsForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-display text-base font-semibold text-slate-900">
                {newsMode === 'create' ? 'เพิ่มข่าวประชาสัมพันธ์' : 'แก้ไขข่าวประชาสัมพันธ์'}
              </h3>
              <button
                type="button"
                onClick={() => setNewsForm(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitNews} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">พาดหัวข่าว</label>
                <input
                  type="text"
                  required
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">หมวดหมู่</label>
                  <input
                    type="text"
                    value={newsForm.category}
                    onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">วันที่ประกาศ</label>
                  <input
                    type="text"
                    value={newsForm.publishedAt}
                    onChange={(e) => setNewsForm({ ...newsForm, publishedAt: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">รูปภาพประกอบ</label>
                <select
                  value={newsForm.imageUrl}
                  onChange={(e) => setNewsForm({ ...newsForm, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                >
                  {PRESET_NEWS_IMAGES.map((img) => (
                    <option key={img.url} value={img.url}>
                      {img.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">สรุปข่าวโดยย่อ</label>
                <textarea
                  rows={2}
                  required
                  value={newsForm.summary}
                  onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  เนื้อหาประกาศฉบับเต็ม
                </label>
                <textarea
                  rows={4}
                  value={newsForm.content}
                  onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newsForm.featured}
                  onChange={(e) => setNewsForm({ ...newsForm, featured: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span>ปักหมุดเป็นข่าวเด่นด้านบนสุด</span>
              </label>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewsForm(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 rounded-lg cursor-pointer"
                >
                  บันทึกประกาศ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: FAQ EDITOR ================= */}
      {faqForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-display text-base font-semibold text-slate-900">
                {faqMode === 'create' ? 'เพิ่มคำถามที่พบบ่อย' : 'แก้ไขคำถามที่พบบ่อย'}
              </h3>
              <button
                type="button"
                onClick={() => setFaqForm(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitFaq} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">หมวดหมู่</label>
                <input
                  type="text"
                  value={faqForm.category}
                  onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">คำถาม</label>
                <input
                  type="text"
                  required
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">คำตอบ</label>
                <textarea
                  rows={4}
                  required
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFaqForm(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 rounded-lg cursor-pointer"
                >
                  บันทึกคำถาม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
