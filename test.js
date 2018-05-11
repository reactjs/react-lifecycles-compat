'use strict';

const {readdirSync} = require('fs');
const {join} = require('path');

const POLYFILLS = {
  cjs: require('./react-lifecycles-compat.cjs'),
  'umd: dev': require('./react-lifecycles-compat'),
  'umd: prod': require('./react-lifecycles-compat.min'),
};

Object.entries(POLYFILLS).forEach(([name, module]) => {
  describe(`react-lifecycles-compat (${name})`, () => {
    readdirSync(join(__dirname, 'react')).forEach(version => {
      const basePath = `./react/${version}/node_modules/`;

      let createReactClass;
      let polyfill;
      let React;
      let ReactDOM;
      let testRenderer;

      beforeAll(() => {
        createReactClass = require(basePath + 'create-react-class');
        polyfill = module.polyfill;
        React = require(basePath + 'react');
        ReactDOM = require(basePath + 'react-dom');

        let ReactTestRenderer;
        try {
          ReactTestRenderer = require(basePath + 'react-test-renderer/shallow');
        } catch(e) {
          ReactTestRenderer = require(basePath + 'react-addons-test-utils');
        }
        testRenderer = ReactTestRenderer.createRenderer();
      });

      describe(`react@${version}`, () => {
        beforeEach(() => {
          jest.spyOn(console, 'error');
          global.console.error.mockImplementation(() => {});
        });

        afterEach(() => {
          global.console.error.mockRestore();
        });

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

        it('should support shallow rendering', () => {
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

          testRenderer.render(
            React.createElement(ClassComponent, {incrementBy: 2})
          );

          let result = testRenderer.getRenderOutput();
          expect(result.props.children).toBe(3);

          testRenderer.render(
            React.createElement(ClassComponent, {incrementBy: 3})
          );

          result = testRenderer.getRenderOutput();
          expect(result.props.children).toBe(6);
        });

        it('should support create-react-class components', () => {
          let componentDidUpdateCalled = false;

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
            getSnapshotBeforeUpdate(prevProps, prevState) {
              return prevState.count * 2 + this.state.count * 3;
            },
            componentDidUpdate(prevProps, prevState, snapshot) {
              expect(prevProps).toEqual({incrementBy: 2});
              expect(prevState).toEqual({count: 3});
              expect(this.props).toEqual({incrementBy: 3});
              expect(this.state).toEqual({count: 6});
              expect(snapshot).toBe(24);
              componentDidUpdateCalled = true;
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
          expect(componentDidUpdateCalled).toBe(false);

          ReactDOM.render(
            React.createElement(CRCComponent, {incrementBy: 3}),
            container
          );

          expect(container.textContent).toBe('6');
          expect(componentDidUpdateCalled).toBe(true);
        });

        it('should support class components', () => {
          let componentDidUpdateCalled = false;

          class Component extends React.Component {
            constructor(props) {
              super(props);
              this.state = {count: 1};
              this.setRef = ref => {
                this.divRef = ref;
              };
            }
            static getDerivedStateFromProps(nextProps, prevState) {
              return {
                count: prevState.count + nextProps.incrementBy,
              };
            }
            getSnapshotBeforeUpdate(prevProps, prevState) {
              expect(prevProps).toEqual({incrementBy: 2});
              expect(prevState).toEqual({count: 3});
              return this.divRef.textContent;
            }
            componentDidUpdate(prevProps, prevState, snapshot) {
              expect(prevProps).toEqual({incrementBy: 2});
              expect(prevState).toEqual({count: 3});
              expect(this.props).toEqual({incrementBy: 3});
              expect(this.state).toEqual({count: 6});
              expect(snapshot).toBe('3');
              componentDidUpdateCalled = true;
            }
            render() {
              return React.createElement(
                'div',
                {
                  ref: this.setRef,
                },
                this.state.count
              );
            }
          }

          polyfill(Component);

          const container = document.createElement('div');
          ReactDOM.render(
            React.createElement(Component, {incrementBy: 2}),
            container
          );

          expect(container.textContent).toBe('3');
          expect(componentDidUpdateCalled).toBe(false);

          ReactDOM.render(
            React.createElement(Component, {incrementBy: 3}),
            container
          );

          expect(container.textContent).toBe('6');
          expect(componentDidUpdateCalled).toBe(true);
        });

        it('should support getDerivedStateFromProps in subclass', () => {
          class BaseClass extends React.Component {
            constructor(props) {
              super(props);
              this.state = {};
            }
            static getDerivedStateFromProps(nextProps, prevState) {
              return {
                foo: 'foo',
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
                bar: 'bar',
              };
            }
            render() {
              return React.createElement(
                'div',
                null,
                this.state.foo + ',' + this.state.bar
              );
            }
          }

          const container = document.createElement('div');
          ReactDOM.render(React.createElement(SubClass), container);

          expect(container.textContent).toBe('foo,bar');
        });

        it('should properly recover from errors thrown by getSnapshotBeforeUpdate()', () => {
          let instance;

          class ErrorBoundary extends React.Component {
            constructor(props) {
              super(props);
              this.state = {error: null};
            }
            componentDidCatch(error) {
              this.setState({error});
            }

            render() {
              return this.state.error !== null ? null : this.props.children;
            }
          }

          class Component extends React.Component {
            constructor(props) {
              super(props);
              this.state = {count: 1};
            }
            static getDerivedStateFromProps(nextProps, prevState) {
              return {
                count: prevState.count + nextProps.incrementBy,
              };
            }
            getSnapshotBeforeUpdate(prevProps) {
              throw Error('whoops');
            }
            componentDidUpdate(prevProps, prevState, snapshot) {}
            render() {
              instance = this;

              return null;
            }
          }

          polyfill(Component);

          const container = document.createElement('div');
          ReactDOM.render(
            React.createElement(
              ErrorBoundary,
              null,
              React.createElement(Component, {incrementBy: 2})
            ),
            container
          );

          try {
            ReactDOM.render(
              React.createElement(
                ErrorBoundary,
                null,
                React.createElement(Component, {incrementBy: 3})
              ),
              container
            );
          } catch (error) {}

          // Verify that props and state get reset after the error
          // Note that the polyfilled and real versions necessarily differ,
          // Because one is run during the "render" phase and the other during "commit".
          if (parseFloat(version) < '16.3') {
            expect(instance.props.incrementBy).toBe(2);
            expect(instance.state.count).toBe(3);
          } else {
            expect(instance.props.incrementBy).toBe(3);
            expect(instance.state.count).toBe(6);
          }
        });

        it('should properly handle falsy return values from getSnapshotBeforeUpdate()', () => {
          let componentDidUpdateCalls = 0;

          class Component extends React.Component {
            getSnapshotBeforeUpdate(prevProps) {
              return prevProps.value;
            }
            componentDidUpdate(prevProps, prevState, snapshot) {
              expect(snapshot).toBe(prevProps.value);
              componentDidUpdateCalls++;
            }
            render() {
              return null;
            }
          }

          polyfill(Component);

          const container = document.createElement('div');
          ReactDOM.render(
            React.createElement(Component, {value: 'initial'}),
            container
          );
          expect(componentDidUpdateCalls).toBe(0);

          ReactDOM.render(
            React.createElement(Component, {value: null}),
            container
          );
          expect(componentDidUpdateCalls).toBe(1);

          ReactDOM.render(
            React.createElement(Component, {value: false}),
            container
          );
          expect(componentDidUpdateCalls).toBe(2);

          ReactDOM.render(
            React.createElement(Component, {value: undefined}),
            container
          );
          expect(componentDidUpdateCalls).toBe(3);

          ReactDOM.render(
            React.createElement(Component, {value: 123}),
            container
          );
          expect(componentDidUpdateCalls).toBe(4);
        });

        it('should error for non-class components', () => {
          function FunctionalComponent() {
            return null;
          }

          expect(() => polyfill(FunctionalComponent)).toThrow(
            'Can only polyfill class components'
          );
        });

        it('should ignore components with old lifecycles if they do not define new ones', () => {
          class ComponentWithLifecycles extends React.Component {
            componentWillMount() {}
            componentWillReceiveProps() {}
            componentWillUpdate() {}
            render() {
              return null;
            }
          }

          polyfill(ComponentWithLifecycles);

          class ComponentWithUnsafeLifecycles extends React.Component {
            UNSAFE_componentWillMount() {}
            UNSAFE_componentWillReceiveProps() {}
            UNSAFE_componentWillUpdate() {}
            render() {
              return null;
            }
          }

          polyfill(ComponentWithUnsafeLifecycles);
        });

        it('should error if component tries to combine gDSFP with any of the old API lifecycles', () => {
          class ComponentWithWillMount extends React.Component {
            componentWillMount() {}
            static getDerivedStateFromProps() {}
            render() {
              return null;
            }
          }

          expect(() => polyfill(ComponentWithWillMount)).toThrow(
            'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
              'ComponentWithWillMount uses getDerivedStateFromProps() but also contains the following legacy lifecycles:\n' +
              '  componentWillMount'
          );

          class ComponentWithWillReceiveProps extends React.Component {
            componentWillReceiveProps() {}
            static getDerivedStateFromProps() {}
            render() {
              return null;
            }
          }

          expect(() => polyfill(ComponentWithWillReceiveProps)).toThrow(
            'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
              'ComponentWithWillReceiveProps uses getDerivedStateFromProps() but also contains the following legacy lifecycles:\n' +
              '  componentWillReceiveProps'
          );

          class ComponentWithWillUpdate extends React.Component {
            componentWillUpdate() {}
            static getDerivedStateFromProps() {}
            render() {
              return null;
            }
          }

          expect(() => polyfill(ComponentWithWillUpdate)).toThrow(
            'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
              'ComponentWithWillUpdate uses getDerivedStateFromProps() but also contains the following legacy lifecycles:\n' +
              '  componentWillUpdate'
          );

          class ComponentWithUnsafeWillMount extends React.Component {
            UNSAFE_componentWillMount() {}
            static getDerivedStateFromProps() {}
            render() {
              return null;
            }
          }

          expect(() => polyfill(ComponentWithUnsafeWillMount)).toThrow(
            'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
              'ComponentWithUnsafeWillMount uses getDerivedStateFromProps() but also contains the following legacy lifecycles:\n' +
              '  UNSAFE_componentWillMount'
          );

          class ComponentWithUnsafeWillReceiveProps extends React.Component {
            UNSAFE_componentWillReceiveProps() {}
            static getDerivedStateFromProps() {}
            render() {
              return null;
            }
          }

          expect(() => polyfill(ComponentWithUnsafeWillReceiveProps)).toThrow(
            'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
              'ComponentWithUnsafeWillReceiveProps uses getDerivedStateFromProps() but also contains the following legacy lifecycles:\n' +
              '  UNSAFE_componentWillReceiveProps'
          );

          class ComponentWithUnsafeWillUpdate extends React.Component {
            UNSAFE_componentWillUpdate() {}
            static getDerivedStateFromProps() {}
            render() {
              return null;
            }
          }

          expect(() => polyfill(ComponentWithUnsafeWillUpdate)).toThrow(
            'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
              'ComponentWithUnsafeWillUpdate uses getDerivedStateFromProps() but also contains the following legacy lifecycles:\n' +
              '  UNSAFE_componentWillUpdate'
          );
        });

        it('should error if component tries to combine gSBU with any of the old API lifecycles', () => {
          class ComponentWithWillMount extends React.Component {
            componentWillMount() {}
            getSnapshotBeforeUpdate() {}
            render() {
              return null;
            }
          }

          expect(() => polyfill(ComponentWithWillMount)).toThrow(
            'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
              'ComponentWithWillMount uses getSnapshotBeforeUpdate() but also contains the following legacy lifecycles:\n' +
              '  componentWillMount'
          );

          class ComponentWithWillReceiveProps extends React.Component {
            componentWillReceiveProps() {}
            getSnapshotBeforeUpdate() {}
            render() {
              return null;
            }
          }

          expect(() => polyfill(ComponentWithWillReceiveProps)).toThrow(
            'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
              'ComponentWithWillReceiveProps uses getSnapshotBeforeUpdate() but also contains the following legacy lifecycles:\n' +
              '  componentWillReceiveProps'
          );

          class ComponentWithWillUpdate extends React.Component {
            componentWillUpdate() {}
            getSnapshotBeforeUpdate() {}
            render() {
              return null;
            }
          }

          expect(() => polyfill(ComponentWithWillUpdate)).toThrow(
            'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
              'ComponentWithWillUpdate uses getSnapshotBeforeUpdate() but also contains the following legacy lifecycles:\n' +
              '  componentWillUpdate'
          );

          class ComponentWithUnsafeWillMount extends React.Component {
            UNSAFE_componentWillMount() {}
            getSnapshotBeforeUpdate() {}
            render() {
              return null;
            }
          }

          expect(() => polyfill(ComponentWithUnsafeWillMount)).toThrow(
            'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
              'ComponentWithUnsafeWillMount uses getSnapshotBeforeUpdate() but also contains the following legacy lifecycles:\n' +
              '  UNSAFE_componentWillMount'
          );

          class ComponentWithUnsafeWillReceiveProps extends React.Component {
            UNSAFE_componentWillReceiveProps() {}
            getSnapshotBeforeUpdate() {}
            render() {
              return null;
            }
          }

          expect(() => polyfill(ComponentWithUnsafeWillReceiveProps)).toThrow(
            'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
              'ComponentWithUnsafeWillReceiveProps uses getSnapshotBeforeUpdate() but also contains the following legacy lifecycles:\n' +
              '  UNSAFE_componentWillReceiveProps'
          );

          class ComponentWithUnsafeWillUpdate extends React.Component {
            UNSAFE_componentWillUpdate() {}
            getSnapshotBeforeUpdate() {}
            render() {
              return null;
            }
          }

          expect(() => polyfill(ComponentWithUnsafeWillUpdate)).toThrow(
            'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
              'ComponentWithUnsafeWillUpdate uses getSnapshotBeforeUpdate() but also contains the following legacy lifecycles:\n' +
              '  UNSAFE_componentWillUpdate'
          );
        });

        it('should error if component defines gSBU but does not define cDU', () => {
          class Component extends React.Component {
            getSnapshotBeforeUpdate(prevProps, prevState) {}
            render() {
              return null;
            }
          }

          expect(() => polyfill(Component)).toThrow(
            'Cannot polyfill getSnapshotBeforeUpdate() for components that do not define componentDidUpdate() on the prototype'
          );
        });

        it('should not pass stale state to a setState updater function when parent component also re-renders as part of a batched update', () => {
          class ParentComponent extends React.Component {
            constructor(props) {
              super(props);
              this.state = {};
              this.updateState = this.updateState.bind(this);
            }
            updateState() {
              this.setState({});
            }
            render() {
              return React.createElement(PolyfilledComponent, {
                parentCallback: this.updateState,
              });
            }
          }

          let instance;
          class PolyfilledComponent extends React.Component {
            constructor(props) {
              super(props);
              this.state = {flag: true};
              this.handleClick = this.handleClick.bind(this);
            }
            static getDerivedStateFromProps(nextProps, prevState) {
              return prevState;
            }
            handleClick() {
              this.setState(function(prevState) {
                return {flag: !prevState.flag};
              });
              this.props.parentCallback();
            }
            render() {
              instance = this;
              return React.createElement(
                'button',
                {id: 'button', onClick: this.handleClick},
                String(this.state.flag)
              );
            }
          }

          polyfill(PolyfilledComponent);

          const container = document.createElement('div');
          ReactDOM.render(React.createElement(ParentComponent), container);

          const button = container.firstChild;

          expect(container.textContent).toBe('true');
          ReactDOM.unstable_batchedUpdates(instance.handleClick); // Simulate click
          expect(container.textContent).toBe('false');
          ReactDOM.unstable_batchedUpdates(instance.handleClick); // Simulate click
          expect(container.textContent).toBe('true');
        });
      });
    });
  });
});
