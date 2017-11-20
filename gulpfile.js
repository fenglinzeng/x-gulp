/*
创建Gulp配置文件
 */

// gulp and util
const gulp = require('gulp');
const changed = require('gulp-changed');
const chalk = require('chalk');

// JS
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');

// image
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');


// CSS
const sass = require('gulp-sass');
const csscomb = require('gulp-csscomb');
const minifycss = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');


// 错误处理
const plumber = require('gulp-plumber');

// 设置相关路径
const paths = {
    static: 'static',
    dev: 'src',
    sass: 'src/css/sass/**/*',
    js: 'src/js/**/*.js',
    img: 'src/images/**/*'
};

// Sass 处理
gulp.task('sass', () => {
    console.log(chalk.yellow('[进行中] sass'));
    gulp.src(paths.sass)
        .on('end', () => {
            console.log(chalk.green('[已完成] sass'));
        })
        .pipe(changed(`${paths.static}/css/`))
        .pipe(plumber())
        .pipe(sass())
        .pipe(autoprefixer({
            browsers: [
                'Chrome > 50',
                'Firefox > 50',
                'Explorer >= 11',
                'iOS >= 9',
                'Android >= 4'
            ]
        }))
        .pipe(csscomb())
        .pipe(minifycss())
        .pipe(gulp.dest(`${paths.static}/css/`));
});

gulp.task('scripts', () => {
    console.log(chalk.yellow('[进行中] scripts'));
    gulp.src(paths.js)
        .on('end', () => {
            console.log(chalk.green('[已完成] scripts'));
        })
        .pipe(changed(`${paths.static}/js/`))
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(babel({
            compact: true,
            minified: true,
            comments: false
        }))
        .pipe(gulp.dest(`${paths.static}/js/`))
        .pipe(sourcemaps.write('./maps'));
});

gulp.task('image', () => {
    gulp.src(paths.img)
        .on('end', () => {
            console.log(chalk.green('[已完成] image'));
        })
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            use: [pngquant()]
        }))
        .pipe(gulp.dest(`${paths.static}/images/`));
});

/**
 * 文件变更监听
 * $ gulp watch
 */
gulp.task('watch', () => {
    console.log(chalk.green('[监听] 启动gulp watch自动编译'));
    gulp.watch(paths.js, ['scripts']);
    gulp.watch(paths.sass, ['sass']);
    gulp.watch(paths.sass, ['image']);
});

gulp.task('default', ['sass', 'scripts', 'image', 'watch']);