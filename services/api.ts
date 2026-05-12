const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787';

export interface PerfumeResult {
  identified: boolean;
  name: string;
  brand: string;
  fragranceFamily: string;
  gender: string;
  yearLaunched: string;
  perfumer: string;
  concentration: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  description: string;
  priceRange: string;
  rating: number;
  longevity: string;
  sillage: string;
  occasions: string[];
  seasons: string[];
  similarPerfumes: string[];
}

export function isApiConfigured(): boolean {
  return !!process.env.EXPO_PUBLIC_API_URL;
}

export function getApiUrl(): string {
  return API_URL;
}

export async function identifyPerfume(base64Image: string): Promise<PerfumeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    console.log('[PerfumeSnap] Sending request to:', `${API_URL}/identify`);
    console.log('[PerfumeSnap] Image size:', Math.round(base64Image.length / 1024), 'KB');

    const response = await fetch(`${API_URL}/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
      signal: controller.signal,
    });

    console.log('[PerfumeSnap] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `Server error (${response.status})`);
    }

    const result: PerfumeResult = await response.json();

    if (!result.identified) {
      throw new Error('Could not identify this perfume. Try a clearer photo of the bottle or label.');
    }

    return result;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The server took too long to respond.');
    }
    if (error.message?.includes('Network request failed')) {
      throw new Error(
        `Cannot reach the server at ${API_URL}. Make sure your phone is on the same WiFi and the API is running.`
      );
    }
    console.log('[PerfumeSnap] Error:', error.message);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
