import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { getAvatarUrl } from '../../lib/utils';

export interface Comment {
  id: string;
  station_id: string;
  user_id: string;
  content: string;
  rating: number | null;
  created_at: string;
  parent_id: string | null;
  profiles: {
    nickname: string;
    avatar_url: string;
  };
  likesCount: number;
  isLiked: boolean;
  replies: Comment[];
}

interface StationCommunityProps {
  stationId: string;
  stationName: string;
}

export default function StationCommunity({ stationId, stationName }: StationCommunityProps) {
  const { session, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [newRating, setNewRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [stationId, session?.user?.id]); // Re-fetch if session changes so isLiked is updated

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('station_comments')
      .select(`
        id, station_id, user_id, content, rating, created_at, parent_id,
        profiles ( nickname, avatar_url ),
        comment_likes ( id, user_id )
      `)
      .eq('station_id', stationId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mappedData: Comment[] = data.map((item: any) => ({
        ...item,
        likesCount: item.comment_likes ? item.comment_likes.length : 0,
        isLiked: item.comment_likes ? item.comment_likes.some((like: any) => like.user_id === session?.user?.id) : false,
        replies: []
      }));

      const mainComments = mappedData.filter(c => !c.parent_id);
      const repliesData = mappedData.filter(c => c.parent_id);

      // 답글은 시간순(오름차순) 정렬
      repliesData.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      mainComments.forEach(mc => {
        mc.replies = repliesData.filter(r => r.parent_id === mc.id);
      });

      setComments(mainComments);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const contentToSubmit = parentId ? replyContent : newComment;
    if (!contentToSubmit.trim() || !profile) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from('station_comments')
      .insert([
        {
          station_id: stationId,
          user_id: profile.id,
          content: contentToSubmit.trim(),
          rating: parentId ? null : (newRating > 0 ? newRating : null),
          station_name: stationName,
          parent_id: parentId
        }
      ])
      .select();

    if (error) {
      console.error('Failed to post comment:', error.message || JSON.stringify(error));
      alert('댓글 등록에 실패했습니다: ' + (error.message || '권한 또는 서버 오류'));
    } else if (data && data.length > 0) {
      await fetchComments();
      if (!parentId) {
        setNewComment('');
        setNewRating(0);
      } else {
        setReplyingToId(null);
        setReplyContent('');
      }
    } else {
      console.error('Insert returned empty data. Check RLS policies.');
      alert('댓글 등록에 실패했습니다. (보안 정책 문제)');
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('station_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', profile?.id);

    if (!error) {
      fetchComments();
    }
  };

  const handleEditClick = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;

    const { error } = await supabase
      .from('station_comments')
      .update({ content: editContent.trim() })
      .eq('id', commentId)
      .eq('user_id', profile?.id);

    if (!error) {
      fetchComments();
      setEditingCommentId(null);
      setEditContent('');
    } else {
      alert('댓글 수정에 실패했습니다.');
    }
  };

  const handleToggleLike = async (commentId: string, isCurrentlyLiked: boolean) => {
    if (!profile) {
      alert('로그인 후 이용 가능합니다.');
      return;
    }

    // Optimistic UI Update
    const updateLikes = (list: Comment[]): Comment[] => {
      return list.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            isLiked: !isCurrentlyLiked,
            likesCount: c.likesCount + (isCurrentlyLiked ? -1 : 1)
          };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: updateLikes(c.replies) };
        }
        return c;
      });
    };
    setComments(prev => updateLikes(prev));

    if (isCurrentlyLiked) {
      await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', profile.id);
    } else {
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: profile.id });
    }
  };

  const handleReport = (commentId: string) => {
    if (confirm('이 댓글을 신고하시겠습니까? 부적절한 내용은 관리자 검토 후 삭제될 수 있습니다.')) {
      alert('신고가 정상적으로 접수되었습니다. 깨끗한 커뮤니티를 위해 기여해주셔서 감사합니다!');
    }
  };

  const maskNickname = (name: string) => {
    if (!name) return '';
    if (name.length <= 2) return name.charAt(0) + '*';
    const first = name.charAt(0);
    const last = name.charAt(name.length - 1);
    const middle = '*'.repeat(name.length - 2);
    return `${first}${middle}${last}`;
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString();
  };

  // 내부 렌더링 함수: 재귀 렌더링을 통해 리렌더링 시 포커스 잃음(한글 끊김) 방지
  const renderCommentItem = (comment: Comment, isReply = false) => {
    return (
      <div key={comment.id} className={`flex flex-col gap-2 ${isReply ? 'mt-2' : 'mt-4'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
            <img 
              src={getAvatarUrl(comment.profiles.avatar_url)}
              alt="avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[12px] font-extrabold text-gray-800">{maskNickname(comment.profiles?.nickname || 'Unknown')}</span>
              <span className="text-[10px] text-gray-400">{formatTime(comment.created_at)}</span>
              {!isReply && comment.rating && (
                <span className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} width="10" height="10" viewBox="0 0 24 24" fill={s <= comment.rating! ? '#f59e0b' : '#e5e7eb'}>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </span>
              )}

              {profile?.id === comment.user_id ? (
                <div className="ml-auto flex gap-1.5">
                  <button onClick={() => handleEditClick(comment)} className="text-[10px] text-gray-400 hover:text-teal-500 transition-colors px-1 font-semibold">수정</button>
                  <button onClick={() => handleDelete(comment.id)} className="text-[10px] text-gray-400 hover:text-red-500 transition-colors px-1 font-semibold">삭제</button>
                </div>
              ) : (
                <button onClick={() => handleReport(comment.id)} className="ml-auto text-[10px] text-gray-300 hover:text-orange-500 transition-colors px-1 flex items-center gap-0.5 font-semibold">신고</button>
              )}
            </div>

            {editingCommentId === comment.id ? (
              <div className="mt-1 flex flex-col gap-2">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingCommentId(null)} className="px-3 py-1 text-[11px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">취소</button>
                  <button onClick={() => handleUpdate(comment.id)} className="px-3 py-1 text-[11px] font-bold text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors">저장</button>
                </div>
              </div>
            ) : (
              <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-none border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] inline-block max-w-full">
                <p className="text-[13px] text-gray-700 leading-snug break-words whitespace-pre-wrap">{comment.content}</p>
              </div>
            )}
            
            {/* 좋아요 & 답글달기 액션 바 */}
            <div className="flex items-center gap-3 mt-1.5 ml-1">
              <button 
                onClick={() => handleToggleLike(comment.id, comment.isLiked)}
                className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${comment.isLiked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill={comment.isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                {comment.likesCount > 0 && comment.likesCount}
              </button>

              {!isReply && (
                <button 
                  onClick={() => {
                    setReplyingToId(replyingToId === comment.id ? null : comment.id);
                    setReplyContent('');
                  }}
                  className={`text-[10px] font-bold transition-colors ${replyingToId === comment.id ? 'text-teal-600' : 'text-gray-400 hover:text-teal-500'}`}
                >
                  답글 달기
                </button>
              )}
            </div>

            {/* 답글 입력창 */}
            {replyingToId === comment.id && !isReply && (
              <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="답글을 입력하세요"
                  className="flex-1 px-3 py-1.5 bg-gray-50 border border-teal-100 rounded-xl focus:outline-none focus:border-teal-400 focus:bg-white text-[12px] transition-all"
                  maxLength={150}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={submitting || !replyContent.trim()}
                  className="px-3 py-1.5 flex items-center justify-center rounded-xl bg-teal-500 text-white text-[11px] font-bold shrink-0 hover:bg-teal-600 disabled:opacity-50 transition-colors shadow-sm"
                >
                  등록
                </button>
              </form>
            )}
          </div>
        </div>

        {/* 대댓글 리스트 렌더링 */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <div className="flex flex-col gap-1 border-l-2 border-gray-100 pl-3 ml-4 mt-2">
            {comment.replies.map(reply => renderCommentItem(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 className="font-extrabold text-gray-800 text-[13px] flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          Talk
        </h3>
        <div className="flex items-center gap-2">
          {(() => {
            const rated = comments.filter(c => c.rating);
            if (rated.length === 0) return null;
            const avg = rated.reduce((sum, c) => sum + (c.rating ?? 0), 0) / rated.length;
            return (
              <div className="flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span className="text-[11px] font-bold text-amber-500">{avg.toFixed(1)}</span>
              </div>
            );
          })()}
          <span className="text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
            {comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-1 flex flex-col gap-1 bg-gray-50/30 max-h-[250px]">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-teal-500 rounded-full animate-spin"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center mt-4">
            <p className="text-[13px] font-bold text-gray-400 mb-1">아직 등록된 제보가 없습니다.</p>
            <p className="text-[11px] text-gray-400">가장 먼저 현장 상황을 알려주세요!</p>
          </div>
        ) : (
          comments.map((comment) => renderCommentItem(comment))
        )}
      </div>

      <div className="p-3 bg-white border-t border-gray-100">
        {!session ? (
          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => window.alert('상단의 Sign In 버튼을 눌러주세요.')}>
            <p className="text-[12px] font-bold text-gray-500">로그인 후 실시간 제보를 남길 수 있습니다.</p>
          </div>
        ) : !profile ? (
          <div className="bg-teal-50 rounded-xl p-3 text-center border border-teal-100">
            <p className="text-[12px] font-bold text-teal-600">상단에서 프로필 설정을 완료해주세요.</p>
          </div>
        ) : (
          <form onSubmit={(e) => handleSubmit(e, null)} className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400 font-semibold mr-1">별점</span>
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={s <= (hoverRating || newRating) ? '#f59e0b' : '#e5e7eb'}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </button>
              ))}
              {newRating > 0 && (
                <button type="button" onClick={() => setNewRating(0)} className="text-[10px] text-gray-300 hover:text-gray-500 ml-1">초기화</button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="충전소 후기를 남겨주세요"
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-teal-400 focus:bg-white text-[13px] transition-all"
                maxLength={200}
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-teal-500 text-white shrink-0 hover:bg-teal-600 disabled:opacity-50 disabled:bg-gray-300 transition-colors shadow-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
