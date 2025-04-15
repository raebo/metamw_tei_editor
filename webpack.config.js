const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development', // Use 'production' for production build
  entry: './src/index.tsx', // Ensure this file exists
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true, // Clean the output folder on each build
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    fallback: {
      process: require.resolve('process/browser.js'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: ['file-loader'],
      },
      // {
      //   test: /\.m?js/,
      //   type: 'javascript/auto',
      // },
    ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'), // replace contentBase with static.directory
    },
    compress: true,
    port: 5000,
    hot: true, // Enables Hot Module Replacement
    historyApiFallback: true, // Useful for single-page applications routing
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // Ensure this file exists
      title: 'React Webpack App',
      publicUrl: '/'
    }),
    new webpack.DefinePlugin({
      // Replace process.env.REACT_APP_API_URL in your code with the actual API URL:
      'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || "http://localhost:3000"),
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
    }),
  ],
};
