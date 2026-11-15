import { useMemo, useState } from 'react';
import { ArrowUpRight, Calendar, ChevronRight, X } from 'lucide-react';
import type { NewsItem } from '../types/cms.ts';
import { SafeImage } from './SafeImage.tsx';

interface NewsSectionProps {
  news: NewsItem[];
}

/**
 * ส่วนระบบแสดงข่าวสารประชาสัมพันธ์ (News & Announcements)
 * แสดงข่าวเด่น (Featured) คู่กับรายการประกาศล่าสุด และหน้าต่างอ่านข่าวฉบับเต็ม
 */
export function NewsSection({ news }: NewsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);

  const visibleNews = useMemo(() => news.filter((n) => n.visible), [news]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(visibleNews.map((n) => n.category)));
    return ['ทั้งหมด', ...unique];
  }, [visibleNews]);

  const filteredNews = useMemo(() => {
    if (selectedCategory === 'ทั้งหมด') return visibleNews;
    return visibleNews.filter((n) => n.category === selectedCategory);
  }, [visibleNews, selectedCategory]);

  const featuredArticle = useMemo(() => {
    return filteredNews.find((n) => n.featured) || filteredNews[0] || null;
  }, [filteredNews]);

  const secondaryArticles = useMemo(() => {
    if (!featuredArticle) return [];
    return filteredNews.filter((n) => n.id !== featuredArticle.id);
  }, [filteredNews, featuredArticle]);

  return (
    <section id="news" className="py-14 lg:py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-blue-800 mb-2">
              02. ข่าวสารประชาสัมพันธ์และประกาศงานบุคคล
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              ประกาศสำคัญ กิจกรรมอบรม และสวัสดิการ
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="หมวดหมู่ข่าวประชาสัมพันธ์"
            className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit"
          >
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 min-h-[38px] text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-[#0F2D5C] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {!featuredArticle ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-slate-600">ยังไม่มีประกาศประชาสัมพันธ์ในหมวดหมู่นี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Featured News Card (7 Columns) */}
            <article className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between group">
              <div>
                <div className="aspect-[16/10] w-full overflow-hidden bg-slate-200">
                  <SafeImage
                    src={featuredArticle.imageUrl}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    fallbackTitle={featuredArticle.category}
                  />
                </div>
                <div className="p-6 sm:p-7">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
                    <span className="font-semibold text-blue-800">{featuredArticle.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-mono-num">
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                      {featuredArticle.publishedAt}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{featuredArticle.author}</span>
                  </div>

                  <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-3">
                    {featuredArticle.title}
                  </h3>

                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    {featuredArticle.summary}
                  </p>
                </div>
              </div>

              <div className="px-6 sm:px-7 pb-6">
                <button
                  type="button"
                  onClick={() => setActiveArticle(featuredArticle)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F2D5C] hover:text-blue-700 transition-colors cursor-pointer"
                >
                  <span>อ่านประกาศฉบับเต็ม</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </article>

            {/* Secondary News List (5 Columns) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {secondaryArticles.length === 0 ? (
                <div className="h-full bg-slate-50 border border-slate-200 rounded-xl p-6 flex items-center justify-center text-sm text-slate-500">
                  ไม่มีประกาศเพิ่มเติมในหมวดหมู่นี้
                </div>
              ) : (
                secondaryArticles.map((item) => (
                  <article
                    key={item.id}
                    className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 transition-colors"
                  >
                    <div className="sm:w-32 sm:h-28 aspect-[4/3] sm:aspect-auto rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      <SafeImage
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        fallbackTitle={item.category}
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                          <span className="font-medium text-blue-800">{item.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-num">{item.publishedAt}</span>
                        </div>
                        <h3 className="font-display text-base font-semibold text-slate-900 leading-snug line-clamp-2 mb-1.5">
                          {item.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                          {item.summary}
                        </p>
                      </div>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => setActiveArticle(item)}
                          className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-[#0F2D5C] hover:text-blue-700 cursor-pointer"
                        >
                          <span>ดูรายละเอียด</span>
                          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Article Reader Modal */}
      {activeArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="news-modal-title"
          onClick={() => setActiveArticle(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-blue-800">{activeArticle.category}</span>
                <span className="mx-2" aria-hidden="true">
                  ·
                </span>
                <span className="font-mono-num">{activeArticle.publishedAt}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                aria-label="ปิดหน้าต่างอ่านข่าว"
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-5">
              <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-slate-100">
                <SafeImage
                  src={activeArticle.imageUrl}
                  alt={activeArticle.title}
                  className="w-full h-full object-cover"
                  fallbackTitle={activeArticle.category}
                />
              </div>

              <div>
                <h3
                  id="news-modal-title"
                  className="font-display text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-2"
                >
                  {activeArticle.title}
                </h3>
                <p className="text-xs text-slate-500">เผยแพร่โดย: {activeArticle.author}</p>
              </div>

              <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {activeArticle.content}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              {activeArticle.attachmentUrl ? (
                <a
                  href={activeArticle.attachmentUrl}
                  target={activeArticle.attachmentUrl.startsWith('http') ? '_blank' : undefined}
                  rel={
                    activeArticle.attachmentUrl.startsWith('http')
                      ? 'noopener noreferrer'
                      : undefined
                  }
                  onClick={() => setActiveArticle(null)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-800 hover:text-blue-900"
                >
                  <span>ไปยังลิงก์ที่เกี่ยวข้อง</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </a>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="px-5 py-2 min-h-[40px] text-sm font-medium text-white bg-[#0F2D5C] hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
