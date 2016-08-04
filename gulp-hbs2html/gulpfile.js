'use strict'

/*
 * gulp插件引入介绍
 *
 * 转码：gulp-babel、babel-preset-es2015
 * 合并js代码：gulp-concat
 * 压缩js代码：gulp-uglify
 *
 * handlebars预编译
 * Less预编译：gulp-less
 * 压缩图片：gulp-imagemin
 * 
 * 清除文件： del
 * 重命名文件：gulp-rename
 * 控制task属性：run-sequence(任务相互独立，解除任务间的依赖，增强task复用)
 * 增加私有变量前缀：autoprefixer(postcss的插件)
 * 压缩优化CSS：gulp-postcss(CSS解析器)、cssnano(CSS优化)
 *
 * gulp if判断：gulp-if
 *
 * 只编译修改过的文件，加快速度：gulp-changed
 *
 * 模拟json数据：gulp-data
 *
 * 显示文件大小：gulp-size
 *
 * 捕获处理任务中的错误: gulp-plumber(自动处理全部错误信息防止因为错误而导致 watch 不正常工作)
 *
 * JavaScript编码规范检测：gulp-eslint

 *
 * 提醒通知：gulp-notify
 *
 * 压缩文件，打包，版本号：gulp-tar、gulp-gzip
 *
 * 静态文件服务器，支持浏览器自动刷新：browser-sync
 *
 * 模块化：gulp-browserify(commonjs模块orES6模块合并打包工具，打包后的js文件可以直接运行在浏览器环境中)
 *
 * 模块化管理插件：gulp-load-plugins
 *
 * 测试：gulp-jasmine、gulp-karma、gulp-mocha、gulp-qunit、gulp-nodeunit
 *
 *
*/

// 引入依赖的各种包：require是引用gulp相应的插件，在引用之前要确保已经安装
var gulp = require('gulp');
var hbs = require('gulp-compile-handlebars');

var del = require('del');                    
var runSequence = require('run-sequence');
var autoprefixer = require("autoprefixer");
var cssnano = require("cssnano");

var browserSync = require('browser-sync').create();
var reload = browserSync.reload;        


var metadata = require('./package');
var packageName = metadata.name + '-' + metadata.version;   


var path = require('path');
var dist = path.join(__dirname, 'dist');
var app = path.join(__dirname, 'app');

var gulpLoadPlugins = require('gulp-load-plugins');
var $ = gulpLoadPlugins();

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

// 将hbs文件预编译成html文件
gulp.task('hbs2html', function () {
  var options = {
    ignorePartials: true,
    batch: ['./app/views/components']
  };
  // test.hbs
  gulp.src('app/views/test.hbs')
    .pipe($.data(function(file) {
      return require('./app/data/data.json');
    }))
    .pipe(hbs('', options))
    .pipe($.rename('test.html'))
    .pipe(gulp.dest(dist))
    .pipe(browserSync.stream()) // 同步刷新
    .pipe($.size({title: 'html'})) // 显示html文件的大小
    // 提醒hbs2html任务完成
    .pipe($.notify({message: 'hbs2html task complete'}));

  // hello.hbs
  gulp.src('app/views/hello.hbs')
    .pipe($.data(function(file) {
      return require('./app/data/data.json');
    }))
    .pipe(hbs('', options))
    .pipe($.rename('hello.html'))
    .pipe(gulp.dest(dist))
    .pipe(browserSync.stream()) // 同步刷新
    .pipe($.size({title: 'html'})) // 显示html文件的大小
    // 提醒hbs2html任务完成
    .pipe($.notify({message: 'hbs2html task complete'}));
});

// 编译Less，添加浏览器前缀
gulp.task('styles', function () {
  return gulp.src(['app/less/*.less'])
    // 只输出修改过的less文件
    .pipe($.changed('styles', {
      extension: '.less'
    }))
    .pipe($.plumber({
      // 错误处理
      errorHandler: function (err) {
        console.log(err);
        this.emit('end');
      }
    }))
    // 转换less
    .pipe($.less())
    // 自动添加浏览器前缀
    .pipe($.postcss([autoprefixer({
      browsers: AUTOPREFIXER_BROWSERS
    })]))
    .pipe(gulp.dest('dist/css'))
    .pipe($.postcss([cssnano()]))
    .pipe($.rename({suffix: '.min'})) // 重命名转换成.min后缀的css文件
    .pipe(gulp.dest('dist/css'))
    .pipe($.size({title: 'styles'})) // 显示styles文件的大小
    // 提醒styles任务完成
    .pipe($.notify({message: 'styles task complete'}));
});

// JavaScript合并压缩
gulp.task('scripts', function () { 
  return gulp.src('app/js/**/*.js')
    //js代码合并成一个文件，并放入main.js中
    .pipe($.concat('main.js'))
    .pipe(gulp.dest('dist/js'))
    //给文件添加.min后缀
    .pipe($.rename({suffix: '.min'}))
    //压缩脚本文件
    .pipe($.uglify())
    //输出压缩文件到指定目录
    .pipe(gulp.dest('dist/js'))
    .pipe($.size({title: 'styles'})) // 显示scripts文件的大小
    // 提醒scripts任务完成
    .pipe($.notify({message: 'scripts task complete'}));
});

// JavaScript格式校验
gulp.task('lint', function () {
  return gulp.src('app/js/**/*.js')
    .pipe(reload({stream: true, once: true}))
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failOnError()));
});

// 图片优化
gulp.task('images', function () { 
  return gulp.src('./app/images/**/*')
    .pipe($.cache($.imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size({title: 'images'})) // 显示images文件的大小
    // 提醒images任务完成
    .pipe($.notify({message: 'Images task complete'}));

});

// 将app文件夹下相关文件移入dist文件夹，从node_modules拷贝amazeui相关文件到dist文件夹中
gulp.task('copy', function () {
  return gulp.src([
    'app/**',
    '!app/less',            // 移除app下的less文件夹
    '!app/less/**/*',
    '!app/views',          // 移除app下的views文件夹
    '!app/views/**/*',
    '!app/data',          // 移除app下的data文件夹
    '!app/data/**/*',
    'node_modules/amazeui/dist/**/*',
    'node_modules/jquery/dist/jquery.min.js'
  ], {
    dot: true
  })
  .pipe(gulp.dest(function (file) {
    if(file.path.indexOf('jquery') > -1) {
      return 'dist/js';
    }
    return 'dist';
  }))
  .pipe($.size({title: 'copy'}));
});

// 压缩打包dist文件
gulp.task('package', function (cb) {
  // 制定了task的执行顺序
  runSequence('clean', 'default', function () {
    gulp.src(path.join(dist, '**/*.*'))
      .pipe($.tar(packageName + '.tar'))
      .pipe($.gzip())
      .pipe(gulp.dest('.'))
    cb()
  });
});

// 清空文件夹，避免资源冗余
gulp.task('clean', function (cb) {
  del([dist, packageName + '.tar.gz'], cb);
});

// 清理缓存
gulp.task('clearCache', function (done) {
  return $.cache.clearAll(done);
});

// 监视源文件变化自动cd编译
gulp.task('watch', function () {
  gulp.watch('app/views/**/*.hbs', ['hbs2html']);
  gulp.watch('app/less/**/*.less', ['styles']);
  gulp.watch('app/images/**/*', ['images']);
  gulp.watch('app/js/**/*', ['scripts']);
});

// 启动预览服务，并监视dist目录变化自动刷新浏览器
gulp.task('serve', ['default'], function () {
  // 建立浏览器自动刷新服务器
  browserSync.init(null, {
    notify: false,
    logPrefix: 'ASK',
    server: {
      baseDir: dist
    }
  });

  gulp.watch(['dist/**/*'], reload);
});

// 默认任务
gulp.task('default', function (cb) {
  runSequence('clean',
    ['styles', 'scripts', 'copy', 'images', 'hbs2html'], 'watch', cb);
});

