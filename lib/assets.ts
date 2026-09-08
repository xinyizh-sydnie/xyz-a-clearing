export const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const dataAsset = (path: string) => `${base}/data/${path.replace(/^\/+/, '')}`;
