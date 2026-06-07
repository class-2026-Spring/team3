'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../hooks/useTranslation';

interface MyComment {
  id: string;
  station_id: string;
  station_name: string;
  content: string;
  rating: number | null;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export default function MyCommentsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [comments, setComments] = useState<MyComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) { router.push('/'); return; }

      const { data: rows } = await supabase
        .from('station_comments')
        .select('id, station_id, station_name, content, rating, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!rows) { setLoading(false); return; }

      setComments(rows.map(r => ({
        ...r,
        station_name: r.station_name ?? r.station_id,
      })));
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t('mycomments.deleteConfirm'))) return;
    setDeleting(id);
    await supabase.from('station_comments').delete().eq('id', id);
    setComments(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
  };

  const handleGoStation = (stationId: string) => {
    router.push(`/?station=${stationId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-2 mb-2 flex flex-col gap-4 max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-[15px] shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-800 p-6 transition-colors">
        <h2 className="font-extrabold text-gray-800 dark:text-gray-100 text-[16px] mb-1 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-teal-500">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          {t('mycomments.title')}
        </h2>
        <p className="text-[12px] text-gray-400 dark:text-gray-500">{t('mycomments.totalCount')} {comments.length}{t('mycomments.comments')}</p>
      </div>

      {comments.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-[15px] border border-gray-100 dark:border-gray-800 p-12 text-center transition-colors">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300 dark:text-gray-600">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <p className="text-[13px] font-bold text-gray-400 dark:text-gray-500">{t('mycomments.emptyTitle')}</p>
          <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-1">{t('mycomments.emptyDesc')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map(c => (
            <div key={c.id} className="bg-white dark:bg-gray-900 rounded-[15px] shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-800 p-5 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <button
                  onClick={() => handleGoStation(c.station_id)}
                  className="text-[13px] font-bold text-teal-600 hover:text-teal-700 dark:hover:text-teal-400 hover:underline text-left"
                >
                  {c.station_name}
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={deleting === c.id}
                  className="text-[11px] text-gray-300 hover:text-red-400 transition-colors shrink-0 disabled:opacity-50"
                >
                  {t('mycomments.deleteButton')}
                </button>
              </div>
              <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">{c.content}</p>
              {c.rating && (
                <div className="flex items-center gap-0.5 mt-1.5">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={s <= c.rating! ? '#f59e0b' : '#e5e7eb'}>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-gray-300 dark:text-gray-500 mt-2">{timeAgo(c.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
