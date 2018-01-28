# react-lifecycles-compat

## What is this project?

React version 17 will deprecate several of the class component API lifecycles: `componentWillMount`, `componentWillReceiveProps`, and `componentWillUpdate`. (See [React RFC 6](https://github.com/reactjs/rfcs/pull/6) for more information about this decision.)

This would typically require any third party libraries dependent on those lifecycles to release a new major version in order to adhere to semver. However, the `react-lifecycles-compat` polyfill offers a way to remain compatible with older versions of React (0.14.9+). 🎉😎

## How can I use the polyfill

First, install the polyfill from NPM:
```sh
# Yarn
yarn add react-lifecycles-compat

# NPM
npm install react-lifecycles-compat --save
```

Next, update your component to use the new static lifecycle, `getDerivedStateFromProps`. For example:
```js
// Before
class ExampleComponent extends React.Component {
  state = {
    derivedData: computeDerivedState(this.props)
  };

  componentWillReceiveProps(nextProps) {
    if (this.props.someValue !== nextProps.someValue) {
      this.setState({
        derivedData: computeDerivedState(nextProps)
      });
    }
  }
}

// After
class ExampleComponent extends React.Component {
  // Initialize state in constructor,
  // Or with a property initializer.
  state = {};

  static getDerivedStateFromProps(nextProps, prevState) {
    if (prevState.someMirroredValue !== nextProps.someValue) {
      return {
        derivedData: computeDerivedState(nextProps),
        someMirroredValue: nextProps.someValue
      };
    }

    // Return null to indicate no change to state.
    return null;
  }
}
```

Lastly, use the polyfill to make your component backwards compatible with older versions of React:
```js
import React from 'react';
import polyfill from 'react-lifecycles-compat';

class ExampleComponent extends React.Component {
  static getDerivedStateFromProps(nextProps, prevState) {
    // ...
  }

  // ...
}

// Polyfill your component to work with older versions of React:
polyfill(ExampleComponent);

export default ExampleComponent;
```