import { useState, useEffect } from 'react';

// Observable class for screen width changes
class ScreenWidthObservable {
  private subscribers: Array<(width: number) => void> = [];
  private currentWidth: number = window.innerWidth;
  private resizeTimeout: NodeJS.Timeout | null = null;
  private isListening: boolean = false;

  constructor() {
    this.handleResize = this.handleResize.bind(this);
  }

  private handleResize = () => {
    // Debounce resize events to improve performance
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = setTimeout(() => {
      const newWidth = window.innerWidth;
      if (newWidth !== this.currentWidth) {
        this.currentWidth = newWidth;
        this.notifySubscribers(newWidth);
      }
    }, 100); // 100ms debounce
  };

  private notifySubscribers(width: number) {
    this.subscribers.forEach(callback => {
      try {
        callback(width);
      } catch (error) {
        console.error('Error in screen width observer callback:', error);
      }
    });
  }

  public subscribe(callback: (width: number) => void): () => void {
    this.subscribers.push(callback);
    
    // Start listening if this is the first subscriber
    if (!this.isListening) {
      this.startListening();
    }

    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
      
      // Stop listening if no more subscribers
      if (this.subscribers.length === 0) {
        this.stopListening();
      }
    };
  }

  private startListening() {
    if (!this.isListening) {
      window.addEventListener('resize', this.handleResize);
      this.isListening = true;
    }
  }

  private stopListening() {
    if (this.isListening) {
      window.removeEventListener('resize', this.handleResize);
      this.isListening = false;
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
  }

  public getCurrentWidth(): number {
    return this.currentWidth;
  }

  public destroy() {
    this.stopListening();
    this.subscribers = [];
  }
}

// Global observable instance
const screenWidthObservable = new ScreenWidthObservable();

// Custom hook to check if a media query matches
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);

    // Create event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    media.addEventListener('change', listener);

    // Cleanup
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

// Specific hooks for common breakpoints
export const useIsMobile = () => useMediaQuery('(max-width: 480px)');
export const useIsTablet = () => useMediaQuery('(max-width: 768px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 769px)');

// Enhanced hook to get current window width using the observable
export const useWindowWidth = (): number => {
  const [width, setWidth] = useState(screenWidthObservable.getCurrentWidth());

  useEffect(() => {
    const unsubscribe = screenWidthObservable.subscribe(setWidth);
    return unsubscribe;
  }, []);

  return width;
};

// New hook for subscribing to screen width changes with custom logic
export const useScreenWidthObserver = (callback: (width: number) => void, dependencies: any[] = []) => {
  useEffect(() => {
    const unsubscribe = screenWidthObservable.subscribe(callback);
    return unsubscribe;
  }, dependencies);
};

// Hook to get screen width with custom breakpoint logic
export const useScreenBreakpoint = (breakpoints: { [key: string]: number }) => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('');

  useScreenWidthObserver((width) => {
    // Find the current breakpoint based on width
    const sortedBreakpoints = Object.entries(breakpoints)
      .sort(([, a], [, b]) => b - a); // Sort by width descending

    for (const [breakpoint, minWidth] of sortedBreakpoints) {
      if (width >= minWidth) {
        setCurrentBreakpoint(breakpoint);
        break;
      }
    }
  });

  return currentBreakpoint;
};

// Utility function to get current screen width without hook
export const getCurrentScreenWidth = (): number => {
  return screenWidthObservable.getCurrentWidth();
};

// Utility function to subscribe to screen width changes outside of React components
export const subscribeToScreenWidth = (callback: (width: number) => void) => {
  return screenWidthObservable.subscribe(callback);
};

// Cleanup function for when the app unmounts
export const cleanupScreenWidthObservable = () => {
  screenWidthObservable.destroy();
}; 