exports.config = {
    framework: 'jasmine',
    seleniumAddress: 'http://localhost:4444/wd/hub',
    specs: ['*_spec.js'],
    capabilities: {
        'browserName': 'chrome'
    }
};
