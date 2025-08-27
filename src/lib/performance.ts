// Performance monitoring utility for iframe loading

interface PerformanceMetrics {
  startTime: number;
  loadTime?: number;
  url: string;
  title: string;
}

const performanceMetrics: Map<string, PerformanceMetrics> = new Map();

export const startPerformanceTracking = (url: string, title: string): string => {
  const id = `${title}-${Date.now()}`;
  performanceMetrics.set(id, {
    startTime: performance.now(),
    url,
    title
  });
  
  console.log(`🚀 Started loading ${title} at ${new Date().toISOString()}`);
  return id;
};

export const endPerformanceTracking = (id: string): void => {
  const metrics = performanceMetrics.get(id);
  if (!metrics) {
    console.warn(`Performance metrics not found for id: ${id}`);
    return;
  }

  const loadTime = performance.now() - metrics.startTime;
  metrics.loadTime = loadTime;

  console.log(`✅ ${metrics.title} loaded in ${loadTime.toFixed(2)}ms`);
  
  // Log slow loading times
  if (loadTime > 5000) {
    console.warn(`⚠️ Slow loading detected: ${metrics.title} took ${loadTime.toFixed(2)}ms to load`);
  }

  // Clean up
  performanceMetrics.delete(id);
};

export const getAverageLoadTime = (): number => {
  const times = Array.from(performanceMetrics.values())
    .filter(m => m.loadTime !== undefined)
    .map(m => m.loadTime!);
  
  if (times.length === 0) return 0;
  return times.reduce((a, b) => a + b, 0) / times.length;
};
