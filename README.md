# react-lifecycles-compat

## What is this project?

React version 17 will deprecate several of the class component API lifecycles: `componentWillMount`, `componentWillReceiveProps`, and `componentWillUpdate` and introduce a couple of new ones. (Check out the [ReactJS blog](https://reactjs.org/blog) for more information about this decision.)

This would typically require any third party libraries dependent on those lifecycles to release a new major version in order to adhere to semver. However, the `react-lifecycles-compat` polyfill offers a way to remain compatible with older versions of React (0.14.9+). 🎉😎

## How can I use the polyfill

First, install the polyfill from NPM:
```sh
# Yarn
yarn add react-lifecycles-compat

# NPM
npm install react-lifecycles-compat --save
```

Next, update your component and replace any of the deprecated lifecycles with new ones introduced with React 16.3. (See [the examples](#examples) below.)

Lastly, use the polyfill to make your component backwards compatible with older versions of React:
```js
import React from 'react';
import polyfill from 'react-lifecycles-compat';

class ExampleComponent extends React.Component {
  // ...
}

// Polyfill your component so the new lifecycles will work with older versions of React:
polyfill(ExampleComponent);

export default ExampleComponent;
```

## Examples

### `getDerivedStateFromProps` example
Before:
```js
class ExampleComponent extends React.Component {
  state = {
    isScrollingDown: false,
  };

  componentWillReceiveProps(nextProps) {
    if (this.props.currentRow !== nextProps.currentRow) {
      this.setState({
        isScrollingDown:
          nextProps.currentRow > this.props.currentRow,
      });
    }
  }
}
```
After:
```js
class ExampleComponent extends React.Component {
  // Initialize state in constructor,
  // Or with a property initializer.
  state = {
    isScrollingDown: false,
    lastRow: null,
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.currentRow !== prevState.lastRow) {
      return {
        isScrollingDown:
          nextProps.currentRow > prevState.lastRow,
        lastRow: nextProps.currentRow,
      };
    }

    // Return null to indicate no change to state.
    return null;
  }
}
```

### `getSnapshotBeforeUpdate` example

Before:
```js
class ScrollingList extends React.Component {
  listRef = null;
  prevScrollHeight = null;

  componentWillUpdate(nextProps, nextState) {
    if (this.props.list.length < nextProps.list.length) {
      this.prevScrollHeight = this.listRef.scrollHeight;
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.prevScrollHeight !== null) {
      this.listRef.scrollTop +=
        this.listRef.scrollHeight - this.prevScrollHeight;
      this.prevScrollHeight = null;
    }
  }

  render() {
    return <div ref={this.setListRef}>{/* ...contents... */}</div>;
  }

  setListRef = ref => {
    this.listRef = ref;
  };
}
```
After:
```js
class ScrollingList extends React.Component {
  listRef = null;

  getSnapshotBeforeUpdate(prevProps, prevState) {
    if (prevProps.list.length < this.props.list.length) {
      return this.listRef.scrollHeight;
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (snapshot !== null) {
      this.listRef.scrollTop += this.listRef.scrollHeight - snapshot;
    }
  }

  render() {
    return <div ref={this.setListRef}>{/* ...contents... */}</div>;
  }

  setListRef = ref => {
    this.listRef = ref;
  };
}
```