const { selectAction, selectEntry } = require("./menu");
const { createAction } = require("./actions");
const { getPasswordStoreDir } = require('./store');

async function main() {

    const passStoreDir = getPasswordStoreDir();

    while (true) {

        let { entry } = await selectEntry(passStoreDir);
        
        while (true) {
            let { action } = await selectAction(entry);
            if (action === "back") {
                break;
            }

            const actionInstance = createAction({ entry, action });
            await actionInstance.run();
        }
    }
}

module.exports = { main };