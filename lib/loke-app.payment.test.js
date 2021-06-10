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

test.beforeEach((t) => {
  const jsonStub = sinon
    .stub()
    .resolves({ data: { authorizePaymentV2: { nonce: "testnonce" } } });
  const fetchStub = sinon.stub().resolves({ json: jsonStub, ok: true });
  const window = createMockWindow({
    interactive: false,
    fetch: fetchStub,
    customer,
  });
  t.context.lokeApp = new LokeApp({ clientId: "testing", window });
  t.context.fetchStub = fetchStub;
  t.context.jsonStub = jsonStub;
});

test("calls fetch for a payment request", async (t) => {
  await t.context.lokeApp.payment({ total: 100, items: [] });
  t.true(t.context.fetchStub.calledOnce);
  t.deepEqual(t.context.fetchStub.getCall(0).args, [
    "https://app-api.sbox.loke.global/graphql",
    {
      body: '{"operationName":"MockAuthorizePayment","query":"mutation MockAuthorizePayment(\\n  $order: JsInterfaceOrder!\\n  $cardId: String!\\n) {\\n  authorizePaymentV2(order: $order, cardId: $cardId) {\\n    nonce\\n    error {\\n      message\\n    }\\n  }\\n}","variables":{"order":{"clientId":"testing","total":1,"tax":null,"items":[]},"cardId":"test-card-id"}}',
      headers: {
        accept: "application/json",
        authorization: "Bearer test-access-token",
        "content-type": "application/json; charset=utf-8",
      },
      method: "POST",
    },
  ]);
});

test("returns the API response on success", async (t) => {
  const result = await t.context.lokeApp.payment({ total: 100, items: [] });
  t.deepEqual(result, { nonce: "testnonce" });
});

test("passes through the API error message on error response", async (t) => {
  t.context.jsonStub.resetBehavior();
  t.context.jsonStub.resolves({
    data: {
      authorizePaymentV2: { error: { message: "Insufficient funds" } },
    },
  });
  await t.throwsAsync(
    () => t.context.lokeApp.payment({ total: 100, items: [] }),
    { message: "Insufficient funds" }
  );
});

test("passes through the API error message on fail", async (t) => {
  t.context.fetchStub.resetBehavior();
  t.context.fetchStub.rejects(new Error("Bad request"));
  await t.throwsAsync(
    () => t.context.lokeApp.payment({ total: 100, items: [] }),
    { message: "Bad request" }
  );
});

test("passes through the API error message on request fail", async (t) => {
  t.context.fetchStub.resetBehavior();
  t.context.fetchStub.resolves({ ok: false });
  await t.throwsAsync(
    () => t.context.lokeApp.payment({ total: 100, items: [] }),
    { message: "Payment failed" }
  );
});
