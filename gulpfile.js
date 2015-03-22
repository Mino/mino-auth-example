var gulp = require('gulp');
var gutil = require('gulp-util');
var logger = require('tracer').console();

var nodemon = require('gulp-nodemon');

var onError = function (err) {  
    gutil.beep();
    console.log(err);
};

gulp.task('nodemon', function () {
    nodemon({ script: 'server.js', watch: [
        "server.js",
        "views/index.mustache",
        'node_modules/minodb/'
    ], ext: 'js' })
        .on('restart', function () {
            console.log('restarted!')
        })
})

gulp.task('default', function(){
    gulp.start('nodemon');
})