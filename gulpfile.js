var gulp = require('gulp');
var rename = require('gulp-rename');

// Build
var browserify = require('gulp-browserify');
var uglify = require('gulp-uglify');

// Stylesheets
var less = require('gulp-less');
var prefix = require('gulp-autoprefixer');
var minifyCSS = require('gulp-minify-css');

// Utilities
var notify = require('gulp-notify');
var watch = require('gulp-watch');

// Javascript
var jshint = require('gulp-jshint');

// Testing
// var mochaPhantomjs = require('gulp-mocha-phantomjs');

// Images
var imagemin = require('gulp-imagemin');

// Input dirs
var jsInputDir = 'assets/js/**/*.js';
var jsInputFile = 'assets/js/index.js';
var lessInputDir = 'assets/less/**/*.less';
var lessInputFile = 'assets/less/style.less';
var fontAwesomeDir = "node_modules/font-awesome/";
// var testJSInputDir = 'assets/test/**/*.js';
// var testJSInputFile = 'assets/test/index.js';
// var templateInputDir = "assets/js/templates/**/*.html";
var imageInputDir = "assets/images/*.{jpg,jpeg,png,gif}";

// Output dirs
var minifiedDir = "public/";
var developmentDir = "public/development/";
var testDir = "test/";
var jsOutputDir = "js/";
var cssOutputDir = "css/";
var imageOutputDir = "images/";

//Stragglers
var jsOtherFiles = ['node_modules/moment/moment.js'];

var projectName = "bokrapport";

// Javascript Tasks

gulp.task('lint', function() {
	return gulp.src(jsInputDir)
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});

gulp.task('js', ['lint'], function() {
	return gulp.src(jsInputDir)
		.pipe(browserify({ insertGlobals: true }))
		// .pipe(rename(projectName + ".js"))
		.pipe(gulp.dest(developmentDir + jsOutputDir))
		.pipe(notify({ message: 'Built JavaScript'}));
});

gulp.task('other-js', function() {
	return gulp.src(jsOtherFiles)
		.pipe(uglify({ mangle: false }))
		.pipe(gulp.dest(minifiedDir + jsOutputDir))
		.pipe(notify({ message: 'Minified other Javascript '}));
});

gulp.task('deploy-js', ['js'], function() {
	return gulp.src(developmentDir + jsOutputDir + projectName + ".js")
		.pipe(uglify({ mangle: false }))
		.pipe(rename(projectName + ".min.js"))
		.pipe(gulp.dest(minifiedDir + jsOutputDir))
		.pipe(notify({ message: 'Minified Javascript'}));
});

// CSS tasks

gulp.task('css', function() {
	return gulp.src([lessInputFile])
		.pipe(less())
		.pipe(prefix({ cascade: true }))
		.pipe(minifyCSS())
		.pipe(rename(projectName + ".css"))
		.pipe(gulp.dest(developmentDir + cssOutputDir))
		.pipe(notify({ message: 'Built CSS'}));
});

gulp.task('deploy-css', ['css'], function() {
	return gulp.src(developmentDir + cssOutputDir + projectName + ".css")
		.pipe(minifyCSS())
		.pipe(rename(projectName + ".min.css"))
		.pipe(gulp.dest(minifiedDir + cssOutputDir))
		.pipe(notify({ message: 'Minified CSS'}));
});

gulp.task('font-awesome', function() {
	return gulp.src(fontAwesomeDir + "fonts/**.*")
		.pipe(gulp.dest(developmentDir + "fonts"))
		.pipe(gulp.dest(minifiedDir + "fonts"))
		.pipe(notify({ message: 'Deployed Font Awesome fonts'}));
});

// Test tasks

// gulp.task('test-js', function() {
// 	return gulp.src([testJSInputFile])
// 		// .pipe(browserify({ insertGlobals: true }))
// 		.pipe(rename("test.js"))
// 		.pipe(gulp.dest(testDir))
// 		.pipe(notify({ message: 'Built Test'}));
// });

// gulp.task('test-dev', ['lint'], function() {
// 	return gulp.src('test/client/index.html')
// 		.pipe(mochaPhantomjs());
// });

gulp.task('image', function() {
	return gulp.src([imageInputDir])
		.pipe(imagemin())
		.pipe(gulp.dest(minifiedDir + imageOutputDir));
});

// gulp.task("deploy-remote", function() {
// 	// SSH
// 	var fs = require("fs");
// 	var Gulpssh = require('gulp-ssh')
// 	var gulpssh = new Gulpssh({ 
// 		ignoreErrors: false,
// 		sshConfig: {
// 			host: "cms.nichestreem.com",
// 			username: "ubuntu",
// 			port: 22,
// 			privateKey: fs.readFileSync("/Users/jason/.ssh/id_rsa")
// 		}
// 	});
// 	return gulpssh
// 		.shell([
// 			"cd /home/ubuntu/web-client-socket", "git pull", "sudo supervisorctl restart liedjie_ws", // Socket server update
// 			"cd /home/ubuntu/web-client-app", "git pull", "npm install", "gulp deploy",
// 			"cd /home/ubuntu/web-client-auth", "git pull", "npm update", "sudo supervisorctl restart liedjie_auth"
// 		])
// 		.pipe(gulp.dest('logs'))
// 		.pipe(notify());
// })

// Utility tasks

gulp.task('deploy', ['deploy-css', 'deploy-js', 'font-awesome', 'other-js']);

gulp.task('watch', function() {
	gulp.watch(jsInputDir, ['js']);
	gulp.watch(lessInputDir, ['css']);
	gulp.watch(fontAwesomeDir, ['font-awesome']);
	gulp.watch(imageInputDir, ['image']);
	// gulp.watch(testJSInputDir, ['test-js']);
	// gulp.watch(templateInputDir, ['js']);
});

gulp.task('default', ['js', 'css']);