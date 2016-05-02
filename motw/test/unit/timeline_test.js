'use strict';

describe('Timeline', function() {

    beforeEach(module('motw'));

    var $controller;

    beforeEach(inject(function(_$controller_) {
        $controller = _$controller_;
    }));

    describe('init', function() {
        it('initialize 16 blob textures', inject(function (Timeline) {
            assert.equal(Timeline.blobTextures.length, 16);
        }));
        
        it('should init toolbar with 3 buttons and specifics colors for each', inject(function (Timeline) {
            //setup
            var titles = ['Title1', 'Title2', 'Title3'];
            var colors = ['rgb(100%, 0%, 0%)', 'rgb(0%, 100%, 0%)', 'rgb(0%, 0%, 100%)'];
            //action
            Timeline.initToolbar(titles, colors, angular.noop);
            //assert
            assert.equal(Timeline.toolBar3D.buttons.length, 3);
            assert.equal(Timeline.toolBar3D.buttons[0].geographyName, 'Title1');
            assert.deepEqual(Timeline.toolBar3D.buttons[0].material.color, new THREE.Color(1,0,0));
            assert.equal(Timeline.toolBar3D.buttons[1].geographyName, 'Title2');
            assert.deepEqual(Timeline.toolBar3D.buttons[1].material.color, new THREE.Color(0,1,0));
            assert.equal(Timeline.toolBar3D.buttons[2].geographyName, 'Title3');
            assert.deepEqual(Timeline.toolBar3D.buttons[2].material.color, new THREE.Color(0,0,1));
            assert.isFalse(Timeline.toolBar3D.visible);
            assert.isFalse(Timeline.labels.visible);
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