const path = require('path');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'index.js',
    library: 'texmp',
    path: path.resolve(__dirname, 'dist/browser'),
  },
  devServer: {
    static: path.join(__dirname, "dist/browser"),
    compress: false,
    port: 4000,
  },
  devtool: "source-map",
};
