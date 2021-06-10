# webview-payments-client
SDK for making payments from a webview inside LOKE mobile apps.

## Installation

```
npm i @loke/webview-payments-client
```

## Usage

Please refer to the example project for more context.

```js
import { LokeApp } from "@loke/webview-payments-client";
const lokeApp = new LokeApp({ clientId: "loke-provided-client-id" });
```

### Example React Project

```jsx
import { LokeApp } from "./lib";

// You may want to pass in lokeApp as a prop, or initialise some other way
const lokeApp = new LokeApp({ clientId: "loke-provided-client-id" });

function App() {
  const handleClick = async () => {
    try {
      const { nonce } = await lokeApp.payment({
        total: 550,
        tax: 50,
        orderRef: "my-unique-ref",
        items: [
          { amount: 450, name: "Coffee", quantity: 1 },
          { amount: 100, name: "Hug", quantity: 10 },
        ],
      });

      // TODO: send the nonce to your backend, have your backend complete the transaction.
    } catch (err) {
      console.error(err);
      alert("Sorry, payment failed - " + err.message);
    }
  };

  if (!lokeApp.isAvailable()) {
    return <div>Something went wrong - LOKE app is not available.</div>;
  }

  return (
    <div>
      <p>{lokeApp.getFirstName()} {lokeApp.getLastName()}</p>
      <p>{lokeApp.getEmail()}</p>
      <p>{lokeApp.getPhone()}</p>
      <button onClick={handleClick}>Do Payment</button>
    </div>
  );
}

export default App;
```

### Example React Project - Development

You will need to also provide the "mock window" with some test data:

```js
import { createMockWindow, LokeApp } from "./lib";

const customer = {
  token: "test-access-token",
  firstName: "John",
  lastName: "Smith",
  phone: "+61412345678",
  email: "no-reply@loke.com.au",
  cardId: "test-card-id",
};

// To use within a LOKE app just do not supply the mock window
// To use outside a LOKE app you need to provide a mock for the 
// window object with the required bound functionality
const mockWindow = createMockWindow({
  interactive: true,
  customer,
});
const lokeApp = new LokeApp({ clientId: "loke-provided-client-id", window: mockWindow });

function App() {
  // ...
```

## Using the Mock for Development Purposes

```js
import { LokeApp, createMockWindow } from "@loke/webview-payments-client";

// When using this in development in a browser pass in a mock "window" object.
const mockWindow = createMockWindow({
  // If you want to use this within a browser
  interactive: true,
  // You need to pass in details for the customer linked to the mock
  customer,
})
const lokeApp = new LokeApp({ clientId: "loke-provided-client-id", window: mockWindow });
```

## Using the Mock for Test Automation Purposes

```js
import { LokeApp, createMockWindow } from "@loke/webview-payments-client";
import nodeFetch from "node-fetch";

// When using this in development for automated tests pass in a mock "window" object.
const window = createMockWindow({
  // If you want to use this without user interaction set this false
  interactive: false,
  // If running outside of the browser you will need to pass in something that implements the fetch API.
  // eg node-fetch or unfetch
  // You could also use a fetch variant with mocked or recorded responses for tests
  fetch: nodeFetch,
  // You need to pass in details for the customer linked to the mock
  customer,
})
// You can then pass in the mock window to LokeApp and it will provide the behaviour of the app
const lokeApp = new LokeApp({ clientId: "loke-provided-client-id", window });
```
