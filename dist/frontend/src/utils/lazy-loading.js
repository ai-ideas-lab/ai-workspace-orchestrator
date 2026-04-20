export function lazyLoadComponent(importFunc) {
    return React.lazy(importFunc);
}
export function lazyLoadImage(src, options) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    img.src = src;
                    observer.unobserve(img);
                }
            });
        }, {
            threshold: options?.threshold || 0.1,
            rootMargin: options?.rootMargin || '50px'
        });
        img.onload = () => {
            resolve(img);
            observer.disconnect();
        };
        img.onerror = () => {
            if (options?.errorImage) {
                img.src = options.errorImage;
            }
            reject(new Error(`Failed to load image: ${src}`));
            observer.disconnect();
        };
        img.src = options?.placeholder || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxpc3RlZCBpbWFnZTwvdGV4dD48L3N2Zz4=';
        observer.observe(img);
    });
}
export function lazyLoadModule(importFunc) {
    return importFunc();
}
export function conditionalLoadModule(condition, importFunc) {
    if (condition) {
        return importFunc();
    }
    return Promise.reject(new Error('Condition not met for module loading'));
}
export class PreloadManager {
    preloadedResources = new Set();
    preloadingPromises = new Map();
    async preloadScript(url) {
        if (this.preloadedResources.has(url)) {
            return;
        }
        if (this.preloadingPromises.has(url)) {
            return this.preloadingPromises.get(url);
        }
        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => {
                this.preloadedResources.add(url);
                resolve();
            };
            script.onerror = () => reject(new Error(`Failed to preload script: ${url}`));
            document.head.appendChild(script);
        });
        this.preloadingPromises.set(url, promise);
        return promise;
    }
    async preloadStyle(url) {
        if (this.preloadedResources.has(url)) {
            return;
        }
        if (this.preloadingPromises.has(url)) {
            return this.preloadingPromises.get(url);
        }
        const promise = new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.onload = () => {
                this.preloadedResources.add(url);
                resolve();
            };
            link.onerror = () => reject(new Error(`Failed to preload style: ${url}`));
            document.head.appendChild(link);
        });
        this.preloadingPromises.set(url, promise);
        return promise;
    }
    async preloadImage(url) {
        if (this.preloadedResources.has(url)) {
            return;
        }
        if (this.preloadingPromises.has(url)) {
            return this.preloadingPromises.get(url);
        }
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.preloadedResources.add(url);
                resolve();
            };
            img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
            img.src = url;
        });
        this.preloadingPromises.set(url, promise);
        return promise;
    }
    isPreloaded(url) {
        return this.preloadedResources.has(url);
    }
    getStats() {
        return {
            preloadedCount: this.preloadedResources.size,
            preloadingCount: this.preloadingPromises.size
        };
    }
}
export const preloadManager = new PreloadManager();
//# sourceMappingURL=lazy-loading.js.map