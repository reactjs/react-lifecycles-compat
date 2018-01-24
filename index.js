var React = require('react');

/**
 * Example usage:
 * class MyComponent extends React.Component {
 *   static getDerivedStateFromProps(nextProps, prevState) {
 *     // ...
 *   }
 *   // ...
 * }
 *
 * polyfill(MyComponent);
 */
module.exports = function polyfill(Component) {
  if (
    Component.prototype == null ||
    Component.prototype.isReactComponent == null
  ) {
    throw new Error('Can only polyfill class components');
  }

  if (typeof Component.getDerivedStateFromProps === 'function') {
    if (Component.prototype.componentWillMount != null) {
      throw new Error('Cannot polyfill if componentWillMount already exists');
    }

    if (Component.prototype.componentWillReceiveProps != null) {
      throw new Error(
        'Cannot polyfill if componentWillReceiveProps already exists'
      );
    }

    var internals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

    // React 16.3+ exposes this feature detection flag.
    // We can bail out early in this case since no polyfill is required.
    if (internals !== undefined && internals.supportsNewLifecycles === true) {
      return;
    }

    // Older versions of React do not support static getDerivedStateFromProps.
    // As a workaround, use cWM and cWRP to invoke the new static lifecycle.
    Component.prototype.componentWillMount = function componentWillReceiveProps() {
      var state = Component.getDerivedStateFromProps(this.props, this.state);
      if (state != null) {
        this.setState(state);
      }
    };
    Component.prototype.componentWillReceiveProps = function componentWillReceiveProps(
      nextProps
    ) {
      var state = Component.getDerivedStateFromProps(nextProps, this.state);
      if (state != null) {
        this.setState(state);
      }
    };
  }

  return Component;
};
