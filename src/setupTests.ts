// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { ProgressionEngine } from './engine/ProgressionEngine';

// Mock ResizeObserver for JSDOM (used in HomeRealm Stage transform)
class ResizeObserverMock {
    observe() { }
    unobserve() { }
    disconnect() { }
}
global.ResizeObserver = ResizeObserverMock;

// Mock Dexie/IndexedDB for JSDOM
jest.mock('./services/db', () => ({
    db: {
        progression: {
            get: jest.fn().mockResolvedValue(null),
            put: jest.fn().mockResolvedValue(undefined),
            clear: jest.fn().mockResolvedValue(undefined),
        },
        diary: { clear: jest.fn().mockResolvedValue(undefined) },
        riddles: { clear: jest.fn().mockResolvedValue(undefined) },
        clues: { clear: jest.fn().mockResolvedValue(undefined) },
    }
}));

// Mock Persistence to be synchronous or just return defaults for tests
jest.mock('./services/Persistence', () => ({
    persistence: {
        init: jest.fn().mockResolvedValue(undefined),
        getState: jest.fn().mockResolvedValue(require('./types/progression').DEFAULT_STATE),
        saveState: jest.fn().mockResolvedValue(undefined),
        clear: jest.fn().mockResolvedValue(undefined),
    }
}));

// Reset state before each test to ensure determinism
beforeEach(async () => {
    if (ProgressionEngine && (ProgressionEngine as any).resetForTests) {
        await (ProgressionEngine as any).resetForTests();
    }
});
