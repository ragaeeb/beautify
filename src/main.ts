import { invoke } from '@tauri-apps/api/core';
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { buildTrie, searchAndReplace } from 'trie-rules';

const HOST = 'pastebin.com/raw';
const RULES_ID = 'Bb3SjXtg';
const HOTKEY = 'CommandOrControl+Shift+X';

type Rule = Parameters<typeof buildTrie>[0];

const updateStatus = (msg: string) => {
    console.log(msg);
    const el = document.getElementById('status');
    if (el) {
        el.textContent = msg;
    }
};

const setDockBadge = async (value: null | string) => {
    try {
        await invoke('set_dock_badge', { value });
    } catch (error) {
        console.error('Failed to set dock badge:', error);
    }
};

const requestUserAttention = async () => {
    try {
        await invoke('request_user_attention');
    } catch (error) {
        console.error('Failed to request user attention:', error);
    }
};

// Retry utility for network requests
const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await tauriFetch(url);
            if (response.ok) {
                return response;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
            if (i === retries - 1) throw error;
            console.warn(`Fetch attempt ${i + 1} failed, retrying in ${delay}ms...`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
        }
    }
    throw new Error('Max retries exceeded');
};

const initialise = async () => {
    updateStatus('🚀 Initializing...');

    try {
        updateStatus(`📥 Fetching rules from ${HOST}/${RULES_ID}`);
        const response = await fetchWithRetry(`https://${HOST}/${RULES_ID}`);
        const rawRules = (await response.json()) as Rule;
        
        if (!Array.isArray(rawRules) || rawRules.length === 0) {
            throw new Error('Invalid rules format or empty rules');
        }
        
        updateStatus(`✅ Loaded ${rawRules.length} rules`);
        console.log('Rules loaded successfully:', rawRules.length);

        const trie = buildTrie(rawRules);
        await setDockBadge(rawRules.length.toString());

        updateStatus(`⌨️  Registering hotkey: ${HOTKEY}`);
        await register(HOTKEY, async () => {
            console.log('Hotkey triggered');
            updateStatus('🔥 HOTKEY TRIGGERED!');

            try {
                const text = await readText();
                updateStatus(`📋 Clipboard: ${text?.length || 0} chars`);

                if (!text) {
                    updateStatus('ℹ️  Clipboard is empty');
                    return;
                }

                const changed = searchAndReplace(trie, text);

                if (text !== changed) {
                    updateStatus('✨ Writing formatted text...');
                    await writeText(changed);
                    await requestUserAttention();
                    await setDockBadge(null);
                    updateStatus('✅ Complete!');
                    console.log('Text formatted successfully');
                } else {
                    updateStatus('ℹ️  No changes needed');
                }
            } catch (error) {
                console.error('Error processing clipboard:', error);
                updateStatus(`❌ Clipboard error: ${error}`);
                await setDockBadge('!');
            }
        });

        updateStatus(`✅ Ready! Press ${HOTKEY}`);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Initialization error:', error);
        updateStatus(`❌ Error: ${errorMsg}`);
        await setDockBadge('!');
        
        // Attempt to retry after delay
        console.log('Will retry in 30 seconds...');
        setTimeout(() => {
            console.log('Retrying initialization...');
            void initialise();
        }, 30000);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Loaded');
    void initialise();
});

window.addEventListener('beforeunload', () => {
    void unregisterAll();
});
