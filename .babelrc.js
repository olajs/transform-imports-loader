module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: 'node 12',
      },
    ],
    [
      '@babel/preset-typescript',
      {
        // https://babeljs.io/docs/en/babel-plugin-transform-typescript#impartial-namespace-support
        allowNamespaces: true,
      },
    ],
  ],
};
