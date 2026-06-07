export const getAvatarUrl = (url: string | null) => {
  if (!url) return '/avatars/a.png';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `/avatars/${url}`;
};
