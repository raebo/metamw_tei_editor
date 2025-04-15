const webpack = require('webpack');
const path = require('path');
const dotenv = require("dotenv");

const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

module.exports = (env, argv) => {
  const isDev = argv.mode === "development";

  const envVars = dotenv.config({ path: '.env' }).parsed || {};

  const envKeys = Object.keys(envVars).reduce((prev, key) => {
    prev[`process.env.${key}`] = JSON.stringify(envVars[key]);
    return prev;
  }, {});

  return {
    mode: 'development', // Use 'production' for production build
    entry: './src/index.tsx', // Ensure this file exists
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      clean: true, // Clean the output folder on each build
    },
    devtool: isDev ? "eval-source-map" : "source-map",
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
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html', // Ensure this file exists
        title: 'React Webpack App',
        publicUrl: '/'
      }),
      new webpack.DefinePlugin(envKeys),
      ...(isDev ? [new ReactRefreshWebpackPlugin()] : []),
      // new webpack.DefinePlugin({
      //   // Replace process.env.REACT_APP_API_URL in your code with the actual API URL:
      //   'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || "http://localhost:3000"),
      // }),
      new webpack.ProvidePlugin({
        process: 'process/browser.js',
      }),
    ],
    devServer: isDev
        ? {
          static: {
            directory: path.resolve(__dirname, "public"),
          },
          historyApiFallback: true,
          hot: true,
          port: 5000,
        }
        : undefined,
  }
};
