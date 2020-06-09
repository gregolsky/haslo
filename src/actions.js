
const os = require("os");
const { spawn } = require('child_process');
const clipboardy = require("clipboardy");

const PASS_BIN = process.env.PASS_BIN || "/usr/bin/pass";

class PassEntryActionBase {

    constructor({ entry, pipeOutput }) {
        this._entry = entry;
        this._pipeOutput = pipeOutput || [ "stdout", "stderr" ];
    }

    renderCommand() {
        throw new Error("Not implemented");
    }

    getSpawnOpts() {
        return {};
    }

    _pipeProcessOutput(proc) {
        for (const outStreamName of this._pipeOutput)
            proc[outStreamName].pipe(process[outStreamName]);
    }

    runPass() {
        const param = this.renderCommand();
        const p = spawn(param[0], param.slice(1), this.getSpawnOpts());

        this._pipeProcessOutput(p);

        return p;
    }

}

class CopyPassword extends PassEntryActionBase {

    constructor(opts) {
        super(Object.assign({ 
            pipeOutput: [ "stdout", "stderr" ] 
        }, opts));
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
        const p = this.runPass();
        p.unref();
        return new Promise((resolve, reject) => {
            p.once('exit', code => code === 0 ? resolve() : reject(code));
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
        const p = this.runPass();
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
        super(Object.assign({ pipeOutput: [ "stderr" ] }, opts));
        this._field = opts.field;
    }

    renderCommand() {
        return [ PASS_BIN, 'show', this._entry ];
    }

    async run() {
        const p = this.runPass();
        const output = await gatherOutput(p.stdout);
        const line = this._findLine(output);
        const value = this._extractValue(line);
        clipboardy.writeSync(value);
        return value;
    }

    _findLine(output) {
        return output.split(os.EOL)
            .filter(x => 
                x.includes(":") 
                && x.toLowerCase().startsWith(this._field))[0];
    }

    _extractValue(line) {
        const fieldPrefix = new RegExp(`^${this._field}:`, "i");
        const value = line.replace(fieldPrefix, "").trim();
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

function getCopyField(opts, field) {
    return new CopyField(Object.assign({ field }, opts));
}

function createAction(opts) {
    if (!opts.action) {
        throw new Error("'action' is required.");
    }

    if (!opts.entry) {
        throw new Error("'entry' is required");
    }

    switch (opts.action) {
        case "copy_password":
            return new CopyPassword(opts);
        case "copy_user":
            return getCopyField(opts, "user");
        case "copy_url":
            return getCopyField(opts, "url");
        case "show":
            return new ShowEntry(opts);
        default:
            throw new Error(`Not supported action ${opts}.`);
    }
}

module.exports = { createAction };