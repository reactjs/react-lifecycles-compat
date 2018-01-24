var React = require('react');

module.exports = function polyfill(Component) {
  if (
    !Component.prototype ||
    !Component.prototype.isReactComponent
  ) {
    throw new Error('Can only polyfill class components');
  }

  if (typeof Component.getDerivedStateFromProps === 'function') {
    if (typeof Component.prototype.componentWillMount === 'function') {
      throw new Error('Cannot polyfill if componentWillMount already exists');
    }

    if (typeof Component.prototype.componentWillReceiveProps === 'function') {
      throw new Error(
        'Cannot polyfill if componentWillReceiveProps already exists'
      );
    }

    var internals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

    // React 16.3+ exposes this feature detection flag.
    // We can bail out early in this case since no polyfill is required.
    if (internals !== undefined && internals.supportsGetDerivedStateFromProps === true) {
      return Component;
    }

    // Older versions of React do not support static getDerivedStateFromProps.
    // As a workaround, use cWM and cWRP to invoke the new static lifecycle.
    Component.prototype.componentWillMount = function componentWillReceiveProps() {
      var state = Component.getDerivedStateFromProps(this.props, this.state);
      if (state !== null && state !== undefined) {
        this.setState(state);
      }
    };
    Component.prototype.componentWillReceiveProps = function componentWillReceiveProps(
      nextProps
    ) {
      var state = Component.getDerivedStateFromProps(nextProps, this.state);
      if (state !== null && state !== undefined) {
        this.setState(state);
      }
    };
  }

  return Component;
};
