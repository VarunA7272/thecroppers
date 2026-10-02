import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private client: SupabaseClient | null = null;
  private isConfigured = false;

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    const url = environment.supabaseUrl;
    const key = environment.supabaseAnonKey;

    if (
      url &&
      key &&
      url !== 'YOUR_SUPABASE_URL' &&
      key !== 'YOUR_SUPABASE_ANON_KEY' &&
      url.startsWith('http')
    ) {
      this.client = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        global: {
          fetch: (input, init) => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 300);
            return fetch(input, {
              ...init,
              signal: controller.signal
            }).finally(() => clearTimeout(timeout));
          }
        }
      });
      this.isConfigured = true;
    } else {
      console.warn(
        '[The Croppers] Supabase credentials are placeholder values. Update src/environments/environment.ts with your real Supabase URL and anon key.'
      );
      this.isConfigured = false;
    }
  }

  public get isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }

  public get clientInstance(): SupabaseClient | null {
    return this.client;
  }

  /**
   * Safe RPC caller with error normalization
   */
  public async callRpc<T = any>(functionName: string, params: Record<string, any>): Promise<{ data: T | null; error: any }> {
    if (!this.client) {
      return {
        data: null,
        error: new Error('Supabase client is not configured. Please supply valid credentials.')
      };
    }

    try {
      const response = await this.client.rpc(functionName, params);
      return {
        data: response.data as T,
        error: response.error
      };
    } catch (err: any) {
      return {
        data: null,
        error: err
      };
    }
  }
}
