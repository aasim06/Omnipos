/**
 * Utility functions to parse and generate direct Google Review and Google Maps URLs.
 * Converts regular Google Maps place links into direct "Write a Review" modal URLs,
 * and vice-versa.
 */

export interface GoogleUrlsResult {
  reviewUrl: string;
  mapUrl: string;
}

/**
 * Parses any Google Maps URL or Review URL and returns both:
 * - reviewUrl: Opens the direct 5-star "Write a Review" modal/dialog
 * - mapUrl: Opens the Google Maps location/directions overview
 */
export function buildGoogleUrls(rawUrl?: string, customReviewUrl?: string): GoogleUrlsResult {
  let url = (rawUrl || '').trim();
  if (!url && customReviewUrl) {
    url = customReviewUrl.trim();
  }
  if (!url) {
    return { reviewUrl: '', mapUrl: '' };
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // If a specific custom review URL was provided and is valid, prioritize it for reviews
  if (customReviewUrl && customReviewUrl.trim()) {
    let customRev = customReviewUrl.trim();
    if (!customRev.startsWith('http://') && !customRev.startsWith('https://')) {
      customRev = 'https://' + customRev;
    }

    const cleanMap = url
      .replace(/!9m1!1b1/g, '')
      .replace(/#lrd=[^&#]*/g, '')
      .replace(/\/review\/?$/i, '');

    return {
      reviewUrl: customRev,
      mapUrl: cleanMap || url,
    };
  }

  // 1. Direct writereview URL: search.google.com/local/writereview?placeid=...
  const writeReviewMatch = url.match(/search\.google\.com\/local\/writereview\?placeid=([A-Za-z0-9_-]+)/i);
  if (writeReviewMatch) {
    const pid = writeReviewMatch[1];
    return {
      reviewUrl: url,
      mapUrl: /^\d+$/.test(pid)
        ? `https://maps.google.com/?cid=${pid}`
        : `https://www.google.com/maps/place/?q=place_id:${pid}`,
    };
  }

  // 2. g.page URLs: https://g.page/r/... or https://g.page/...
  if (url.includes('g.page')) {
    const clean = url.replace(/\/review\/?$/i, '');
    return {
      reviewUrl: `${clean}/review`,
      mapUrl: clean,
    };
  }

  // 3. Google Maps full place URL containing /data=...
  // When Google Maps opens the review modal, it appends !9m1!1b1 to the /data= parameter.
  // Removing !9m1!1b1 returns the normal store location & directions.
  if (url.includes('/data=')) {
    const cleanMap = url
      .replace(/!9m1!1b1/g, '')
      .replace(/#lrd=[^&#]*/g, '')
      .replace(/\/review\/?$/i, '');

    let reviewUrl = url;
    if (!reviewUrl.includes('!9m1!1b1')) {
      if (reviewUrl.includes('!16s')) {
        reviewUrl = reviewUrl.replace('!16s', '!9m1!1b1!16s');
      } else {
        reviewUrl = reviewUrl.replace(/\/data=([^?#]+)/, (_m, p1) => `/data=${p1}!9m1!1b1`);
      }
    }

    return {
      reviewUrl,
      mapUrl: cleanMap,
    };
  }

  // 4. Check for hex feature ID pair (0x...:0x...) e.g. from Google Search or Maps
  const hexPairMatch = url.match(/(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);
  if (hexPairMatch) {
    const hexPair = hexPairMatch[1];
    return {
      reviewUrl: `https://www.google.com/search?q=review#lrd=${hexPair},3`,
      mapUrl: url.replace(/#lrd=[^&#]*/g, ''),
    };
  }

  // 5. Place ID parameter: placeid=... or place_id=... or query_place_id=...
  const placeIdMatch = url.match(/(?:placeid|place_id|query_place_id)=([A-Za-z0-9_-]+)/i);
  if (placeIdMatch) {
    const pid = placeIdMatch[1];
    return {
      reviewUrl: `https://search.google.com/local/writereview?placeid=${pid}`,
      mapUrl: `https://www.google.com/maps/place/?q=place_id:${pid}`,
    };
  }

  // 6. Shortened links or links with /review
  if (url.includes('/review')) {
    return {
      reviewUrl: url,
      mapUrl: url.replace(/\/review\/?$/i, ''),
    };
  }

  // Fallback
  return {
    reviewUrl: url,
    mapUrl: url,
  };
}

/**
 * Returns the effective URL to encode in the QR code or to test,
 * based on store settings and user's chosen purpose ('review' vs 'map').
 */
export function getEffectiveGoogleQrUrl(settings?: {
  googleMapsUrl?: string;
  googleReviewUrl?: string;
  googleQrAction?: 'review' | 'map';
}): string {
  if (!settings) return '';
  const action = settings.googleQrAction || 'review';
  const { reviewUrl, mapUrl } = buildGoogleUrls(settings.googleMapsUrl, settings.googleReviewUrl);

  if (action === 'map') {
    return mapUrl || reviewUrl || '';
  }
  return reviewUrl || mapUrl || '';
}
