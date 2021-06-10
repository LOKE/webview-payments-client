//@ts-check

/**
 * @typedef {{token: string, firstName: string, lastName: string, phone: string, email: string, cardId: string}} Customer
 */

/**
 * @typedef {{amount: number, tax?: number, quantity: number, name: string}} PaymentRequestItem
 */

/**
 * @typedef {{clientId: string, orderStoreId: string, reference?: string, orderRef?: string, total: number, tax?: number, items: PaymentRequestItem[]}} PaymentRequest
 */

/**
 * @typedef {Object} Options
 * @property {boolean} interactive
 * @property {Customer} customer
 * @property {any} window
 * @property {string} [apiUrl]
 * @property {string} [os="Sandbox"] optionally override what is returned from getOS
 * @property {any} [fetch] a fetch API
 */

/**
 * Provides a mock implementation of the interface typically provided by a LOKE app
 */
class MockLokeApp {
  /**
   * @param {Options} opts
   */
  constructor(opts) {
    this._interactive = opts.interactive;
    this._window = opts.window;
    this._fetch = opts.fetch || fetch.bind(window);

    this._customer = opts.customer;
    this._os = opts.os || "Sandbox";
    this._gqlUrl = opts.apiUrl || "https://app-api.sbox.loke.global/graphql";
  }

  getOS() {
    return this._os;
  }

  getFirstName() {
    return this._customer.firstName;
  }

  getLastName() {
    return this._customer.lastName;
  }

  getPhone() {
    return this._customer.phone;
  }

  getEmail() {
    return this._customer.email;
  }

  getAstonMerchantId(storeId) {
    throw new Error("Not supported in mock");
  }

  /**
   *
   * @param {PaymentRequest} order
   * @param {number} id
   * @returns
   */
  payment(order, id) {
    if (this._interactive) {
      const result = confirm(
        order.clientId +
          " wants to charge you $" +
          order.total.toFixed(2) +
          ". Do you accept?"
      );
      if (!result) {
        this._window._tidyCallback(
          id,
          new Error("User rejected the payment"),
          null
        );
        return;
      }
    }

    this._fetch(this._gqlUrl, {
      method: "POST",
      body: JSON.stringify({
        operationName: "MockAuthorizePayment",
        query: `mutation MockAuthorizePayment(
  $order: JsInterfaceOrder!
  $cardId: String!
) {
  authorizePaymentV2(order: $order, cardId: $cardId) {
    nonce
    error {
      message
    }
  }
}`,
        variables: {
          order: order,
          cardId: this._customer.cardId,
        },
      }),
      headers: {
        "content-type": "application/json; charset=utf-8",
        accept: "application/json",
        authorization: "Bearer " + this._customer.token,
      },
    })
      .then((result) => {
        if (!result.ok) {
          if (result.status === 401) {
            throw new Error("Not authorized");
          }
          throw new Error("Payment failed");
        }
        return result.json();
      })
      .then((response) => {
        const { error, nonce } = response.data.authorizePaymentV2;

        if (error) {
          throw new Error(error.message);
        }

        this._window._tidyCallback(id, null, { nonce });
      })
      .catch((err) => {
        this._window._tidyCallback(id, err);
      });
  }

  complete(message) {
    if (!this._interactive) return;

    alert(
      'The mobile app will now show a "Close" button to indicate to the user the process is complete'
    );
  }

  close() {
    if (!this._interactive) return;

    alert("The mobile app will now close the webview");
  }
}

/**
 * @param {Omit<Options, "window">} opts
 * @returns
 */
exports.createMockWindow = (opts) => {
  const window = {};
  const mockApp = new MockLokeApp({ ...opts, window });
  window._tidyInterface = mockApp;
  return window;
};

exports.MockLokeApp = MockLokeApp;
