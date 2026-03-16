/**
 * Performance Monitoring (Phase 64)
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];

  /**
   * Measure function execution time
   */
  static async measure<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric({
        name,
        value: duration,
        unit: "ms",
        timestamp: new Date(),
      });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric({
        name: `${name}_error`,
        value: duration,
        unit: "ms",
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Record a metric
   */
  static recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  /**
   * Get metrics
   */
  static getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter((m) => m.name === name);
    }
    return [...this.metrics];
  }

  /**
   * Get average metric value
   */
  static getAverage(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }
}
