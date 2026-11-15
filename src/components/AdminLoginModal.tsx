import { useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, KeyRound, X } from 'lucide-react';
import { authenticateAdmin } from '../utils/cmsClient.ts';

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
}

/**
 * หน้าต่างเข้าสู่ระบบผู้ดูแล (Admin Login Modal)
 */
export function AdminLoginModal({ open, onClose, onSuccess }: AdminLoginModalProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passcode.trim()) {
      setError('กรุณากรอกรหัสผ่านผู้ดูแลระบบ');
      return;
    }

    setLoading(true);
    try {
      const result = await authenticateAdmin(passcode.trim());
      if (!result.ok || !result.token) {
        throw new Error(result.error || 'รหัสผ่านไม่ถูกต้อง');
      }

      setPasscode('');
      onSuccess(result.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถเข้าสู่ระบบได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <img
              src="assets/aistudio/01ecb920-6706-49b0-99cc-541878dd9c36_c6f4a6e0.png"
              alt="โลโก้งานบริหารและพัฒนาทรัพยากรบุคคล"
              className="w-10 h-10 object-contain shrink-0"
            />
            <div>
              <h3 id="admin-login-title" className="font-display text-base font-semibold text-slate-900">
                เข้าสู่ระบบหลังบ้าน (Admin CMS)
              </h3>
              <p className="text-xs text-slate-500">จัดการเมนู ลิงก์บริการ และข่าวประชาสัมพันธ์</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs sm:text-sm text-red-800"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="admin-passcode" className="block text-sm font-medium text-slate-800 mb-1.5">
              รหัสผ่านผู้ดูแลระบบ
            </label>
            <div className="relative">
              <KeyRound
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="admin-passcode"
                type="password"
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="กรอกรหัสผ่านผู้ดูแลระบบ"
                className="w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[40px] text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 min-h-[40px] text-sm font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
