const webpack = require('webpack');
const path = require('path');
const dotenv = require('dotenv');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// Only these explicitly allowlisted variables are ever exposed to the client bundle via
// DefinePlugin - anything else in .env (secrets, tokens, ...) never reaches the browser,
// however it's named. NODE_ENV is deliberately excluded: webpack already defines it
// consistently from `mode`, and re-defining it from .env caused a "Conflicting values for
// 'process.env.NODE_ENV'" build warning and could silently ship a dev-mode React build in
// production.
const PUBLIC_ENV_ALLOWLIST = ['REACT_APP_API_URL', 'REACT_DEBUG_MODE'];
const REQUIRED_PUBLIC_ENV_VARS = ['REACT_APP_API_URL'];

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';
  const isProd = argv.mode === 'production';
  const shouldAnalyzeBundle = env.analyze === true || env.analyze === 'true';

  // Populates process.env as a side effect; real environment variables (e.g. set by CI/the
  // deployment target) always take precedence over values from the .env file.
  dotenv.config({ path: '.env' });

  const missingRequiredVars = REQUIRED_PUBLIC_ENV_VARS.filter((key) => !process.env[key]);
  if (missingRequiredVars.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missingRequiredVars.join(', ')}. Set them in .env (see .env.example).`,
    );
  }

  const envKeys = PUBLIC_ENV_ALLOWLIST.reduce((prev, key) => {
    if (process.env[key] !== undefined) {
      prev[`process.env.${key}`] = JSON.stringify(process.env[key]);
    }
    return prev;
  }, {});

  return {
    mode: isProd ? 'production' : 'development',
    entry: './src/index.tsx', // Ensure this file exists
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProd ? 'assets/js/[name].[contenthash].js' : 'assets/js/[name].js',
      assetModuleFilename: 'assets/[name].[contenthash][ext]',
      publicPath: '/',
      clean: true,
    },
    devtool: isDev ? 'eval-source-map' : false,
    optimization: {
      minimize: isProd,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      fallback: {
        process: require.resolve('process/browser.js'),
      },
      alias: {
        lodash: 'lodash-es',
        '@src': path.resolve(__dirname, 'src'),
        '@test': path.resolve(__dirname, 'test'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [['@babel/preset-react', { runtime: 'automatic' }], '@babel/preset-typescript'],
            },
          },
          exclude: /node_modules/,
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
          },
        },
        {
          test: /\.css$/,
          use: [isProd ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new CopyPlugin({
        patterns: [{ from: path.resolve(__dirname, 'public/favicon.ico'), to: 'favicon.ico' }],
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
      ...(isProd ? [new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' })] : []),
      // Only runs with an explicit --env analyze=true flag, and never auto-opens a browser tab,
      // so a normal `yarn build` (e.g. in CI) isn't slowed down or blocked by it.
      ...(shouldAnalyzeBundle
        ? [
            new BundleAnalyzerPlugin({
              analyzerMode: 'static', // generate a static HTML report
              reportFilename: 'bundle-report.html', // optional, name of the HTML file
              openAnalyzer: false,
              generateStatsFile: false, // optional, whether to create stats.json
            }),
          ]
        : []),
      new webpack.DefinePlugin(envKeys),
      new webpack.ProvidePlugin({
        process: 'process/browser.js',
      }),
    ].filter(Boolean),
    devServer: isDev
      ? {
          static: {
            directory: path.resolve(__dirname, 'dist'),
          },
          historyApiFallback: true,
          host: 'editor.metamw.local',
          hot: true,
          port: 5000,
          open: true,
          allowedHosts: ['editor.metamw.local'],
          server: {
            type: 'https',
            options: {
              key:  path.resolve(__dirname, 'certs/editor.metamw.local-key.pem'),
              cert: path.resolve(__dirname, 'certs/editor.metamw.local.pem'),
            },
          }
        }
      : undefined,
  };
};
