import { useState } from 'react';
import { Building2 } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

/**
 * คอมโพเนนต์แสดงรูปภาพพร้อมระบบ Fallback เพื่อป้องกันรูปภาพแตก (Broken Image)
 */
export function SafeImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackTitle = 'วิทยาลัยการอาชีพด่านซ้าย',
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 text-white p-6 text-center"
        role="img"
        aria-label={alt}
      >
        <Building2 className="w-10 h-10 text-blue-300 mb-3" aria-hidden="true" />
        <span className="font-display text-sm font-medium text-blue-100">{fallbackTitle}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
