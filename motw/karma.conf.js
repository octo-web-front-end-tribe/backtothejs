module.exports = function(config){
    config.set({
        basePath : './',
        files : [
            'angular.min.js',
            'angular-route.min.js',
            'angular-sanitize.min.js',
            'node_modules/angular-mocks/angular-mocks.js',
            'js/main.js',
            'js/**/*.js',
            'test/unit/*_test.js'
        ],
        singleRun: true,
        autoWatch : true,
        frameworks: ['mocha', 'chai'],
        browsers : ['PhantomJS'],
        plugins : [
            'karma-phantomjs-launcher',
            'karma-mocha',
            'karma-chai',
            'karma-junit-reporter'
        ],
        junitReporter : {
            outputFile: 'test_out/unit.xml',
            suite: 'unit'
        }
    });
};
