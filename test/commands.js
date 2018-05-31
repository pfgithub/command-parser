/*global describe it*/

const assert = require("assert");

const Command = require("../index");
const about = Command.about;

let usage = new Command({});
usage.add("settings", new Command({
  "description": "Adjusts settings",
  "requirements": [(o, g) => g ? {"preCheck": "Info needs to be a function to use this command"} : typeof o === "function"]
}));
usage.add("reqtest", new Command({
  "description": "Adjusts settings",
  "requirements": [o => typeof o === "function"]
}));
usage.path("settings").add("rankmoji", new Command({
  "description": "Adjusts Rankmoji",
  "callback": (data) => {
    data("MYrankmoji");
  }
}));
usage.path("settings rankmoji").add("add", new Command({
  "description": "Adds a rankmoji",
  "usage": ["rank", "moji"],
  "callback": (data, rank, ...moji) => {
    data(`${rank  }, ${ moji.join` `.trim()}`);
  }
}));
usage.path("settings rankmoji").add("remove", new Command({
  "description": "Removes a rankmoji",
  "usage": [["rank", "moji"]],
  "requirements": [],
  "callback": (data, ...rankOrMoji) => {
    data(rankOrMoji.join` `.trim());
  }
}));
usage.depricate("rankmojiSettings", "settings rankmoji");

describe("Command", () => {
  it("should give the reason when there is one", () => {
    assert.equal(usage.parse("hi", "settings"), "Info needs to be a function to use this command");
  });
  it("should give a no reason message when there is no reason", () => {
    assert.equal(usage.parse("hi", "reqtest"), "This command could not be run. No reason was specified.");
  });
  it("should show usage when failing", () => {
    assert.equal(usage.parse(_=>_, "settings"), `Command not found. List of commands:\`\`\`settings rankmoji${" "}
settings rankmoji add ...
settings rankmoji remove ...\`\`\``);
  });
  it("should call the function", () => {
    assert.equal(usage.parse(o => assert.equal(o, "MYrankmoji"), "settings rankmoji"), undefined);
  });
  it("should call the function with arguments", () => {
    assert.equal(usage.parse(o => assert.equal(o, "rankID, my moji"), "settings rankmoji add rankID   my moji "), undefined);
  });
  it("should", () => {
    assert.equal(usage.parse(o => assert.equal(o, "moji to remove"), "settings rankmoji remove   moji to remove   "), undefined);
  });
  it("should", () => {
    assert.equal(usage.parse("hi", "rankmojiSettings"), "This command has been renamed to `settings rankmoji`. Please use that instead.");
  });
  it("should error when the path is not found", () => {
    assert.throws(_ => usage.path("settings notfound"));
  });
});

describe("about", () => {
  it("should be tested", () => {
    let ab = a => about({"preCheck": "hi", "other": "bye"}, [], b=>a===b); // eslint-disable-line func-style
    assert.equal(ab(true)(true), true);
    assert.equal(ab(false)(false), true);
    assert.equal(ab("yes")(true), false);
    assert.deepStrictEqual(ab(true)(true, {"preCheck": true}), {"preCheck": "hi"});
    assert.deepStrictEqual(ab(true)(true, {"other": true}), {"other": "bye"});
    assert.deepStrictEqual(ab(true)(true, {"preCheck": true, "other": true}), {"preCheck": "hi", "other": "bye"});

    let prereq = (b) => about({"preCheck": "hifail"}, [ab(b)], _=>b); // eslint-disable-line func-style
    assert.ok(prereq("hello")("hello"));
    assert.equal(prereq("hello")("hi"), false);
    assert.deepStrictEqual(prereq("true")("false", {"preCheck": true}), {"preCheck": "hi"});
    assert.deepStrictEqual(prereq(false)(false, {"preCheck": true}), {"preCheck": "hifail"});
    assert.deepStrictEqual(prereq(false)(false, {"test": true}), {"test": "No information available"});
  });
});

/*
settings rankmoji add <rank> <moji>
settings rankmoji remove
 */
