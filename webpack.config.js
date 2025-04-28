const webpack = require('webpack');
const path = require('path');
const dotenv = require("dotenv");

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
  const isDev = argv.mode === "development";
  const isProd = env.mode === 'production';
  const envVars = dotenv.config({ path: '.env' }).parsed || {};

  const envKeys = Object.keys(envVars).reduce((prev, key) => {
    prev[`process.env.${key}`] = JSON.stringify(envVars[key]);
    return prev;
  }, {});

  return {
    mode: isProd ? 'production' : 'development',
    entry: './src/index.tsx', // Ensure this file exists
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProd ? 'assets/js/[name].[contenthash].js' : 'assets/js/[name].js',
      assetModuleFilename: 'assets/[name].[contenthash][ext]',
      publicPath: "/",
      clean: true,
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
          test: /\.(ts|tsx)$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript'
              ]
            }
          },
          exclude: /node_modules/
        },
        {
          test: /\.(woff(2)?|ttf|eot|otf)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/webfonts/[name][contenthash][ext]',
          },
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name].[contenthash][ext]',
          }
        },
        {
          test: /\.css$/,
          use: [
            isProd ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            ]
        },
        {
          test: /\.(png|jpg|gif|svg)$/,
          use: ['file-loader'],
        },
      ],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: path.resolve(__dirname, "public/favicon.ico"), to: "favicon.ico" },
        ],
      }),
      new HtmlWebpackPlugin({
        template: './public/index.html',
        minify: isProd
          ? {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
          }
          : false,
      }),
      ...(isProd
        ? [new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' })]
        : []),
      new webpack.DefinePlugin(envKeys),
      new webpack.ProvidePlugin({
        process: 'process/browser.js',
      }),
    ].filter(Boolean),
    devServer: isDev
        ? {
          static: {
            directory: path.resolve(__dirname, "dist"),
          },
          historyApiFallback: true,
          hot: true,
          port: 5000,
          open: true,
        }
        : undefined,
  }
};
