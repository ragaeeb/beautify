import { invoke } from '@tauri-apps/api/core';
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { buildTrie, searchAndReplace, TriePattern } from 'trie-rules';

const HOST = 'pastebin.com/raw';
const RULES_ID = 'Bb3SjXtg';
const HOTKEY = 'CommandOrControl+Shift+X';

type Rule = Parameters<typeof buildTrie>[0];

const setDockBadge = (value: null | string) => invoke('set_dock_badge', { value });

const requestUserAttention = () => invoke('request_user_attention');

const initialise = async () => {
    try {
        const response = await fetch(`https://${HOST}/${RULES_ID}`);
        const rawRules = (await response.json()) as Rule;
        const trie = buildTrie(rawRules);

        await setDockBadge(rawRules.length.toString());

        await register(HOTKEY, async () => {
            const text = await readText();
            const changed = searchAndReplace(trie, text, {
                preformatters: [TriePattern.Apostrophes],
            });

            if (text !== changed) {
                await writeText(changed);
                await requestUserAttention();
                await setDockBadge(null);
            }
        });
    } catch (error) {
        console.error(error);
        await setDockBadge('!');
    }
};

window.addEventListener('DOMContentLoaded', () => {
    void initialise();
});

window.addEventListener('beforeunload', () => {
    void unregisterAll();
});
