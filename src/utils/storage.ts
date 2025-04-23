import { ethers } from 'ethers';
import type { CredentialStore, SavedCredential } from '../types';

const STORAGE_KEY = 'credential_store';
const ENCRYPTION_KEY = 'your-app-specific-key'; // In production, use a proper key management system

export class CredentialManager {
  private store: CredentialStore = {
    infuraUrls: [],
    privateKeys: []
  };

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      this.store = JSON.parse(stored);
    }
  }

  private saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
  }

  private encrypt(value: string): string {
    // In production, use a proper encryption method
    return btoa(value);
  }

  private decrypt(value: string): string {
    // In production, use a proper decryption method
    return atob(value);
  }

  private validateInfuraUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('infura.io') && 
             urlObj.protocol === 'https:' &&
             url.includes('/v3/');
    } catch {
      return false;
    }
  }

  private getAddressFromPrivateKey(key: string): string {
    try {
      const wallet = new ethers.Wallet(key);
      return wallet.address;
    } catch {
      return '';
    }
  }

  public async saveCredential(
    value: string,
    type: 'infura' | 'privateKey',
    nickname: string
  ): Promise<SavedCredential | null> {
    // Only validate Infura URLs
    if (type === 'infura' && !this.validateInfuraUrl(value)) {
      throw new Error('Invalid Infura URL format');
    }

    const credential: SavedCredential = {
      id: crypto.randomUUID(),
      nickname,
      value: this.encrypt(value),
      type,
      lastUsed: Date.now(),
      ...(type === 'privateKey' ? { address: this.getAddressFromPrivateKey(value) } : {})
    };

    const list = type === 'infura' ? this.store.infuraUrls : this.store.privateKeys;
    
    // Check for duplicates
    const exists = list.find(c => this.decrypt(c.value) === value);
    if (exists) {
      exists.lastUsed = Date.now();
      exists.nickname = nickname;
      this.saveToStorage();
      return exists;
    }

    list.push(credential);
    this.saveToStorage();
    return credential;
  }

  public getCredentials(type: 'infura' | 'privateKey'): SavedCredential[] {
    const list = type === 'infura' ? this.store.infuraUrls : this.store.privateKeys;
    return [...list].sort((a, b) => b.lastUsed - a.lastUsed);
  }

  public deleteCredential(id: string, type: 'infura' | 'privateKey'): void {
    const list = type === 'infura' ? this.store.infuraUrls : this.store.privateKeys;
    const index = list.findIndex(c => c.id === id);
    if (index !== -1) {
      list.splice(index, 1);
      this.saveToStorage();
    }
  }

  public updateLastUsed(id: string, type: 'infura' | 'privateKey'): void {
    const list = type === 'infura' ? this.store.infuraUrls : this.store.privateKeys;
    const credential = list.find(c => c.id === id);
    if (credential) {
      credential.lastUsed = Date.now();
      this.saveToStorage();
    }
  }

  public getDecryptedValue(id: string, type: 'infura' | 'privateKey'): string {
    const list = type === 'infura' ? this.store.infuraUrls : this.store.privateKeys;
    const credential = list.find(c => c.id === id);
    return credential ? this.decrypt(credential.value) : '';
  }
}

export const credentialManager = new CredentialManager();