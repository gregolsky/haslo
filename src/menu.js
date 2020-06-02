const inquirer = require('inquirer');
const { findEntry } = require('./store');

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

module.exports = { selectAction, selectEntry };

async function selectEntry(passStoreDir) {
    return inquirer.prompt([
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
        }]);
}

async function selectAction(entry) {
    return inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: `Action on ${entry}: `,
            default: "copy",
            choices: [
                {
                    name: "Copy password",
                    value: "copy_password"
                },
                {
                    name: "Copy user",
                    value: "copy_user"
                },
                {
                    name: "Copy URL",
                    value: "copy_url"
                },
                {
                    name: "Show",
                    value: "show"
                },
                {
                    name: "Go back",
                    value: "back"
                }
            ]
        }
    ]);
}