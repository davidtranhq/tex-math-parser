const path = require('path');

const generalConfig = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.es6.json',
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  externals: [
    "mathjs"
  ],
  devServer: {
    static: path.join(__dirname, "dist/browser"),
    compress: false,
    port: 4000,
  },
  devtool: "source-map",
};

const browserConfig = {
  ...generalConfig,
  output: {
    filename: 'index.js',
    library: 'texmp',
    path: path.resolve(__dirname, 'dist/browser'),
  },
}

const moduleConfig = {
  ...generalConfig,
  output: {
    filename: 'index.js',
    libraryTarget: 'module',
    path: path.resolve(__dirname, 'dist/module'),
  },
  experiments: {
    outputModule: true,
  },
}

module.exports = [browserConfig, moduleConfig];
