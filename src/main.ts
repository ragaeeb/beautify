import { app, clipboard, globalShortcut } from 'electron';
import started from 'electron-squirrel-startup';
import { buildTrie, searchAndReplace, TriePattern } from 'trie-rules';

const HOST = 'pastebin.com/raw';

if (started) {
    app.quit();
}

const init = async () => {
    try {
        const response = await fetch(`https://${HOST}/Bb3SjXtg`);
        const rawRules = await response.json();
        const searchReplaceRules = buildTrie(rawRules);
        app.dock.setBadge(rawRules.length.toString());

        globalShortcut.register('CommandOrControl+Shift+X', () => {
            const text = clipboard.readText();
            const changed = searchAndReplace(searchReplaceRules, text, { preformatters: [TriePattern.Apostrophes] });

            if (text !== changed) {
                clipboard.writeText(changed);
                app.dock.bounce('informational');

                if (app.dock.getBadge()) {
                    app.dock.setBadge('');
                }
            }
        });
    } catch (err) {
        console.error(err);
        app.dock.setBadge('!');
    }
};

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.whenReady().then(init);
