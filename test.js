'use strict';

const polyfill = require('./index');

// TODO Test React 16.3 as well (once it exists)
const REACT_VERSIONS = ['15.6', '16.2'];

describe('react-lifecycles-compat', () => {
  let createReactClass;
  let React;
  let ReactDOM;

  REACT_VERSIONS.forEach(version => {
    jest.resetModules();

    const basePath = `./react/${version}/node_modules/`;

    createReactClass = require(basePath + 'create-react-class');
    React = require(basePath + 'react');
    ReactDOM = require(basePath + 'react-dom');

    describe(`react version ${version}`, () => {
      it('should initialize and update state correctly', () => {
        class ClassComponent extends React.Component {
          constructor(props) {
            super(props);
            this.state = {count: 1};
          }
          static getDerivedStateFromProps(nextProps, prevState) {
            return {
              count: prevState.count + nextProps.incrementBy,
            };
          }
          render() {
            return React.createElement('div', null, this.state.count);
          }
        }

        polyfill(ClassComponent);

        const container = document.createElement('div');
        ReactDOM.render(
          React.createElement(ClassComponent, {incrementBy: 2}),
          container
        );

        expect(container.textContent).toBe('3');

        ReactDOM.render(
          React.createElement(ClassComponent, {incrementBy: 3}),
          container
        );

        expect(container.textContent).toBe('6');
      });

      it('should support create-react-class components', () => {
        const CRCComponent = createReactClass({
          statics: {
            getDerivedStateFromProps(nextProps, prevState) {
              return {
                count: prevState.count + nextProps.incrementBy,
              };
            },
          },
          getInitialState() {
            return {count: 1};
          },
          render() {
            return React.createElement('div', null, this.state.count);
          },
        });

        polyfill(CRCComponent);

        const container = document.createElement('div');
        ReactDOM.render(
          React.createElement(CRCComponent, {incrementBy: 2}),
          container
        );

        expect(container.textContent).toBe('3');

        ReactDOM.render(
          React.createElement(CRCComponent, {incrementBy: 3}),
          container
        );

        expect(container.textContent).toBe('6');
      });

      it('should support getDerivedStateFromProps in subclass', () => {
        class BaseClass extends React.Component {
          constructor(props) {
            super(props);
            this.state = {};
          }
          static getDerivedStateFromProps(nextProps, prevState) {
            return {
              foo: 'foo'
            };
          }
          render() {
            return null;
          }
        }

        polyfill(BaseClass);

        class SubClass extends BaseClass {
          static getDerivedStateFromProps(nextProps, prevState) {
            return {
              ...BaseClass.getDerivedStateFromProps(nextProps, prevState),
              bar: 'bar'
            };
          }
          render() {
            return React.createElement('div', null, this.state.foo + ',' + this.state.bar);
          }
        }

        const container = document.createElement('div');
        ReactDOM.render(
          React.createElement(SubClass),
          container
        );

        expect(container.textContent).toBe('foo,bar');
      });

      it('should error for non-class components', () => {
        function FunctionalComponent() {
          return null;
        }

        expect(() => polyfill(FunctionalComponent)).toThrow(
          'Can only polyfill class components'
        );
      });

      it('should ignore component with cWM or cWRP lifecycles if they do not define static gDSFP', () => {
        class ComponentWithLifecycles extends React.Component {
          componentWillMount() {}
          componentWillReceiveProps() {}
          render() {
            return null;
          }
        }

        polyfill(ComponentWithLifecycles);
      });

      it('should error if component already has cWM or cWRP lifecycles with static gDSFP', () => {
        class ComponentWithWillMount extends React.Component {
          componentWillMount() {}
          static getDerivedStateFromProps() {}
          render() {
            return null;
          }
        }

        class ComponentWithWillReceiveProps extends React.Component {
          componentWillReceiveProps() {}
          static getDerivedStateFromProps() {}
          render() {
            return null;
          }
        }

        expect(() => polyfill(ComponentWithWillMount)).toThrow(
          'Cannot polyfill if componentWillMount already exists'
        );
        expect(() => polyfill(ComponentWithWillReceiveProps)).toThrow(
          'Cannot polyfill if componentWillReceiveProps already exists'
        );
      });
    });
  });
});
