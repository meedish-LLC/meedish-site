// Centralized Supabase client initializer.
// Depends on js/config-loader.js which exposes window.fetchConfig.

/**
 * Initializes the Supabase client exactly once and stores it on window.supabase.
 * Subsequent calls return the already-initialized client immediately.
 *
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient>}
 */
async function initSupabaseClient() {
    // Singleton guard: if the client is already fully initialized, reuse it.
    if (window.supabase && typeof window.supabase.from === 'function' && typeof window.supabase.auth === 'object') {
        return window.supabase;
    }

    try {
        // The Supabase CDN library exposes itself as window.supabase before we
        // overwrite it, but some CDN bundles use window.supabaseJs instead.
        // Check supabaseJs first (the dedicated namespace), then fall back to
        // window.supabase only if it still has createClient (i.e. it hasn't been
        // overwritten yet by a previous partial init).
        const supabaseLibrary = window.supabaseJs ?? (typeof window.supabase?.createClient === 'function' ? window.supabase : null);

        if (!supabaseLibrary?.createClient) {
            throw new Error(
                'Supabase library not found. Make sure the CDN <script> tag is loaded before this file.'
            );
        }

        const config = await window.fetchConfig();

        // Validate that the config actually contains the required keys.
        if (!config?.SUPABASE_URL || !config?.SUPABASE_ANON_KEY) {
            throw new Error('fetchConfig() returned an incomplete config — SUPABASE_URL or SUPABASE_ANON_KEY is missing.');
        }

        window.supabase = supabaseLibrary.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                // Isolate this app's session key from other Supabase projects on the same domain.
                storageKey: 'meedish-supabase-session',
            },
        });

        return window.supabase;
    } catch (err) {
        console.error('[initSupabaseClient] Initialization failed:', err);
        throw err;
    }
}

window.initSupabaseClient = initSupabaseClient;

/**
 * Returns the already-initialized Supabase client, or null if it hasn't been
 * initialized yet. Call initSupabaseClient() first.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
function getSupabase() {
    return window.supabase ?? null;
}

window.getSupabase = getSupabase;
