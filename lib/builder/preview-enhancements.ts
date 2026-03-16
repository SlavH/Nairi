/**
 * Builder Preview Enhancements (Phase 26)
 * Multiple preview modes, device emulation, screenshot capture
 */
export type PreviewMode = "desktop" | "tablet" | "mobile";

export interface PreviewDevice {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  userAgent: string;
}

export const PREVIEW_DEVICES: Record<PreviewMode, PreviewDevice[]> = {
  desktop: [
    {
      name: "Desktop (1920x1080)",
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    {
      name: "Desktop (1440x900)",
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  ],
  tablet: [
    {
      name: "iPad Pro",
      width: 1024,
      height: 1366,
      deviceScaleFactor: 2,
      userAgent: "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
    },
    {
      name: "iPad Air",
      width: 820,
      height: 1180,
      deviceScaleFactor: 2,
      userAgent: "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
    },
  ],
  mobile: [
    {
      name: "iPhone 14 Pro",
      width: 393,
      height: 852,
      deviceScaleFactor: 3,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
    },
    {
      name: "iPhone SE",
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
    },
    {
      name: "Samsung Galaxy S21",
      width: 360,
      height: 800,
      deviceScaleFactor: 3,
      userAgent: "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36",
    },
  ],
};

export class PreviewManager {
  /**
   * Get preview URL with device emulation
   */
  static getPreviewUrl(
    projectId: string,
    mode: PreviewMode = "desktop",
    deviceIndex: number = 0
  ): string {
    const devices = PREVIEW_DEVICES[mode];
    const device = devices[deviceIndex] || devices[0];
    return `/builder/preview/${projectId}?mode=${mode}&width=${device.width}&height=${device.height}`;
  }

  /**
   * Capture screenshot (would use Puppeteer/Playwright in production)
   */
  static async captureScreenshot(
    url: string,
    device: PreviewDevice
  ): Promise<string> {
    // In production, this would use Puppeteer or Playwright
    // For now, return a placeholder
    return `data:image/png;base64,placeholder`;
  }

  /**
   * Get all available preview modes
   */
  static getPreviewModes(): PreviewMode[] {
    return Object.keys(PREVIEW_DEVICES) as PreviewMode[];
  }

  /**
   * Get devices for a preview mode
   */
  static getDevicesForMode(mode: PreviewMode): PreviewDevice[] {
    return PREVIEW_DEVICES[mode] || [];
  }
}
