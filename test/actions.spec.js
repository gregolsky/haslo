const { EventEmitter } = require("events");

const assert = require("assert");
const rewire = require("rewire");
const sinon = require("sinon");

let store = require("../src/store"); 
let actions = rewire("../src/actions"); 

before(function () {
    process.env.PASSWORD_STORE_DIR = "./test/assets/store";
});

describe('haslo actions', function () {

    let storeDir;
    let spawnMock;
    let fakeChildProcess;
    
    beforeEach(() => {
        store = rewire("../src/store"); 
        actions = rewire("../src/actions"); 

        function fakeStream() {
            return Object.assign(new EventEmitter(), { pipe: sinon.mock('pipe') })
        }

        fakeChildProcess = Object.assign(new EventEmitter(), {
            stdout: fakeStream(),
            stderr: fakeStream(),
            unref: sinon.mock()
        });
        spawnMock = sinon.mock().returns(fakeChildProcess);
        actions.__set__("spawn", spawnMock);
    });

    const COMMAND = '/usr/bin/pass';
    const entry = "test/entry";

    it ('show calls pass with proper args', async function () {
        const action = new actions.createAction({ action: "show", entry });
        const actionResultPromise = action.run();
        fakeChildProcess.emit("close", 0);
        await actionResultPromise;
        const commandArgs = [ 'show', entry ];
        assert.strictEqual(spawnMock.callCount, 1);
        assert.ok(
            spawnMock.calledWithMatch(
                COMMAND, sinon.match.array.deepEquals(commandArgs)));
    });

    it('copy password calls pass with proper args', async function () {
        const action = new actions.createAction({ action: "copy_password", entry });
        setTimeout(() => fakeChildProcess.stdout.emit("data", "test"), 0);
        await action.run();
        const commandArgs = ['show', '-c', entry ];
        assert.strictEqual(spawnMock.callCount, 1);
        assert.ok(
            spawnMock.calledWithMatch(
                COMMAND, sinon.match.array.deepEquals(commandArgs)));
    });

    it.skip('finds the right entry');
    it.skip('TODO other actions');
});