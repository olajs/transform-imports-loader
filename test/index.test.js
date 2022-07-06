const addon = require('../lib').default;

const fullImportStr = "import all from './antd';";
const fullImportStr2 = "import './antd';";
const fullImportStr3 = "import all, { a, b }'./antd';";

const normalStr = `
    import React from 'react';
    import styles from './style.less';
    import './antd';
    import antd from './antd';
    import antd, { Input, Button as AntButton } from './antd';
    import {
      Input,
      Button as AntButton
    } from './antd';
    import { Upload } from 'ola-ui';
    import { Ajax } from 'ola-toolkit';
  `;

const callThis = {
  async() {
    return function (error, content) {
      if (error) {
        throw error;
      }
      console.log(content);
    };
  },
  getOptions() {
    return {
      autoCSSModules: true,
      transformImports: {
        './antd': {
          transform: (importName, matches) => `./antd/lib/${importName}`,
          preventFullImport: true,
        },
      },
    };
  },
};

async function run() {
  try {
    await addon.call(callThis, fullImportStr);
    throw new Error('preventFullImport failed!');
  } catch (e) {}
  try {
    await addon.call(callThis, fullImportStr2);
    throw new Error('preventFullImport failed!');
  } catch (e) {}
  try {
    await addon.call(callThis, fullImportStr3);
    throw new Error('preventFullImport failed!');
  } catch (e) {}

  console.log('preventFullImport done');
  console.log('.......................................');

  callThis.getOptions = function () {
    return {
      autoCSSModules: true,
      transformImports: {
        './antd': {
          transform: './antd/lib/${member}',
          preventFullImport: false,
        },
        'ola-(ui|toolkit)': {
          transform: (importName, matches) => `ola-${matches[1]}/lib/${importName}`,
          preventFullImport: true,
        },
      },
    };
  };
  await addon.call(callThis, normalStr);
}

run();
