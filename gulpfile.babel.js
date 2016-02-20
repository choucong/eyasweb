import gulp from 'gulp';
import util from 'gulp-util';
import {exec} from 'child_process';
import del from 'del';
import nodemon from 'nodemon';
import webpack from 'webpack';
import notifier from 'node-notifier';
import path from 'path';
import run from 'run-sequence';
import WebpackDevServer from 'webpack-dev-server';
import webpackDevConfig from './app/client/config/webpack.dev.js';
import webpackProConfig from './app/client/config/webpack.pro.js';
import config from './app/client/config/config';
import fs from 'fs';
import cheerio from 'cheerio';

const $ = require('gulp-load-plugins')();

// server auto reload
gulp.task('server', () => {
  const backendServer = nodemon({
    script: './app/server/app.js',
    ignore: [
      "./**/*"
    ]
  });

  gulp.watch(['./app/server/**/*.js', '!./app/server/node_modules/**/*'], () => {
    backendServer.restart();
  });

  // 不能同时执行两个 nodemon 任务，只能如此取巧
  exec('gulp mock', {}, (err, out) => {
    console.log(out);
  });
});


// client server
gulp.task('client', ()=>{
  const compiler = webpack(webpackDevConfig);
  compiler.plugin('done', (stats) => {
    run('lint');
  });

  new WebpackDevServer( compiler, {
    contentBase: './',
    publicPath: webpackDevConfig.output.publicPath,
    hot: true,
    quiet: false,
    historyApiFallback: true,
    noInfo: false,
    inline: true,
    stats: {
      colors: true,
      chunks: false
    }
  }).listen(config.port, config.host, (err, stats)=>{
    if (err) util.log(err);
    util.log(`webpack was listenning: http://${config.host}:${config.port}`);
  });
});

// build on save
gulp.task('clean', () => {
  del('build');
});

// build
gulp.task('build', ['clean'], ()=>{
  const compiler = webpack(webpackProConfig, (err, stats) => {
    if(err){
      console.error(err);
    }else{
      console.log('build success!!!');
      setHash(stats.hash);
    }
  });
});


// console.log(notifier);
gulp.task('lint', () => {
  return gulp.src(['./*.js', 'app/client/**/*.js', 'app/client/**/*.jsx', '!app/client/vendor/**/*', '!app/**/node_modules/**/*'])
    .pipe($.eslint({
      globals: {
        'React': true,
        '$': true,
        'jQuery': true,
        'ReactDOM': true,
        'cx': true,
        'config': true
      }
    }))
    .pipe($.plumber({
      errorHandler(err) {
        const { fileName, lineNumber, message } = err;
        const relativeFilename = path.relative(process.cwd(), fileName);
        notifier.notify({
          title: 'ESLint Error',
          wait: true,
          message: `Line ${lineNumber}: ${message} (${relativeFilename})`
        });
      }
    }))
    .pipe($.eslint.failOnError())
    .pipe($.eslint.formatEach());
});