export interface Transaction {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  nonce: number;
  token?: string;
}

export interface StoredKey {
  name: string;
  address: string;
  encryptedKey: string;
}

export interface TokenConfig {
  address: string;
  symbol: string;
  decimals: number;
  logo: string;
  name: string;
}

export interface TokenBalance {
  formatted: string;
  raw: bigint;
}

export interface SavedCredential {
  id: string;
  nickname: string;
  value: string;
  type: 'infura' | 'privateKey';
  lastUsed: number;
  address?: string; // For private keys only
}

export interface CredentialStore {
  infuraUrls: SavedCredential[];
  privateKeys: SavedCredential[];
}