import { invoke } from '@tauri-apps/api/core';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { buildTrie, searchAndReplace, TriePattern } from 'trie-rules';

const HOST = 'pastebin.com/raw';
const RULES_ID = 'Bb3SjXtg';
const HOTKEY = 'CommandOrControl+Shift+X';

type Rule = Parameters<typeof buildTrie>[0];

const updateStatus = (msg: string) => {
    console.log(msg);
    const el = document.getElementById('status');
    if (el) el.textContent = msg;
};

const setDockBadge = (value: null | string) => invoke('set_dock_badge', { value });
const requestUserAttention = () => invoke('request_user_attention');

const initialise = async () => {
    updateStatus('🚀 Initializing...');
    
    try {
        updateStatus(`📥 Fetching rules from ${HOST}/${RULES_ID}`);
        const response = await tauriFetch(`https://${HOST}/${RULES_ID}`);
        const rawRules = (await response.json()) as Rule;
        updateStatus(`✅ Loaded ${rawRules.length} rules`);
        
        const trie = buildTrie(rawRules);
        await setDockBadge(rawRules.length.toString());

        updateStatus(`⌨️  Registering hotkey: ${HOTKEY}`);
        await register(HOTKEY, async () => {
            updateStatus('🔥 HOTKEY TRIGGERED!');
            
            const text = await readText();
            updateStatus(`📋 Clipboard: ${text?.length || 0} chars`);
            
            const changed = searchAndReplace(trie, text);

            if (text !== changed) {
                updateStatus('✨ Writing formatted text...');
                await writeText(changed);
                await requestUserAttention();
                await setDockBadge(null);
                updateStatus('✅ Complete!');
            } else {
                updateStatus('ℹ️  No changes needed');
            }
        });
        
        updateStatus(`✅ Ready! Press ${HOTKEY}`);
    } catch (error) {
        updateStatus(`❌ Error: ${error}`);
        console.error(error);
        await setDockBadge('!');
    }
};

window.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Loaded');
    void initialise();
});

window.addEventListener('beforeunload', () => {
    void unregisterAll();
});