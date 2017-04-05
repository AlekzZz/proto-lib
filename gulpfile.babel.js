import path from 'path';
import gulp from 'gulp';
import sass from 'gulp-sass';
import rename from 'gulp-rename';
import cleanCSS from 'gulp-clean-css';
import sourcemaps from 'gulp-sourcemaps';
import newer from 'gulp-newer';
import notify from 'gulp-notify';
import concatenate from 'gulp-concat';
import browserify from 'browserify';
import watchify from 'watchify';
import babelify from 'babelify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import uglify from 'gulp-uglify';
import del from 'del';
import sequence from 'run-sequence';
import { Server } from 'karma';
import BrowserSync from 'browser-sync';
const browserSync = BrowserSync.create();

// handlebars
import handlebars from 'gulp-handlebars';
import wrap from 'gulp-wrap';
import declare from 'gulp-declare';

// configuration for gulp
const source_path = './app';
const dist_path = './dist';
const config = {
  js: {
    source: source_path,
    dist: `${dist_path}/js`,
    filename: 'production.js'
  },
  css: {
    source: `${source_path}/styles`,
    dist: `${dist_path}/css`,
    filename: 'production.css'
  },
  vendors: {
    source: `${source_path}/vendors`,
    dist: `${dist_path}/js`,
    filename: 'vendors.js'
  },
  hbs: {
    source: source_path,
    dist: `${dist_path}/js`,
    filenameTemplates: 'templates.js',
    filenameHelpers: 'helpers.js'
  }
};

function handleErrors() {
  let args = Array.prototype.slice.call(arguments);
  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>'
  }).apply(this, args);
  this.emit('end'); // Keep gulp from hanging on this task
}

/**
 * CLEAN
 */
gulp.task('clean', () => {
  return del([`${dist_path}/*`], { dot: true });
});

/**
 * Copy files
 */
gulp.task('copy', () => {
  return gulp.src([
    `${source_path}/index.html`
  ], { base: source_path })
    .pipe(newer(dist_path))
    .pipe(gulp.dest(dist_path));
});

/**
 * Server through browser sync
 */
gulp.task('browser-sync', () => {
  return browserSync.init({
    server: {
      baseDir: [dist_path]
    },
    files: [
      `${config.css.dist}/*.css`,
      `${config.js.dist}/*.js`,
      `${dist_path}/index.html`
    ],
    open: false
  });
});

/**
 * SASS
 */
gulp.task('sass:dev', () => {
  return gulp.src(`${config.css.source}/app.scss`, {
    base: source_path
  })
    .on('error', handleErrors)
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(rename(config.css.filename))
    .pipe(sourcemaps.write('/' , {
      sourceRoot: config.css.source
    }))
    .pipe(gulp.dest(config.css.dist));
});
gulp.task('sass:prod', ['sass:dev'], () => {
  return gulp.src(`${config.css.dist}/${config.css.filename}`)
    .pipe(cleanCSS())
    .pipe(gulp.dest(config.css.dist));
});

/**
 * TEMPLATES
 */
gulp.task('hbs:dev', () => {
  return gulp.src(`${config.hbs.source}/**/*.hbs`)
    .pipe(handlebars({
      handlebars: require('handlebars')
    }))
    .pipe(wrap('Handlebars.template(<%= contents %>)'))
    .pipe(declare({
      namespace: 'templates',
      noRedeclare: true, // Avoid duplicate declarations
    }))
    .pipe(concatenate(config.hbs.filenameTemplates))
    .pipe(gulp.dest(config.hbs.dist));
});

gulp.task('hbs:prod', ['hbs:dev'], () => {
  return gulp.src(`${config.hbs.dist}/${config.hbs.filenameTemplates}`)
    .pipe(uglify())
    .pipe(gulp.dest(config.hbs.dist));
});

/**
 * Handlebars helpers
 */
gulp.task('helpers:dev', () => {
  return gulp.src(`${config.js.source}/helpers/**/*.js`)
    .on('error', handleErrors)
    .pipe(concatenate(config.hbs.filenameHelpers))
    .pipe(gulp.dest(config.js.dist));
});

gulp.task('helpers:prod', ['helpers:dev'], () => {
  return gulp.src(`${config.hbs.dist}/${config.hbs.filenameHelpers}`)
    .pipe(uglify())
    .pipe(gulp.dest(config.js.dist));
});

/**
 * JS Compiler/Watcher
 */
function buildJS(watch) {
  let options = {
    entries: `${config.js.source}/app.js`,
    extensions: ['.js'],
    paths: ['./node_modules', './'],
    transform: [babelify],
    debug: true,
    cache: {},
    packageCache: {},
    fullPaths: true
  };

  // initialize whatchify
  let bundler = watchify(browserify(options));

  function rebundle() {
    if (watch) {
      console.time('Rebundle');
    }

    let stream = bundler.bundle();

    stream
      .on('error', handleErrors)
      .pipe(source(config.js.filename))
      .pipe(gulp.dest(config.js.dist));

    if (watch) {
      console.timeEnd('Rebundle');
    }

    return stream;
  }

  if (watch) {
    // listen for an update and run rebundle
    bundler.on('update', rebundle);
  }

  // run it once the first time buildMecApp is called
  return rebundle();
}

gulp.task('js:dev', () => {
  return buildJS(true);
});

gulp.task('js:dev:single', () => {
  return buildJS();
});

gulp.task('js:prod', ['js:dev:single'], () => {
  return gulp.src(`${config.js.dist}/${config.js.filename}`)
    .pipe(uglify())
    .pipe(gulp.dest(config.js.dist));
});

/**
 * Copy index
 */
gulp.task('copy', () => {
  return gulp.src(source_path + '/index.html', {
    base: source_path
  })
    .pipe(newer(dist_path))
    .pipe(gulp.dest(dist_path));
});

/**
 * VENDORS JS
 */
gulp.task('vendors:dev', () => {
  return browserify({
    entries: `${config.vendors.source}/vendors.js`,
    extensions: ['.js'],
    debug: false
  })
    .transform(babelify)
    .bundle()
    .pipe(source(config.vendors.filename))
    .pipe(buffer())
    .pipe(gulp.dest(config.vendors.dist));
});

gulp.task('vendors:prod', ['vendors:dev'], () => {
  return gulp.src(`${config.vendors.dist}/${config.vendors.filename}`)
    .pipe(uglify())
    .pipe(gulp.dest(config.vendors.dist));
});

/**
 * TEST
 */
gulp.task('test', ['hbs:dev'], (done) => {
  return new Server({
    configFile: path.resolve(__dirname, './karma.config.js'),
    singleRun: false,
    captureConsole: true
  }).start();
});

gulp.task('test:ci', ['hbs:dev'], (done) => {
  new Server({
    configFile: path.resolve(__dirname, './karma.config.js'),
    singleRun: true
  }).start();
});

/**
 * Main watch task
 */
gulp.task('watch', () => {
  gulp.watch(`${config.css.source}/**/*.scss`, ['sass:dev']);
  gulp.watch(`${config.js.source}/vendors/**/*.js`, ['vendors:dev']);
  gulp.watch(`${config.hbs.source}/**/*.hbs`, ['hbs:dev']);

  gulp.watch([
    `${source_path}/index.html`,
    `${source_path}/images/*`,
    `${source_path}/fonts/*`
  ], ['copy']);
});

/**
 * DEV task
 */
gulp.task('dev', () => {
  sequence('clean', 'copy', 'copy', 'sass:dev', 'hbs:dev', 'vendors:dev', 'js:dev', 'watch', 'browser-sync');
});

/**
 * Build task
 */
gulp.task('build', () => {
  sequence('clean', 'copy', 'sass:prod', 'hbs:prod', 'vendors:prod', 'js:prod', 'test:ci');
});

// default gulp to dev
gulp.task('default', ['dev'], () => {});
