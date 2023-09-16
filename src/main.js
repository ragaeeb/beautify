// eslint-disable-next-line import/no-extraneous-dependencies
const { app, Menu, Tray, globalShortcut, clipboard } = require('electron');
const isPendingInstallation = require('electron-squirrel-startup');
const path = require('path');
// eslint-disable-next-line import/no-unresolved
const { initialize, trackEvent } = require('@aptabase/electron/main');
const { searchAndReplace, applyRegexReplacements } = require('trie-rules');
const { loadRules } = require('./app');

require('dotenv').config();

initialize(process.env.APTABASE_KEY);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (isPendingInstallation) {
    app.quit();
}

if (app.dock) {
    app.dock.hide();
}

const init = async () => {
    const tray = new Tray(path.join(__dirname, 'assets/images/tray.png'));
    tray.setContextMenu(
        Menu.buildFromTemplate([
            {
                label: 'Quit',
                type: 'normal',
                click: () => {
                    trackEvent('app_quit');
                    app.quit();
                },
            },
        ]),
    );

    const { searchReplaceRules, regexRules, totalRulesCount } = await loadRules();

    tray.setToolTip(`${totalRulesCount} rules loaded`);

    globalShortcut.register('CommandOrControl+Shift+X', () => {
        const text = clipboard.readText();

        const now = performance.now();
        let changed = searchAndReplace(searchReplaceRules, text);
        changed = applyRegexReplacements(regexRules, changed);

        if (text !== changed) {
            const total = performance.now() - now;
            clipboard.writeText(changed);
            trackEvent('formatted', { length: text.length, total });
        }
    });

    trackEvent('app_started', { logName: process.env.USER || process.env.LOGNAME });
};

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
app.whenReady().then(init);
