//@ts-check

class LokeApp {
  /**
   * @param {Object} opts
   * @param {string} opts.clientId Your clientId allocated by LOKE. This must match the client ID associated with your access token.
   * @param {*} opts.window For use within a LOKE app you _must_ pass in the browser window object. The app will bind to this.
   *                        For test and development purposes you may pass in a mock.
   * @param {*} [opts.logger] Logger interface. If not provided uses console.
   */
  constructor(opts) {
    if (!opts.clientId) throw new Error("No client ID provided");

    /** @private */
    this._clientId = opts.clientId;
    /** @private */
    this._window = opts.window || window;
    /** @private */
    this._logger = opts.logger || console;

    /** @private */
    this._lastId = 0;
    /** @private */
    this._callbacks = {};

    this._window._tidyCallback = (callbackId, ...args) => {
      const callback = this._callbacks[callbackId];
      if (!callback) {
        this._logger.warn("No callback found with ID " + callbackId);
      }
      delete this._callbacks[callbackId];
      callback.apply(null, args);
    };
  }

  /** @private */
  _getNextId() {
    return String(this._lastId++);
  }

  /** @private */
  _getApp() {
    return this._window._tidyInterface;
  }

  isAvailable() {
    return Boolean(this._getApp());
  }

  getOS() {
    const app = this._getApp();
    return (app && app.getOS && app.getOS()) || null;
  }

  isTidyIos() {
    const app = this._getApp();
    return app && app.getOS && app.getOS() === "iOS";
  }

  isTidyAndroid() {
    const app = this._getApp();
    return app && app.getOS && app.getOS() === "Android";
  }

  isTidySandbox() {
    const app = this._getApp();
    return app && app.getOS && app.getOS() === "Sandbox";
  }

  isTidyOs(osName) {
    const app = this._getApp();
    return app && app.getOS && app.getOS() === osName;
  }

  getFirstName() {
    const app = this._getApp();
    return (app && app.getFirstName && app.getFirstName()) || null;
  }

  getLastName() {
    const app = this._getApp();
    return (app && app.getLastName && app.getLastName()) || null;
  }

  getPhone() {
    const app = this._getApp();
    return (app && app.getPhone && app.getPhone()) || null;
  }

  getEmail() {
    const app = this._getApp();
    return (app && app.getEmail && app.getEmail()) || null;
  }

  // getAstonMerchantId(orderStoreId) {
  //   const app = this._getApp();
  //   return (
  //     (app && app.getAstonMerchantId && app.getAstonMerchantId(orderStoreId)) ||
  //     null
  //   );
  // }

  complete(message) {
    const app = this._getApp();
    if (app && app.complete) app.complete(message);
  }

  close() {
    const app = this._getApp();
    if (app && app.close) app.close();
  }

  /**
   * @param {Object} order
   * @param {number} order.total the order total in lowest denomination (eg cents)
   * @param {string} order.orderStoreId a unique identifier of the store to be charged - must also be known/configured in LOKE
   * @param {number} [order.tax] provide the amount of tax included if applicable/available in lowest denomination (eg cents)
   * @param {string} [order.orderRef] reference identifier for this order (typically an ID shared with your system)
   * @param {string} [order.reference] alias for orderRef
   * @param {{name: string, quantity: number, amount: number, tax?: number}[]} order.items
   * @returns {Promise<{ nonce: string }>} a nonce/token to use to complete the transaction
   */
  payment(order) {
    return new Promise((resolve, reject) => {
      if (!order) {
        throw new Error("No order provided.");
      }
      if (!order.items) {
        throw new Error("No order items provided.");
      }

      const app = this._getApp();

      const args = {
        clientId: this._clientId,
        orderRef: order.orderRef || order.reference || undefined,
        // legacy APIs currently use decimal
        total: order.total / 100,
        tax: order.tax ? order.tax / 100 : null,
        items: order.items.map(function (item) {
          return {
            name: item.name,
            quantity: item.quantity,
            amount: item.amount / 100,
            tax: typeof item.tax === "number" ? item.tax / 100 : null,
          };
        }),
        orderStoreId: order.orderStoreId,
      };

      // save async callback
      var callbackId = this._getNextId();
      this._callbacks[callbackId] = (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      };

      // figure out which method the interface implements
      if (app && app.payment) {
        app.payment(args, callbackId);
      } else if (app && app.paymentJSON) {
        app.paymentJSON(JSON.stringify(args), callbackId);
      } else {
        reject(new Error("Interface does not support payments"));
      }
    });
  }
}

exports.LokeApp = LokeApp;
