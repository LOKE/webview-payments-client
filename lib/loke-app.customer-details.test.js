const test = require("ava");
const sinon = require("sinon");
const { LokeApp } = require("./loke-app");
const { createMockWindow } = require("./mock");
const customer = {
  token: "test-access-token",
  firstName: "John",
  lastName: "Smith",
  phone: "+61412345678",
  email: "no-reply@loke.com.au",
  cardId: "test-card-id",
};

test("returns null when no interface loaded", (t) => {
  const window = {};
  const lokeApp = new LokeApp({ clientId: "test", window });
  t.is(lokeApp.getFirstName(), null);
  t.is(lokeApp.getLastName(), null);
  t.is(lokeApp.getLastName(), null);
  t.is(lokeApp.getEmail(), null);
});

test("returns values when interface is loaded", (t) => {
  const window = createMockWindow({
    interactive: false,
    fetch: sinon.stub(),
    customer,
  });
  const lokeApp = new LokeApp({ clientId: "test", customer, window });
  t.is(lokeApp.getFirstName(), "John");
  t.is(lokeApp.getLastName(), "Smith");
  t.is(lokeApp.getPhone(), "+61412345678");
  t.is(lokeApp.getEmail(), "no-reply@loke.com.au");
});
