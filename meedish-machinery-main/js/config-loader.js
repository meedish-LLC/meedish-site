/**
 * Fetches Supabase configuration from a local fallback or the serverless API.
 * This prevents hardcoding keys in the client-side code while still allowing
 * static hosting to work without a backend endpoint.
 */
async function fetchConfig() {
    const localConfig = window.meedish_APP_CONFIG;

    if (localConfig?.SUPABASE_URL && localConfig?.SUPABASE_ANON_KEY) {
        return localConfig;
    }

    try {
        if (window.location.protocol === 'file:') {
            throw new Error('Local config missing and /api/config is unavailable from file URLs');
        }

        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error(`Failed to fetch config: ${response.statusText}`);
        }
        const config = await response.json();

        if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
            throw new Error('Supabase configuration missing in response');
        }

        return config;
    } catch (error) {
        console.error('Error loading Supabase config:', error);
        alert('Failed to load application configuration. Please make sure js/config.js is loaded or run the app with npm start.');
        throw error;
    }
}

// Export for module usage if needed, though mostly used in global scope for this project
window.fetchConfig = fetchConfig;
