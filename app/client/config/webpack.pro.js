import webpack from 'webpack';
import common from './webpack.common';
import path from 'path';

module.exports = {
  entry: {
    app: [
      './app/client/entry.js'
    ]
  },
  output: {
    ...common.output,
    publicPath: '/build/'
  },
  resolve: common.resolve,
  module: {
    noParse: common.module.noParse,
    loaders: [
      ...common.module.loaders,
      {
        test: /\.(js|jsx)$/,
        loaders: ['babel'],
        include: [path.join(__dirname, '../'), path.join(__dirname, './config')],
        exclude: [path.join(__dirname, '../node_modules'), path.join(__dirname, '../vendor')]
      }
    ]
  },
  plugins: [
    ...common.plugins,
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      comments: false
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
      'process.env.BABEL_ENV': '"production"'
    })
  ]
};
