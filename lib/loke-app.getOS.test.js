const test = require("ava");
const sinon = require("sinon");
const { LokeApp } = require("./loke-app");
const { createMockWindow } = require("./mock");

test("returns null when no interface loaded", (t) => {
  const window = {};
  const lokeApp = new LokeApp({ clientId: "test", window });
  t.is(lokeApp.getOS(), null);
});

test("returns the bound OS when interface is loaded", (t) => {
  const window = createMockWindow({
    interactive: false,
    fetch: sinon.stub(),
  });
  const lokeApp = new LokeApp({ clientId: "test", window });
  t.is(lokeApp.getOS(), "Sandbox");
});
