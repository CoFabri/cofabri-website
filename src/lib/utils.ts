export function isTestMode(): boolean {
  if (typeof window !== 'undefined') {
    // Client-side
    return false;
  }
  // Server-side
  return process.env.TEST_MODE === 'true';
}

export async function isTestModeClient(): Promise<boolean> {
  try {
    const response = await fetch('/api/config');
    const { testMode } = await response.json();
    return testMode;
  } catch (error) {
    console.error('Error checking test mode:', error);
    return false;
  }
} 