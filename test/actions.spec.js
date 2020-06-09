const { EventEmitter } = require("events");

const assert = require("assert");
const rewire = require("rewire");
const sinon = require("sinon");
const stream = require("stream");

let store = require("../src/store"); 
let actions = rewire("../src/actions"); 

before(function () {
    process.env.PASSWORD_STORE_DIR = "./test/assets/store";
});

describe('haslo actions', function () {

    const PASS_ENTRY_CONTENT = `password
user:gregolsky
url:https://unittest.com
`;

    let spawnMock;
    let fakePassProcess;
    let fakeParentProcess;
    let clipboardyMock;

    function fakeProcess() {
        return Object.assign(new EventEmitter(), {
                    stdout: new stream.PassThrough({ encoding: "utf-8" }),
                    stderr: new stream.PassThrough({ encoding: "utf-8" }),
                    unref: sinon.mock(),
                    env: {}
                });
    }
    
    beforeEach(() => {
        store = rewire("../src/store"); 
        actions = rewire("../src/actions"); 

        fakePassProcess = fakeProcess();
        fakeParentProcess = fakeProcess();

        spawnMock = sinon.mock().returns(fakePassProcess);
        actions.__set__("spawn", spawnMock);
        actions.__set__("process", fakeParentProcess);

        clipboardyMock = { writeSync: sinon.mock() };
        actions.__set__("clipboardy", clipboardyMock);
    });

    const COMMAND = '/usr/bin/pass';
    const entry = "test/entry";

    describe("show action", function () {
        let output;

        beforeEach(async () => {
            output = ""
            fakeParentProcess.stdout.on("data", d => output += d)

            const action = new actions.createAction({ action: "show", entry });
            const actionResultPromise = action.run();
            fakePassProcess.stdout.write(PASS_ENTRY_CONTENT);
            fakePassProcess.emit("close", 0);
            await actionResultPromise;
        });

        it("its spawned process output is piped to stdout", () => {
            assert.strictEqual(output, PASS_ENTRY_CONTENT);
        });

        it('calls pass with proper args', async function () {
            const commandArgs = [ 'show', entry ];
            assert.strictEqual(spawnMock.callCount, 1);
            assert.ok(
                spawnMock.calledWithMatch(
                    COMMAND, sinon.match.array.deepEquals(commandArgs)));
        });

    });

    describe("copy password", function () {

        const EXPECTED_COMMAND_ARGS = ['show', '-c', entry ];

        it('calls pass with proper args', async function () {
            const action = new actions.createAction({ action: "copy_password", entry });
            const actionPromise = action.run();
            fakePassProcess.emit("exit", 0);
            await actionPromise;
            assert.strictEqual(spawnMock.callCount, 1);
            assert.ok(
                spawnMock.calledWithMatch(
                    COMMAND, sinon.match.array.deepEquals(EXPECTED_COMMAND_ARGS)));
        });

    });

    describe("copy user", function () {

        const EXPECTED_COMMAND_ARGS = ['show', entry ];

        it('copies user field to clipboard', async function () {
            const action = new actions.createAction({ action: "copy_user", entry });


            const actionPromise = action.run();
            // fake pass show
            fakePassProcess.stdout.write(PASS_ENTRY_CONTENT);
            fakePassProcess.stdout.emit("end");

            const actionResult = await actionPromise;

            assert.strictEqual(spawnMock.callCount, 1);
            assert.ok(
                spawnMock.calledWithMatch(
                    COMMAND, sinon.match.array.deepEquals(EXPECTED_COMMAND_ARGS)));
            assert.strictEqual(actionResult, "gregolsky");
        });

    });
});