import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { DEFAULT_CMS_DATA } from './data/defaultCmsData.ts';
import type { CmsPayload } from './types/cms.ts';
import {
  loadCmsData,
  resetCmsData,
  saveCmsData,
  verifyAdminSession,
} from './utils/cmsClient.ts';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { ServicesSection } from './components/ServicesSection.tsx';
import { NewsSection } from './components/NewsSection.tsx';
import { FaqAndContactSection } from './components/FaqAndContactSection.tsx';
import { Footer } from './components/Footer.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';

const TOKEN_STORAGE_KEY = 'dansai_hr_admin_token';

/**
 * แอปพลิเคชันหลัก: งานบริหารและพัฒนาทรัพยากรบุคคล วิทยาลัยการอาชีพด่านซ้าย
 * ผสานหน้าเว็บไซต์บริการบุคลากรกับระบบหลังบ้าน (Admin CMS) รองรับทั้งโหมดมีเซิร์ฟเวอร์และ Static (GitHub Pages)
 */
export default function App() {
  const [cms, setCms] = useState<CmsPayload>(DEFAULT_CMS_DATA);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // โหลดข้อมูล CMS (รองรับทั้ง Backend API และ Static/localStorage)
  useEffect(() => {
    let active = true;
    loadCmsData().then(({ cms: loaded }) => {
      if (active && loaded) {
        setCms(loaded);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // ตรวจสอบความถูกต้องของ Admin Token เดิม (ถ้ามี)
  useEffect(() => {
    if (!adminToken) return;
    verifyAdminSession(adminToken).then((valid) => {
      if (!valid) {
        setAdminToken(null);
        try {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        } catch {
          // ignore
        }
      }
    });
  }, [adminToken]);

  // Scroll Reveal Animation ด้วย IntersectionObserver
  useEffect(() => {
    if (isAdminMode) return;
    const elements = document.querySelectorAll('.reveal-section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isAdminMode]);

  const handleToggleAdmin = () => {
    if (adminToken) {
      setIsAdminMode(true);
    } else {
      setLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = (token: string) => {
    setAdminToken(token);
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // ignore storage errors
    }
    setLoginModalOpen(false);
    setIsAdminMode(true);
    notify('เข้าสู่ระบบผู้ดูแลเว็บไซต์เรียบร้อยแล้ว');
  };

  const handleLogout = () => {
    setAdminToken(null);
    setIsAdminMode(false);
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
    notify('ออกจากระบบผู้ดูแลแล้ว');
  };

  const handleSaveCms = async (nextCms: CmsPayload, successMessage?: string): Promise<boolean> => {
    if (!adminToken) {
      setLoginModalOpen(true);
      return false;
    }

    const res = await saveCmsData(nextCms, adminToken);
    if (res.unauthorized) {
      handleLogout();
      setLoginModalOpen(true);
      notify('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
      return false;
    }
    if (!res.ok) {
      notify('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      return false;
    }

    setCms(res.cms || nextCms);
    if (successMessage) notify(successMessage);
    return true;
  };

  const handleResetCms = async (): Promise<boolean> => {
    if (!adminToken) return false;
    const res = await resetCmsData(adminToken);
    setCms(res.cms);
    notify('คืนค่าข้อมูลเริ่มต้นทั้งหมดเรียบร้อยแล้ว');
    return true;
  };

  const activeServicesCount = cms.services.filter((s) => s.visible).length;
  const activeNewsCount = cms.news.filter((n) => n.visible).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        brandTitle={cms.siteSettings.brandTitle}
        menuItems={cms.navbarMenus}
        isAdminMode={isAdminMode}
        onToggleAdmin={handleToggleAdmin}
        onExitAdmin={() => setIsAdminMode(false)}
      />

      {isAdminMode && adminToken ? (
        <AdminDashboard
          cms={cms}
          adminToken={adminToken}
          onSaveCms={handleSaveCms}
          onResetCms={handleResetCms}
          onLogout={handleLogout}
          onExitAdmin={() => setIsAdminMode(false)}
          onNotify={notify}
        />
      ) : (
        <main className="flex-1">
          <HeroSection
            settings={cms.siteSettings}
            activeServicesCount={activeServicesCount}
            activeNewsCount={activeNewsCount}
          />

          <div className="reveal-section">
            <ServicesSection services={cms.services} onNotify={notify} />
          </div>

          <div className="reveal-section">
            <NewsSection news={cms.news} />
          </div>

          <div className="reveal-section">
            <FaqAndContactSection faqs={cms.faqs} settings={cms.siteSettings} />
          </div>

          <Footer
            settings={cms.siteSettings}
            menuItems={cms.navbarMenus}
            onOpenAdmin={handleToggleAdmin}
          />
        </main>
      )}

      <AdminLoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 text-sm"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span className="flex-1">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="ปิดการแจ้งเตือน"
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
