/* eslint-env node */
/* eslint-disable func-style */

'use strict';

const gulp = require('gulp');
const $ = require('gulp-load-plugins')();

const del = require('del');
const rollup = require('rollup').rollup;

const composer = require('gulp-uglify/composer');
const uglify = composer(require('terser'), console);

const escapeStringRegexp = require('escape-string-regexp');
const operators = require('glsl-tokenizer/lib/operators');

const SPACES_AROUND_OPERATORS_REGEX = new RegExp(
  `\\s*(${operators.map(escapeStringRegexp).join('|')})\\s*`,
  'g',
);

gulp.task('clean', () => del(['build', 'dist']));

// https://github.com/mrdoob/three.js/blob/dev/rollup.config.js
function glsl() {
  function minify(code) {
    return (
      code
        // Remove //
        .replace(/\s*\/\/.*\n/g, '')
        // Remove /* */
        .replace(/\s*\/\*[\s\S]*?\*\//g, '')
        // # \n+ to \n
        .replace(/\n{2,}/g, '\n')
        // Remove tabs and consecutive spaces with a single space
        .replace(/\s{2,}|\t/g, ' ')
        .split('\n')
        .map((line, index, array) => {
          line = line.trim();

          // Remove spaces around operators if not an #extension directive.
          // For example, #extension GL_OES_standard_derivatives : enable.
          if (!line.startsWith('#extension')) {
            line = line.replace(SPACES_AROUND_OPERATORS_REGEX, '$1');
          }

          // Append newlines after preprocessor directives.
          if (line[0] === '#') {
            line += '\n';

            // Append newlines before the start of preprocessor directive blocks.
            if (index > 0) {
              if (array[index - 1][0] !== '#') {
                line = '\n' + line;
              }
            }
          }

          return line;
        })
        .join('')
    );
  }

  return {
    transform(code, id) {
      if (!id.endsWith('.glsl.js')) {
        return;
      }

      const startIndex = code.indexOf('`');
      const prefix = code.slice(0, startIndex);
      const endIndex = code.lastIndexOf('`');
      const glslString = code.slice(startIndex + 1, endIndex - 1).trim();

      return {
        code: `${prefix}\`${minify(glslString)}\``,
        map: { mappings: '' },
      };
    },
  };
}

gulp.task('rollup', () => {
  return (
    rollup({
      input: 'src/index.js',
      plugins: [glsl()],
    })
      .then(bundle =>
        bundle.write({
          file: 'build/bundle.js',
          format: 'iife',
        }),
      )
      // eslint-disable-next-line no-console
      .catch(error => console.error(error))
  );
});

gulp.task('uglify', () => {
  return gulp
    .src('build/bundle.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

gulp.task('js', gulp.series('rollup', 'uglify'));

gulp.task('html', () => {
  return gulp
    .src('./index.html')
    .pipe(
      $.htmlmin({
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true,
        minifyCSS: true,
      }),
    )
    .pipe($.replace('./src/index.js', './bundle.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('build', gulp.series('clean', gulp.parallel('html', 'js')));

gulp.task('compress', () => {
  return gulp
    .src('dist/**/*')
    .pipe($.zip('build.zip'))
    .pipe($.size())
    .pipe($.size({ pretty: false }))
    .pipe(gulp.dest('build'));
});

gulp.task('dist', gulp.series('build', 'compress'));
