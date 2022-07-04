module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
  optimization: {
    minimize: false,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader'],
        oneOf: [
          {
            resourceQuery: /modules/,
            loader: 'css-loader',
            options: { modules: { localIdentName: '[local]___[contenthash:base64:5]' } },
          },
          { loader: 'css-loader' },
        ],
      },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: '@olajs/transform-imports-loader',
            options: {
              autoCSSModules: true,
              transformImports: {
                './antd': {
                  transform: (importName) => `./antd/${importName}`,
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
