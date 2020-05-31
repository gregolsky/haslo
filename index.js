const inquirer = require('inquirer');
const {
    exec
} = require('child_process');

const glob = require('glob');
const path = require('path');

function findEntry(passwordStoreDir, phrase) {
    const pattern = path.join("**", "*" + phrase + "*", "**", "*.gpg");
    const matches = glob.sync(pattern, {
        nocase: true,
        cwd: passwordStoreDir
    });
    return matches.map(x => x.replace(/\.gpg$/, ""));
}

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

function getPasswordStoreDir() {
    return path.join(process.env.HOME, ".password-store");
}

async function main() {

    const passStoreDir = getPasswordStoreDir();
    const answer = await inquirer.prompt([
        {
            type: 'autocomplete',
            name: 'entry',
            message: 'Find: ',
            source: async function (answersSoFar, input) {
                if (!input) {
                    return [];
                }

                return findEntry(passStoreDir, input);
            }
        },
        {
            type: 'list',
            name: 'action',
            message: 'Action: ',
            default: "copy",
            choices: [
                {
                    name: "Copy",
                    value: "copy"
                },
                {
                    name: "Show",
                    value: "show"
                }
            ]
        }
    ]);

    const PASS_BIN = "/usr/bin/pass"
    let cmdAction;
    switch (answer.action) {
        case "copy":
            cmdAction = "show -c"
            break;
        case "show":
            cmdAction = "show"
            break;
        default:
            throw new Error(`Not supported action ${answer.action}.`);
    }

    
    const command = `${PASS_BIN} ${cmdAction} ${answer.entry}`;
    const child = exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error(stderr);
            process.exit(1);
            return;
        }

        console.log(stdout);
    });

    // in case of copy we need to detach from terminal
}

module.exports = { main };