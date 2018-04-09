## [Unreleased]
<details>
  <summary>
    Changes that have landed in master but are not yet released.
    Click to see more.
  </summary>
</details>

## 3.0.0 (April 9, 2018)

Throw an error for any polyfilled component that mixes old lifecycles (`componentWillMount`, `componentWillReceiveProps`, or `componentWillUpdate`) and new lifecycles (`getDerivedStateFromProps` or `getSnapshotBeforeUpdate`) as React 16.3+ does not support this case and will not invoke the old lifecycles. This error ensures consistent behavior between React 16.3+ and older versions. ([#14](https://github.com/reactjs/react-lifecycles-compat/pull/14))

## 2.0.1 (April 9, 2018)

Add a DEV mode warning for any polyfilled component that mixes old lifecycles (`componentWillMount`, `componentWillReceiveProps`, or `componentWillUpdate`) and new lifecycles (`getDerivedStateFromProps` or `getSnapshotBeforeUpdate`) as React 16.3+ does not support this case and will not invoke the old lifecycles. This warning ensures consistent behavior between React 16.3+ and older versions. ([#15](https://github.com/reactjs/react-lifecycles-compat/pull/15))

## 2.0.0 (April 4, 2018)

Package uses a named export and includes an ES6 module build. ([#11](https://github.com/reactjs/react-lifecycles-compat/pull/11))

```js
// 1.x (before)
import polyfill from 'react-lifecycles-compat';

// 2.x (after)
import {polyfill} from 'react-lifecycles-compat';
```

## 1.1.4 (April 3, 2018)

Improved handling of falsy return values from polyfilled `getSnapshotBeforeUpdate()` lifecycle. [#12](https://github.com/reactjs/react-lifecycles-compat/pull/12)