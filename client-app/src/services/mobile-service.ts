export class MobileService {
    private isMobile: boolean = false;

    constructor() {
        this.isMobile = window.innerWidth < 768;
    }

    isTablet(): boolean {
        return window.innerWidth >= 768 && window.innerWidth < 1024;
    }

    isDesktop(): boolean {
        return window.innerWidth >= 1024;
    }
}

export const mobileService = new MobileService();