export declare function lazyLoadComponent<T extends React.ComponentType<any>>(importFunc: () => Promise<{
    default: T;
}>): React.LazyExoticComponent<T>;
export declare function lazyLoadImage(src: string, options?: {
    threshold?: number;
    rootMargin?: string;
    placeholder?: string;
    errorImage?: string;
}): Promise<HTMLImageElement>;
export declare function lazyLoadModule<T>(importFunc: () => Promise<T>): Promise<T>;
export declare function conditionalLoadModule<T>(condition: boolean, importFunc: () => Promise<T>): Promise<T>;
export declare class PreloadManager {
    private preloadedResources;
    private preloadingPromises;
    preloadScript(url: string): Promise<void>;
    preloadStyle(url: string): Promise<void>;
    preloadImage(url: string): Promise<void>;
    isPreloaded(url: string): boolean;
    getStats(): {
        preloadedCount: number;
        preloadingCount: number;
    };
}
export declare const preloadManager: PreloadManager;
//# sourceMappingURL=lazy-loading.d.ts.map