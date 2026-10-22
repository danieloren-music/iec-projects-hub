import "server-only";

import type { CacheItem, CacheProvider } from "@node-saml/node-saml";
import { getSupabaseAdminClient } from "@/lib/data/supabase";

const CACHE_TTL_MS = 5 * 60 * 1000;

function getAdminClient() {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error(
      "SAML requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return client;
}

export class SupabaseSamlCache implements CacheProvider {
  private readonly consumedValues = new Map<string, string>();

  async saveAsync(key: string, value: string): Promise<CacheItem | null> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MS).toISOString();
    const client = getAdminClient();
    const { error: cleanupError } = await client
      .from("auth_saml_cache")
      .delete()
      .lt("expires_at", now.toISOString());
    if (cleanupError) {
      console.error("[auth:saml] Could not clean expired SAML state.", cleanupError);
      throw new Error("Expired SAML state could not be cleaned.");
    }

    const { error } = await client
      .from("auth_saml_cache")
      .upsert(
        {
          cache_key: key,
          value,
          created_at: now.toISOString(),
          expires_at: expiresAt,
        },
        { onConflict: "cache_key" },
      );

    if (error) {
      console.error("[auth:saml] Could not save SAML request state.", error);
      throw new Error("SAML request state could not be saved.");
    }

    return { value, createdAt: now.getTime() };
  }

  async getAsync(key: string): Promise<string | null> {
    const consumedValue = this.consumedValues.get(key);
    if (consumedValue !== undefined) return consumedValue;

    // Node-SAML 5 checks request IDs with getAsync; atomically delete them here
    // to make each successful response single-use across Vercel instances.
    const { data, error } = await getAdminClient()
      .from("auth_saml_cache")
      .delete()
      .eq("cache_key", key)
      .gt("expires_at", new Date().toISOString())
      .select("value")
      .maybeSingle();

    if (error) {
      console.error("[auth:saml] Could not consume SAML request state.", error);
      throw new Error("SAML request state could not be verified.");
    }
    if (!data) return null;

    this.consumedValues.set(key, data.value);
    return data.value;
  }

  async removeAsync(key: string | null): Promise<string | null> {
    if (key === null) return null;
    this.consumedValues.delete(key);
    const { data, error } = await getAdminClient()
      .from("auth_saml_cache")
      .delete()
      .eq("cache_key", key)
      .select("value")
      .maybeSingle();

    if (error) {
      console.error("[auth:saml] Could not remove SAML request state.", error);
      throw new Error("SAML request state could not be removed.");
    }
    return data?.value ?? null;
  }

  async consume(key: string): Promise<string | null> {
    return this.getAsync(key);
  }
}
