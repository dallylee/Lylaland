export { };

declare global {
    interface Window {
        __DEBUG_SLOTS__: boolean;
        __FORCE_ITEMS__: boolean;
    }
}
