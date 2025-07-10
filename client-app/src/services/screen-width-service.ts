import { subscribeToScreenWidth, getCurrentScreenWidth } from '../hooks/useMediaQuery';

// Service class for screen width management
export class ScreenWidthService {
  private subscribers: Map<string, (width: number) => void> = new Map();
  private globalUnsubscribe: (() => void) | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Subscribe to the global observable
    this.globalUnsubscribe = subscribeToScreenWidth((width) => {
      this.notifySubscribers(width);
    });
  }

  private notifySubscribers(width: number) {
    this.subscribers.forEach((callback, id) => {
      try {
        callback(width);
      } catch (error) {
        console.error(`Error in screen width service callback ${id}:`, error);
      }
    });
  }

  // Subscribe to screen width changes
  public subscribe(id: string, callback: (width: number) => void): void {
    this.subscribers.set(id, callback);
    
    // Immediately call with current width
    callback(getCurrentScreenWidth());
  }

  // Unsubscribe from screen width changes
  public unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }

  // Get current screen width
  public getCurrentWidth(): number {
    return getCurrentScreenWidth();
  }

  // Check if screen width is within a range
  public isWidthInRange(min: number, max: number): boolean {
    const width = this.getCurrentWidth();
    return width >= min && width <= max;
  }

  // Get screen size category
  public getScreenSize(): 'mobile' | 'tablet' | 'desktop' | 'large-desktop' {
    const width = this.getCurrentWidth();
    
    if (width < 480) return 'mobile';
    if (width < 768) return 'tablet';
    if (width < 1024) return 'desktop';
    return 'large-desktop';
  }

  // Cleanup method
  public destroy(): void {
    if (this.globalUnsubscribe) {
      this.globalUnsubscribe();
      this.globalUnsubscribe = null;
    }
    this.subscribers.clear();
  }
}

// Global service instance
export const screenWidthService = new ScreenWidthService();

// Utility functions for common use cases
export const logScreenWidthChanges = (label: string = 'Screen Width') => {
  const id = `logger-${Date.now()}`;
  screenWidthService.subscribe(id, (width) => {
    console.log(`${label}: ${width}px`);
  });
  return () => screenWidthService.unsubscribe(id);
};

export const trackScreenSizeChanges = (callback: (size: string) => void) => {
  const id = `size-tracker-${Date.now()}`;
  let lastSize = '';
  
  screenWidthService.subscribe(id, (width) => {
    let currentSize: string;
    
    if (width < 480) currentSize = 'mobile';
    else if (width < 768) currentSize = 'tablet';
    else if (width < 1024) currentSize = 'desktop';
    else currentSize = 'large-desktop';
    
    if (currentSize !== lastSize) {
      lastSize = currentSize;
      callback(currentSize);
    }
  });
  
  return () => screenWidthService.unsubscribe(id);
};

// Analytics tracking example
export const trackScreenWidthAnalytics = () => {
  const id = 'analytics-tracker';
  
  screenWidthService.subscribe(id, (width) => {
    // In a real app, you might send this to Google Analytics or similar
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'screen_width_change', {
        screen_width: width,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  return () => screenWidthService.unsubscribe(id);
}; 