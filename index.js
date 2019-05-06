/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Conceptually, getDerivedStateFromProps is like a setState updater function.
// But it needs to be called *after* all the other updates in the queue, and it
// must be called exactly once, right before shouldComponentUpdate.
//
// Other than getDerivedStateFormProps itself, there's no lifecycle that meets
// these requirements. componentWillReceiveProps fires only if the props have
// changed. componentWillUpdate fires too late.
//
// This polyfill works by monkeypatching instance.updater. updater is an
// internal-ish API that has stayed mostly stable across several major versions
// of React. The polyfill intercepts updates before they are added to the native
// update queue. Then it schedules a single update with the native update queue,
// in the form of an updater function. Inside that updater function, the
// intercepted updates are processed. Finally, getDerivedStateFromProps is
// called and applied. This approach guarantees that getDerivedStateFromProps is
// always called at the end.
function processUpdateQueue(prevState, nextProps) {
  var queue = this.__updateQueue;
  this.__updateQueue = null;
  if (queue === null || queue === undefined) {
    return null;
  }
  // First process all the user-provided updates
  var nextState = prevState;
  var update = null;
  var payload = null;
  var callback = null;
  for (let i = 0; i < queue.length; i++) {
    update = queue[i];
    payload = update.payload;
    callback = update.callback;
    if (typeof payload === 'function') {
      payload = payload.call(this, prevState, nextProps);
    }
    if (payload !== null && payload !== undefined) {
      nextState = Object.assign({}, prevState, payload);
    }
    if (callback !== null) {
      let callbacks = this.__callbacks;
      if (callbacks === null || callbacks === undefined) {
        this.__callbacks = [callback];
      } else {
        callbacks.push(callback);
      }
    }
  }
  // Now that we've processed all the updates, we can call
  // `getDerivedStateFromProps`. This always comes last.
  var derivedState =
    this.constructor.getDerivedStateFromProps(nextProps, nextState);
  if (derivedState !== null && derivedState !== undefined) {
    nextState = Object.assign({}, prevState, derivedState);
  }
  return nextState;
}

function componentWillMount() {
  const originalUpdater = this.updater;
  
  this.updater = {
    enqueueSetState(instance, payload, callback) {
      var update = {
        payload: payload,
        callback: callback === undefined ? null : callback
      };
      let queue = instance.__updateQueue;
      if (queue === null || queue === undefined) {
        // Create a queue of updates. This will act as a polyfill for the native
        // update queue.
        queue = instance.__updateQueue = [update];
        // The native update queue should contain a single update function.
        // In that function, we will process all the updates in the polyfilled
        // queue. This allows us to call `getDerivedStateFromProps` after all
        // the other updates have been processed.
        originalUpdater.enqueueSetState(instance, processUpdateQueue);
      } else {
        // We already scheduled an update on the native queue. Push onto the
        // polyfilled queue.
        queue.push(update);
      }
    },
    enqueueReplaceState() {
      // Not worth implementing this since class components do no have a
      // `replaceState` method.
      throw new Error(
        'react-lifecycles-compat: enqueueReplaceState is not supported'
      );
    },
    // Note: Because forceUpdate does not accept an updater function, we can't
    // polyfill this correctly unless we're inside batchedUpdates. So gDSFP
    // will not fire unless we receive new props OR there's another update in
    // the same batch.
    enqueueForceUpdate: originalUpdater.enqueueForceUpdate,
    enqueueCallback(instance, callback) {
      instance.updater.enqueueSetState(instance, null, callback);
    }
  };

  // Add an empty update to the queue to trigger getDerivedStateFromProps
  this.setState(null);
}

function componentWillReceiveProps() {
  // Add an empty update to the queue to trigger getDerivedStateFromProps.
  this.setState(null);
}

function componentWillUpdate(nextProps, nextState) {
  try {
    var prevProps = this.props;
    var prevState = this.state;
    this.props = nextProps;
    this.state = nextState;
    this.__reactInternalSnapshotFlag = true;
    this.__reactInternalSnapshot = this.getSnapshotBeforeUpdate(
      prevProps,
      prevState
    );
  } finally {
    this.props = prevProps;
    this.state = prevState;
  }
}

// React may warn about cWM/cWRP/cWU methods being deprecated.
// Add a flag to suppress these warnings for this special case.
componentWillMount.__suppressDeprecationWarning = true;
componentWillReceiveProps.__suppressDeprecationWarning = true;
componentWillUpdate.__suppressDeprecationWarning = true;

export function polyfill(Component) {
  var prototype = Component.prototype;

  if (!prototype || !prototype.isReactComponent) {
    throw new Error('Can only polyfill class components');
  }

  if (
    typeof Component.getDerivedStateFromProps !== 'function' &&
    typeof prototype.getSnapshotBeforeUpdate !== 'function'
  ) {
    return Component;
  }

  // If new component APIs are defined, "unsafe" lifecycles won't be called.
  // Error if any of these lifecycles are present,
  // Because they would work differently between older and newer (16.3+) versions of React.
  var foundWillMountName = null;
  var foundWillReceivePropsName = null;
  var foundWillUpdateName = null;
  if (typeof prototype.componentWillMount === 'function') {
    foundWillMountName = 'componentWillMount';
  } else if (typeof prototype.UNSAFE_componentWillMount === 'function') {
    foundWillMountName = 'UNSAFE_componentWillMount';
  }
  if (typeof prototype.componentWillReceiveProps === 'function') {
    foundWillReceivePropsName = 'componentWillReceiveProps';
  } else if (typeof prototype.UNSAFE_componentWillReceiveProps === 'function') {
    foundWillReceivePropsName = 'UNSAFE_componentWillReceiveProps';
  }
  if (typeof prototype.componentWillUpdate === 'function') {
    foundWillUpdateName = 'componentWillUpdate';
  } else if (typeof prototype.UNSAFE_componentWillUpdate === 'function') {
    foundWillUpdateName = 'UNSAFE_componentWillUpdate';
  }
  if (
    foundWillMountName !== null ||
    foundWillReceivePropsName !== null ||
    foundWillUpdateName !== null
  ) {
    var componentName = Component.displayName || Component.name;
    var newApiName =
      typeof Component.getDerivedStateFromProps === 'function'
        ? 'getDerivedStateFromProps()'
        : 'getSnapshotBeforeUpdate()';

    throw Error(
      'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
        componentName +
        ' uses ' +
        newApiName +
        ' but also contains the following legacy lifecycles:' +
        (foundWillMountName !== null ? '\n  ' + foundWillMountName : '') +
        (foundWillReceivePropsName !== null
          ? '\n  ' + foundWillReceivePropsName
          : '') +
        (foundWillUpdateName !== null ? '\n  ' + foundWillUpdateName : '') +
        '\n\nThe above lifecycles should be removed. Learn more about this warning here:\n' +
        'https://fb.me/react-async-component-lifecycle-hooks'
    );
  }

  var componentDidUpdate = prototype.componentDidUpdate;  
  function componentDidUpdatePolyfill(prevProps, prevState, maybeSnapshot) {
    if (typeof Component.getDerivedStateFromProps === 'function') {
      // If getDerivedStateFromProps is defined, we polyfilled the update queue.
      // Flush the callbacks here.
      var callbacks = this.__callbacks;
      if (callbacks !== null && callbacks !== undefined) {
        this.__callbacks = null;
        for (var i = 0; i < callbacks.length; i++) {
          callbacks[i].call(this);
        }
      }
    }

    if (typeof componentDidUpdate === 'function') {
      // 16.3+ will not execute our will-update method;
      // It will pass a snapshot value to did-update though.
      // Older versions will require our polyfilled will-update value.
      // We need to handle both cases, but can't just check for the presence of "maybeSnapshot",
      // Because for <= 15.x versions this might be a "prevContext" object.
      // We also can't just check "__reactInternalSnapshot",
      // Because get-snapshot might return a falsy value.
      // So check for the explicit __reactInternalSnapshotFlag flag to determine behavior.
      var snapshot = this.__reactInternalSnapshotFlag
        ? this.__reactInternalSnapshot
        : maybeSnapshot;

      componentDidUpdate.call(this, prevProps, prevState, snapshot);
    }
  }

  // React <= 16.2 does not support static getDerivedStateFromProps.
  // As a workaround, use cWM and cWRP to invoke the new static lifecycle.
  // Newer versions of React will ignore these lifecycles if gDSFP exists.
  if (typeof Component.getDerivedStateFromProps === 'function') {
    prototype.componentWillMount = componentWillMount;
    prototype.componentWillReceiveProps = componentWillReceiveProps;
    prototype.componentDidUpdate = componentDidUpdatePolyfill;
  }

  // React <= 16.2 does not support getSnapshotBeforeUpdate.
  // As a workaround, use cWU to invoke the new lifecycle.
  // Newer versions of React will ignore that lifecycle if gSBU exists.
  if (typeof prototype.getSnapshotBeforeUpdate === 'function') {
    prototype.componentWillUpdate = componentWillUpdate;
    if (typeof prototype.componentDidUpdate !== 'function') {    
      throw new Error(
        'Cannot polyfill getSnapshotBeforeUpdate() for components that do ' +
          'not define componentDidUpdate() on the prototype'
      );
    }
    prototype.componentDidUpdate = componentDidUpdatePolyfill;
  }

  return Component;
}
