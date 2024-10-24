const path = require('path');

module.exports = {
  entry: './frontend/js/settleShipment.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'frontend/js'),
    publicPath: '/js/', // Ensure this matches where your bundle is served from
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  mode: 'development',
  devtool: 'inline-source-map', // Optional: for better debugging
  devServer: {
    static: {
      directory: path.join(__dirname, 'frontend'), // Serve files from the 'frontend' directory
    },
    compress: true,
    port: 9000,
    hot: true, // Enable Hot Module Replacement
    open: true, // Open the browser after server had been started
  },
};
