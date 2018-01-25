'use strict';

const {readdirSync} = require('fs');
const {join} = require('path');
const {spawnSync} = require('child_process');

readdirSync(join(__dirname, 'react')).forEach(version => {
  const cwd = join(__dirname, 'react', version);

  console.log(`Installing React version ${version} ...`);

  const spawn = spawnSync('yarn', ['install'], {
    cwd,
    stdio: 'inherit',
  });

  if (spawn.status > 0) {
    process.exit(spawn.status);
  }
});