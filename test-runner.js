'use strict';

const chalk = require('chalk');
const {spawnSync} = require('child_process');
const {copyFileSync} = require('fs');

// TODO Test React 16.3 as well (once it exists)
const REACT_VERSIONS = ['15.6', '16.2'];

REACT_VERSIONS.forEach(version => {
  console.log(chalk.bgGreen.black(` Testing React ${version} `));

  const cwd = `./react/${version}`;

  copyFileSync('index.js', `${cwd}/index.js`);
  copyFileSync('test.js', `${cwd}/test.js`);

  const spawn = spawnSync('yarn', ['test'], {
    cwd,
    stdio: 'inherit',
  });

  if (spawn.status > 0) {
    process.exit(spawn.status);
  }
});