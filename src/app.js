const { compileRegexPatterns, buildTrie } = require('trie-rules');

const loadRules = async () => {
    let data = { regexRules: [], searchReplaceRules: [] };

    try {
        const response = await fetch(process.env.RULES_PATH);
        data = await response.json();
    } catch (err) {
        console.error('Rules are not loaded!');
    }

    const regexRules = compileRegexPatterns(data.regexRules).filter(({ english, onBlur }) =>
        Boolean(english && onBlur),
    );
    const searchReplaceRules = buildTrie(data.searchReplaceRules);

    return { regexRules, searchReplaceRules, totalRulesCount: data.regexRules.length + data.searchReplaceRules.length };
};

module.exports = { loadRules };
