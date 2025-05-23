// Placeholder image as base64 SVG for fast loading and no external dependencies
export const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNODAgOTBIMTIwVjExMEg4MFY5MFoiIGZpbGw9IiM5Q0EzQUYiLz48L3N2Zz4=';

/**
 * Preloads an image to check if it can be loaded successfully
 * @param url The image URL to preload
 * @returns Promise that resolves to true if image loaded successfully, false otherwise
 */
export const preloadImage = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    
    img.onload = () => {
      resolve(true);
    };
    
    img.onerror = () => {
      resolve(false);
    };
    
    img.src = url;
  });
};

/**
 * Gets a safe image URL, falling back to placeholder if needed
 * @param url The original image URL
 * @param fallbackUrl Optional custom fallback URL
 * @returns Either the original URL or the fallback/placeholder
 */
export const getSafeImageUrl = (url: string, fallbackUrl?: string): string => {
  if (!url) {
    return fallbackUrl || PLACEHOLDER_IMAGE;
  }
  
  // If URL is already a data URL, return it
  if (url.startsWith('data:')) {
    return url;
  }
  
  // Add parameters for direct loading if it's an Unsplash URL and doesn't have them
  if (url.includes('images.unsplash.com') && !url.includes('&w=')) {
    return `${url}${url.includes('?') ? '&' : '?'}w=400&h=400&fit=crop&q=80`;
  }
  
  return url;
};

/**
 * Image props to use for consistent image loading across components
 */
export const getImageProps = (url: string, alt: string) => {
  return {
    src: getSafeImageUrl(url),
    alt,
    loading: 'lazy' as const,
    crossOrigin: 'anonymous' as const,
    referrerPolicy: 'no-referrer' as const,
  };
}; 