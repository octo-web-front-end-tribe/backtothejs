'use strict';

describe('Timeline', function() {

    beforeEach(module('motw'));

    var $controller;

    beforeEach(inject(function(_$controller_) {
        $controller = _$controller_;
    }));

    describe('init', function() {
        it('can get an instance of my factory', inject(function (Timeline) {
            assert.equal(Timeline.blobTextures.length, 16);
        }));
    });

    describe('$scope.moveCameraUp', function() {
        it('move camera to default position', function() {
            var $scope = {};
            var controller = $controller('mainController', { $scope: $scope });
            controller.cameraZMotion = 0;
            $scope.moveCameraUp();
            assert.equal(controller.cameraZMotion, -1);
        });
    });
});