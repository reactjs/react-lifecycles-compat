'use strict';

const {readdirSync} = require('fs');
const {join} = require('path');

const POLYFILLS = {
  cjs: require('.'),
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

      beforeAll(() => {
        createReactClass = require(basePath + 'create-react-class');
        polyfill = module.polyfill;
        React = require(basePath + 'react');
        ReactDOM = require(basePath + 'react-dom');
      });

      describe(`react@${version}`, () => {
        beforeAll(() => {
          jest.spyOn(console, 'error');
          global.console.error.mockImplementation(() => {});
        });

        afterAll(() => {
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

        it('should error if component defines gDSFP but already has cWM or cWRP', () => {
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
            'Cannot polyfill getDerivedStateFromProps() for components that define componentWillMount()'
          );
          expect(() => polyfill(ComponentWithWillReceiveProps)).toThrow(
            'Cannot polyfill getDerivedStateFromProps() for components that define componentWillReceiveProps()'
          );
        });

        it('should error if component defines gSBU but already has cWU', () => {
          class ComponentWithWillUpdate extends React.Component {
            componentWillUpdate() {}
            getSnapshotBeforeUpdate() {}
            render() {
              return null;
            }
          }

          expect(() => polyfill(ComponentWithWillUpdate)).toThrow(
            'Cannot polyfill getSnapshotBeforeUpdate() for components that define componentWillUpdate()'
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
      });
    });
  });
});
