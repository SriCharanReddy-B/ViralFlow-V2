
import { StoredAnalysis, User } from '../types';

const DB_NAME = 'ViralFlowDB';
// Incremented version to ensure onupgradeneeded runs for existing sessions to create the 'users' store
const DB_VERSION = 2;
export const GUEST_USER_ID = 'local-creator';

export class DatabaseService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        // Ensure analyses store exists
        if (!db.objectStoreNames.contains('analyses')) {
          const analysisStore = db.createObjectStore('analyses', { keyPath: 'id' });
          analysisStore.createIndex('userId', 'userId', { unique: false });
        }
        // Fix: Add users store for AuthPage functionality
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'email' });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event: any) => reject(event.target.error);
    });
  }

  // Fix: Implemented registerUser method for AuthPage
  async registerUser(user: User): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.add(user);
      request.onsuccess = () => resolve();
      request.onerror = (event: any) => reject(event.target.error);
    });
  }

  // Fix: Implemented getUser method for AuthPage
  async getUser(email: string): Promise<User | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.get(email);
      request.onsuccess = (event: any) => {
        resolve(event.target.result || null);
      };
      request.onerror = (event: any) => reject(event.target.error);
    });
  }

  async saveAnalysis(analysis: StoredAnalysis): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['analyses'], 'readwrite');
      const store = transaction.objectStore('analyses');
      const request = store.add(analysis);
      request.onsuccess = () => resolve();
      request.onerror = (event: any) => reject(event.target.error);
    });
  }

  async getUserAnalyses(): Promise<StoredAnalysis[]> {
    await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['analyses'], 'readonly');
      const store = transaction.objectStore('analyses');
      const request = store.getAll();
      request.onsuccess = (event: any) => {
        const results = event.target.result || [];
        // Sort by date descending
        resolve(results.sort((a: any, b: any) => b.createdAt - a.createdAt));
      };
      request.onerror = () => resolve([]);
    });
  }
}

export const dbService = new DatabaseService();
