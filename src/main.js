const { app, Menu, Tray, globalShortcut, clipboard } = require('electron');
const isPendingInstallation = require('electron-squirrel-startup');
const path = require('path');
const { compileRegexPatterns, searchAndReplace, applyRegexReplacements, buildTrie } = require('./trie');
require('dotenv').config();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (isPendingInstallation) {
    app.quit();
}

const init = async () => {
    await app.whenReady();

    if (app.dock) {
        app.dock.hide();
    }

    console.log('App is ready');

    const tray = new Tray(path.join(__dirname, 'assets/images/favicon_16.png'));
    tray.setContextMenu(Menu.buildFromTemplate([{ label: 'Quit', type: 'normal', click: app.quit }]));

    let data = { regexRules: [], searchReplaceRules: [] };

    try {
        const response = await fetch(process.env.RULES_PATH);
        data = await response.json();
    } catch (err) {
        console.error('Rules are not loaded!');
    }

    console.log(
        `${data.regexRules.length} regex rules, and ${data.searchReplaceRules.length} search-and-replace rules loaded`,
    );

    const regexRules = compileRegexPatterns(data.regexRules).filter(({ english, onBlur }) =>
        Boolean(english && onBlur),
    );
    const searchReplaceRules = buildTrie(data.searchReplaceRules);

    tray.setToolTip(`${data.regexRules.length + data.searchReplaceRules.length} rules loaded`);

    globalShortcut.register('CommandOrControl+Shift+X', () => {
        const text = clipboard.readText();

        let changed = searchAndReplace(searchReplaceRules, text);
        changed = applyRegexReplacements(regexRules, changed);

        if (text !== changed) {
            clipboard.writeText(changed);
        }
    });
};

init();
