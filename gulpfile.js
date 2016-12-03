var gulp = require('gulp'),
	$ = require('gulp-load-plugins')(),
	concat = require('gulp-concat'),
	del = require('del'),
	express = require('express'),
	rename = require('gulp-rename'),
    sass = require('gulp-sass'),
	browserSync = require('browser-sync'),
	shell = require('gulp-shell'),
    fs = require('fs'),
    path = require('path'),
    merge = require('merge-stream'),
    nunjucksEngine = require('express-nunjucks'),
    nunjucks = require('gulp-nunjucks-render'),
    runSequence = require('run-sequence'),
	reload = browserSync.reload,
    ghPages = require('gulp-gh-pages');

function notifyError(message){
  browserSync.notify(message, 5000);
  console.warn(message.replace(/<br\/>/g, "\n"));
}

var watchPaths = {
    css: [
        'src/base/**/*.scss',
        'src/components/**/*.scss'
    ],
    html: [
        'src/**/*.html',
        'src/components/**/*.html'
    ],
    js: [
        'src/scripts/**/*.js',
        'src/components/**/*.js',
        'src/components/*.js'
    ]
};
var buildPaths;

function getPaths(baseDirs){
    function getDirectories(srcpath){
        return fs.readdirSync(srcpath).filter(function(file) {
            return fs.statSync(path.join(srcpath, file)).isDirectory();
        });
    }

    var pathObject = {
        nunjucks: [],
        scss: [],
        js: []
    }
   
    for (var i in baseDirs){
        pathObject.nunjucks.push(baseDirs[i]);
        pathObject.scss.push(baseDirs[i]);
        pathObject.js.push(baseDirs[i]);
        var subDirs = getDirectories(baseDirs[i]);
        for (var k in subDirs){
            pathObject.nunjucks.push(path.normalize(baseDirs[i] + '/' + subDirs[k]));
            pathObject.scss.push(path.normalize(baseDirs[i] + '/' + subDirs[k]));
            pathObject.js.push(path.normalize(baseDirs[i] + '/' + subDirs[k] + '/*.js'));
        }
    }

    return pathObject;
}

gulp.task('rebuild-paths', function() {
    var baseDirs = [
        'src/components',
        'src/base',
        'src/scripts'
    ]

    buildPaths = getPaths(baseDirs);
});

gulp.task('serve', ['build'], function(){
	browserSync({
		notify: false,
		port: 9000,
        server: {
            baseDir: './dist'
        },
        reloadDelay: 100,
        browser: 'google chrome'
	});

    gulp.watch(watchPaths.html).on('change', function(){
        runSequence('html', reload);
    });
	
    gulp.watch(watchPaths.css).on('change', function(){
        del('dist/styles');
        runSequence('styles', reload);
    });
	
    gulp.watch(watchPaths.js).on('change', function(){
        runSequence('clean-js', 'js', reload);
    });
});


gulp.task('clean', function() {
  del.sync(['.tmp/', 'dist/']);
});

gulp.task('clean-js', function() {
    del.sync('dist/js');
});


gulp.task('deploy', function() {
  return gulp.src('./dist/**/*')
    .pipe(ghPages());
});


gulp.task('styles', ['rebuild-paths'], function(){
    return gulp.src([
        'src/base/*.scss',
        './node_modules/font-awesome/css/font-awesome.min.css',
        './node_modules/normalize-css/normalize.css',
        './node_modules/select2/dist/css/select2.min.css',
        './node_modules/bootstrap/dist/css/bootstrap.min.css',
        './node_modules/bootstrap-datepicker/dist/css/bootstrap-datepicker.min.css'
        ])
        .pipe(sass().on('error', sass.logError))
        .pipe(sass({
            includePaths: buildPaths.scss,
            errLogToConsole: true,
            outputStyle: 'compact'
        }))
        .pipe(gulp.dest('dist/styles'));
});


gulp.task('copy-resources', ['rebuild-paths'], function() {
    var js = gulp.src([
        'src/scripts/lang.js',
        'src/scripts/jsrsasign-latest-all-min.js',
        'src/scripts/select2.min.js',
    	// './node_modules/select2/dist/js/select2.min.js',
    	'./node_modules/bootstrap/dist/js/bootstrap.min.js',
    	'./node_modules/tether/dist/js/tether.min.js',
    	'./node_modules/d3/d3.min.js',
    	'./node_modules/jquery/dist/jquery.min.js',
        './node_modules/urijs/src/URI.min.js',
        './node_modules/bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js',
        './node_modules/file-saver/FileSaver.min.js'
    	])
        .pipe(gulp.dest('dist/vendors'));
        
    var data = gulp.src([
        'src/data/rw-key.json',
        ])
        .pipe(gulp.dest('dist/data'));

    var assets = gulp.src('src/assets/**/*')
        .pipe(gulp.dest('dist'));

    var config = gulp.src([
        'src/CNAME',
        'config.json',
        'params.json',
        'README.md'])
        .pipe(gulp.dest('dist'));

    var maps = gulp.src([
        './node_modules/bootstrap-datepicker/dist/css/bootstrap-datepicker.min.css.map',
        './node_modules/bootstrap/dist/css/bootstrap.min.css.map'])
        .pipe(gulp.dest('dist/styles'));

    return merge(js, data, assets, config, maps);
});

gulp.task('js', ['rebuild-paths'], function() {
    return gulp.src([
        'src/components/**/*.js',
        'src/scripts/*.js'
        ])
        .pipe(concat('app.js'))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('html', ['rebuild-paths'], function(){
    return gulp.src('src/*.html')
        .pipe(nunjucks({
            path: buildPaths.nunjucks,
            ext: '.html',
            envOptions: { watch: false}
        }).on('error', function(e){
            console.log(e);
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('build', function(){
    runSequence('clean', 'html', 'styles', 'js', 'copy-resources')
});
