import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';
import camelcase from 'camelcase'
import pkg from './package.json';

const ensureArray = maybeArr => Array.isArray(maybeArr) ? maybeArr : [maybeArr];

const createConfig = ({ output, environment, min = false }) => ({
  input: 'index.js',
  output: ensureArray(output).map(format =>
    Object.assign(
      format,
      { name: camelcase(pkg.name) },
    )),
  plugins: [
    environment && replace({
      'process.env.NODE_ENV': JSON.stringify(environment),
    }),
    min && uglify(),
  ].filter(Boolean),
});

export default [
  createConfig({
    output: [
      { file: pkg.main, format: 'cjs' },
      // Re-enable for 2.0 { file: pkg.module, format: 'es' },
    ],
  }),
  createConfig({
    output: { file: pkg.name + '.js', format: 'umd' },
    environment: 'development',
  }),
  createConfig({
    output: { file: pkg.name + '.min.js', format: 'umd' },
    environment: 'production',
    min: true,
  }),
];
