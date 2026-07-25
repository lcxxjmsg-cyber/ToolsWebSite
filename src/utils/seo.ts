import { useEffect } from 'react';

export function useSEO({
  title,
  description,
  keywords,
}: {
  title?: string;
  description?: string;
  keywords?: string;
}) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && description) {
      metaDesc.setAttribute('content', description);
    }

    const metaKw = document.querySelector('meta[name="keywords"]');
    if (metaKw && keywords) {
      metaKw.setAttribute('content', keywords);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && title) {
      ogTitle.setAttribute('content', title);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && description) {
      ogDesc.setAttribute('content', description);
    }

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', window.location.href);
    }
  }, [title, description, keywords]);
}

export function InjectJSONLD({ data }: { data: Record<string, unknown> }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [data]);

  return null;
}
