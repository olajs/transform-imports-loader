# transform-imports-loader

A webpack plugin for transform imports just like `babel-plugin-transform-imports` does, but without babel.

So, you can use it with `esbuild` or `babel`.

## usage

webpack.config.js

```javascript
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.(jsx?|tsx?)$/,
        use: [
          {
            loader: 'transform-imports-loader',
            options: {
              autoCSSModules: false,
              transformImports: {
                antd: {
                  transform: (importName) => `antd/es/${importName}`,
                  preventFullImport: true,
                },
              },
            },
          },
          {
            loader: 'esbuild-loader',
            options: {
              loader: 'tsx',
              target: 'es2015',
            },
          },
        ],
      },
    ],
  },
};
```
