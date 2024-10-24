const path = require('path');

module.exports = {
  entry: './frontend/js/settleShipment.js', // Path to your settleShipment.js file relative to webpack.config.js
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'frontend/js'), // Output directory: frontend/js
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
  mode: 'development', // Change to 'production' for minified output
};
