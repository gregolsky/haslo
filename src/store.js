const path = require('path');
const glob = require('glob');

function findEntry(passStoreDir, phrase) {
    const pattern = path.join("**", "*" + phrase + "*", "**", "*.gpg");
    const matches = glob.sync(pattern, {
        nocase: true,
        cwd: passStoreDir
    });
    return matches.map(x => x.replace(/\.gpg$/, ""));
}

function getPasswordStoreDir() {
    return path.join(process.env.HOME, process.env.PASSWORD_STORE_DIR || ".password-store");
}

module.exports = { findEntry, getPasswordStoreDir };