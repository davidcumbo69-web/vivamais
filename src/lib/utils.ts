import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitiza URLs de avatares para remover mocks e placeholders.
 * Se a URL for de um serviço de mock conhecido, retorna null.
 */
export function sanitizeAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const mockPatterns = [
    'dicebear.com',
    'avataaars',
    'unsplash.com',
    'images.pexels.com',
    'placeholder.com'
  ];
  const isMock = mockPatterns.some(pattern => url.includes(pattern));
  return isMock ? null : url;
}
