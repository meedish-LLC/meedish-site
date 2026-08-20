// Lightweight auth helpers built on top of the initialized Supabase client.
// Depends on js/supabase-client.js exposing window.initSupabaseClient.

/**
 * Ensures the Supabase client is ready and returns it.
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient>}
 */
async function ensureClient() {
    if (!window.supabase || typeof window.supabase.from !== 'function') {
        await window.initSupabaseClient();
    }
    return window.supabase;
}

/**
 * Registers a new user via Supabase Auth.
 * Supabase hashes the password server-side — we never touch the plaintext.
 *
 * @param {string} email
 * @param {string} password
 */
async function signUp(email, password) {
    const supabase = await ensureClient();
    return supabase.auth.signUp({ email, password });
}

/**
 * Signs in via Supabase Auth (password hashing handled server-side).
 *
 * @param {string} email
 * @param {string} password
 */
async function signIn(email, password) {
    const supabase = await ensureClient();
    const result = await supabase.auth.signInWithPassword({ email, password });

    if (result.error) return result;

    // Mirror the session to localStorage under a predictable key so that
    // other parts of the app that read 'current_user' still work.
    if (result.data?.user) {
        localStorage.setItem('current_user', JSON.stringify(result.data.user));
    }

    return result;
}

/**
 * Signs out the current user both from Supabase and from localStorage.
 */
async function signOut() {
    const supabase = await ensureClient();
    const result = await supabase.auth.signOut();

    // Clean up any locally stored session copies.
    localStorage.removeItem('current_user');
    localStorage.removeItem('current_admin_user');
    localStorage.removeItem('current_super_admin');

    return result;
}

/**
 * Returns the current Supabase session, or null if not signed in.
 * Falls back to a cached localStorage value for pages that initialize
 * before the async client is ready.
 */
async function getSession() {
    try {
        const supabase = await ensureClient();
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    } catch {
        // Fallback: return whatever was cached in localStorage.
        const raw = localStorage.getItem('current_user') || localStorage.getItem('current_admin_user');
        if (!raw) return null;
        try {
            return { user: JSON.parse(raw) };
        } catch {
            return null;
        }
    }
}

/**
 * Subscribes to Supabase Auth state changes.
 * Returns an unsubscribe handle compatible with the previous stub API.
 *
 * @param {(event: string, session: object|null) => void} callback
 */
async function onAuthStateChange(callback) {
    const supabase = await ensureClient();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
    return data; // { subscription: { unsubscribe() {} } }
}

window.auth = {
    signUp,
    signIn,
    signOut,
    getSession,
    onAuthStateChange,
};
