const path = require('path');

module.exports = {
  entry: './public/js/settleShipment.js', // Adjust the path if necessary
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public/js'), // Output directory
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
