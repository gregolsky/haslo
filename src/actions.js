
const os = require("os");
const { spawn } = require('child_process');
const clipboardy = require("clipboardy");

const PASS_BIN = process.env.PASS_BIN || "/usr/bin/pass";

class PassEntryActionBase {

    constructor({ entry }) {
        this._entry = entry;
    }

    renderCommand() {
        throw new Error("Not implemented");
    }

    getSpawnOpts() {
        return {};
    }

    run() {
        const param = this.renderCommand();
        const p = spawn(param[0], param.slice(1), this.getSpawnOpts());
        p.stdout.pipe(process.stdout);
        p.stderr.pipe(process.stderr);

        return p;
    }

}

class CopyPassword extends PassEntryActionBase {

    constructor(opts) {
        super(opts)
    }

    renderCommand() {
        return [ PASS_BIN, 'show', '-c', this._entry ];
    }

    getSpawnOpts() {
        return {
            detached: true
        };
    }

    run() {
        const p = super.run();
        return new Promise((resolve, reject) => {
            p.stdout.once('data', (data) => {
                p.unref();
                resolve();
            });
        });
    }
}

class ShowEntry extends PassEntryActionBase {

    constructor(opts) {
        super(opts)
    }

    renderCommand() {
        return [ PASS_BIN, 'show', this._entry ];
    }

    async run() {
        const p = super.run();
        return new Promise((resolve, reject) => {
            p.once('close', 
                (code) => code === 0 
                    ? resolve() 
                    : reject(new Error("Pass exited with exit code " + code)));
        })
    }
}

class CopyField extends PassEntryActionBase {

    constructor(opts) {
        super(opts);
        this._field = opts.field;
    }

    renderCommand() {
        return [ PASS_BIN, 'show', this._entry ];
    }

    async run() {
        const param = this.renderCommand();
        const p = spawn(param[0], param.slice(1), this.getSpawnOpts());
        p.stderr.pipe(process.stderr);

        const output = await gatherOutput(p.stdout);
        const line = output.split(os.EOL)
            .filter(x => x.includes(":") && x.toLowerCase().startsWith(this._field))[0];
        const fieldPrefix = new RegExp(`^${this._field}:`, "i");
        const value = line.replace(fieldPrefix, "").trim();
        clipboardy.writeSync(value);
        return value;
    }
}

async function gatherOutput(stream) {
    stream.setEncoding("utf-8");
    let result = "";
    return new Promise((resolve, reject) => {
        stream.once("error", reject);
        stream.on("data", function (chunk) {
            result += chunk;
        });

        // Send the buffer or you can put it into a var
        stream.once("end", function () {
            resolve(result);
        });
    });
}

function createAction(opts) {
    if (!opts.action) {
        throw new Error("'action' is required.");
    }

    if (!opts.entry) {
        throw new Error("'entry' is required");
    }

    function getCopyField(field) {
        return new CopyField(Object.assign({ field }, opts));
    }

    switch (opts.action) {
        case "copy_password":
            return new CopyPassword(opts);
        case "copy_user":
            return getCopyField("user");
        case "copy_url":
            return getCopyField("url");
        case "show":
            return new ShowEntry(opts);
        default:
            throw new Error(`Not supported action ${opts}.`);
    }
}

module.exports = { createAction };