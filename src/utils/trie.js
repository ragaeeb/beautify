const buildTrie = (rules) => {
    const trie = {};
    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        for (let j = 0; j < rule.sources.length; j++) {
            const source = rule.sources[j];
            let node = trie;
            for (let k = 0; k < source.length; k++) {
                const char = source[k];
                if (!node[char]) {
                    node[char] = {};
                }
                node = node[char];
            }
            node.isEndOfWord = true;
            node.target = rule.target;
            node.options = rule.options || {};
        }
    }

    return trie;
};

const WORD_BOUNDARY = /[a-zA-ZāáḏḍēġḥīōṭūʿʾĀḌḎĒĠṬḤĪŌŪʿʾ]/;

const isValidMatch = (prevChar, nextChar, options) => {
    if (options && options.match === 'whole') {
        return !WORD_BOUNDARY.test(prevChar) && !WORD_BOUNDARY.test(nextChar);
    }

    if (options?.match === 'alone') {
        return /\s/.test(prevChar) && /\s/.test(nextChar);
    }

    return true;
};

const searchAndReplace = (trie, text) => {
    let result = '';
    let i = 0;

    while (i < text.length) {
        let node = trie;
        let j = i;
        const potentialMatches = [];

        while (node[text[j]] && j < text.length) {
            node = node[text[j]];
            j++;
            if (node.isEndOfWord) {
                // Here, we use j - 1 to include the last character of the matched word
                potentialMatches.push({ index: j - 1, node });
            }
        }

        let longestValidMatch = null;

        for (let k = potentialMatches.length - 1; k >= 0; k--) {
            const { index, node: potentialNode } = potentialMatches[k];
            const prevChar = text[i - 1] || '';
            const nextChar = text[index + 1] || ''; // +1 to get the character immediately after the match
            if (isValidMatch(prevChar, nextChar, potentialNode.options)) {
                longestValidMatch = potentialNode;
                j = index + 1; // +1 to move to the character immediately after the match
                break;
            }
        }

        if (longestValidMatch) {
            result += longestValidMatch.target;
            i = j;
        } else {
            result += text[i];
            i++;
        }
    }

    return result;
};

const compileRegexPatterns = (rules) => {
    const compiled = rules.map(({ flags, pattern, ...rule }) => {
        return { regex: new RegExp(pattern, flags), ...rule };
    });

    return compiled;
};

const applyRegexReplacements = (rules, text) => {
    let modifiedText = text;

    rules.forEach((rule) => {
        modifiedText = modifiedText.replace(rule.regex, rule.replacement);
    });

    return modifiedText;
};

module.exports = {
    applyRegexReplacements,
    compileRegexPatterns,
    buildTrie,
    searchAndReplace,
};
