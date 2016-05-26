var motw = angular.module('motw', ['ngRoute', 'ngSanitize']);

motw.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
	$routeProvider
		.when('/about', {
			templateUrl: '/pages/about.html',
			controller: 'staticController'
		})
		.when('/object/:bullet', {
			templateUrl: '/pages/object.html',
			controller: 'objectController'
		})
		;

		$locationProvider.html5Mode(true);
}]);

motw.directive("ngLoad", function () {
	return {
		controller: function ($scope, $element, $attrs) {
			$element.bind('load', onLoad);
			$element.bind('error', onLoad);
			
			function onLoad(event) {
				var method = $element.attr('ng-load');
				$scope.$event = event;
				$scope.$apply(method);
				event.preventDefault();
			};
		}
	};
});

motw.directive("ngTouchstart", function () {
	return {
		controller: function ($scope, $element, $attrs) {
			$element.bind('touchstart', onTouchStart);
			
			function onTouchStart(event) {
				var method = $element.attr('ng-touchstart');
				$scope.$event = event;
				$scope.$apply(method);
				event.preventDefault();
			};
		}
	};
});

motw.directive("ngTouchend", function () {
	return {
		controller: function ($scope, $element, $attrs) {
			$element.bind('touchend', onTouchEnd);
			
			function onTouchEnd(event) {
				var method = $element.attr('ng-touchend');
				$scope.$event = event;
				$scope.$apply(method);
				event.preventDefault();
			};
		}
	};
});


motw.factory('Objects', function($sce, $http) {
	var objectURL = '/api/overview-test.json';

	var getListeners = [];

	var isYouTubeID = function(s) {
		return /^[A-Za-z0-9_-]{11}$/.test(s);
	};

	return {
		objects: null,

		get: function(callback) {
			if (this.objects) {
				callback(this.objects, this.objectIndex);
			} else {
				getListeners.push(callback);
				if (getListeners.length === 1) {
					var self = this;
					$http({ method: 'GET', cache: true, url: objectURL }).success(function(objectArr) {
						if (typeof objectArr === 'string') {
							objectArr = JSON.parse(objectArr.slice(5));
						}
						self.objects = [];
						self.objectsByCategory = {};
						self.objectIndex = {};
						objectArr.forEach(function(obj) {
							obj.categoryName = (obj.categoryName + '').toLowerCase();
							var cat = self.objectsByCategory[obj.categoryName];
							if (!cat) {
								cat = self.objectsByCategory[obj.categoryName] = [];
							}
							cat.push(obj);
							if (obj.categoryName === 'null') {
								obj.categoryObjects = [];
							} else {
								obj.categoryObjects = cat;
							}
							obj.bullet = obj.bullet.replace(/[^a-z0-9]/gi, '-');
							if (!self.objectIndex[obj.bullet]) {
								self.objectIndex[obj.bullet] = obj;
								self.objects.push(obj);
								obj.mapParams = {
									center: {lat: obj.lat, lng: obj.lng},
									zoom: obj.zoomLevel
								};
							} else {
								console.log('duplicate object!', obj.bullet);
							}

							obj.youTubeIds = [];
							if (obj.youtubeVideo && isYouTubeID(obj.youtubeVideo)) {
								obj.youTubeIds.push({ mainURL: obj.youtubeVideo });
							}

						});
						for (var i in self.objectsByCategory) {
							self.objectsByCategory[i].sort(function(a,b) { return a.dateCreated - b.dateCreated; });
						}
						getListeners.forEach(function(f) { f(self.objects, self.objectIndex); });
						getListeners = [];
					});
				}
			}
		}
	};
});

motw.controller('staticController', function($scope, $location, $sce, $timeout) {
	$scope.closeObject = function() {
		$location.path("/");
		// document.title = 'Museum of the World';
	};

	$timeout(function() {
		$scope.visible = true;
	}, 10);

	$scope.openVideoOverlay = function(youTubeId) {
		if (!/^[A-Za-z0-9_-]{11}$/.test(youTubeId)) {
			throw("openVideoOverlay: Invalid YouTube video ID: " + youTubeId)
			return;
		}
		$scope.videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/'+youTubeId+"?autoplay=1");
		$scope.videoZoomed = true;
	};

	$scope.closeVideoOverlay = function() {
		$scope.videoZoomed = false;
		$scope.videoURL = null;
	};

	// document.title = 'Museum of the World - About';
});

motw.controller('objectController', function($scope, $routeParams, $location, $sce, $timeout, Objects) {

	$scope.closeObject = function() {
		$location.path("/");
	};

	$timeout(function() {
		$scope.visible = true;
	}, 10);

	$scope.currentSlideshowItem = null;
	$scope.currentSlideshowItemType = 'PHOTO';
	$scope.currentSlideshowIndex = 0;
	$scope.slideshowItems = [];

	$scope.mapZoomed = false;

	var mouseX = 0;
	var mouseY = 0;
	var mouseDownX = 0;
	var mouseDownY = 0;
	var previousMouseX = 0;
	var previousMouseY = 0;
	
	var cancelClick = false;
	
	var addZoomEventListeners = function() {
		var img = document.querySelector('.overlay-content .image-container img');
		if (img) {
			var bbox = img.getBoundingClientRect();
			var x = (mouseDownX-bbox.left);
			var y = (mouseDownY-bbox.top);

			var scale = img.naturalWidth / bbox.width;
			x = -x * scale + x;
			y = -y * scale + y;

			x = Math.min(0, Math.max(window.innerWidth - img.naturalWidth-16, x))
			y = Math.min(0, Math.max(window.innerHeight - img.naturalHeight-16-bbox.top, y))

			img.style.left = x + 'px';
			img.style.top = y + 'px';
			var down = false;
			var activeTouch = null;
			img.touchStartListener = function(ev) {
				var touches = ev.changedTouches;
				if (activeTouch === null) {
					this.onmousedown(touches[0]);
					activeTouch = touches[0].identifier;
				}
				ev.preventDefault();
			};
			img.touchEndListener = function(ev) {
				var touches = ev.changedTouches;
				for (var i=0; i<touches.length; i++) {
					if (touches[i].identifier === activeTouch) {
						this.onmouseup(touches[i]);
						activeTouch = null;
						if (!cancelClick) {
							$scope.toggleZoom();
							$scope.$digest();
						}
					}
				}
				ev.preventDefault();
			};
			img.touchMoveListener = function(ev) {
				var touches = ev.changedTouches;
				for (var i=0; i<touches.length; i++) {
					if (touches[i].identifier === activeTouch) {
						this.onmousemove(touches[i]);
					}
				}
				ev.preventDefault();
			};
			img.addEventListener('touchstart', img.touchStartListener, false);
			img.addEventListener('touchend', img.touchEndListener, false);
			img.addEventListener('touchcancel', img.touchEndListener, false);
			img.addEventListener('touchmove', img.touchMoveListener, false);
			img.onmousedown = function(ev) {
				cancelClick = false;
				down = true;
				mouseDownX = ev.clientX;
				mouseDownY = ev.clientY;
				mouseX = ev.clientX;
				mouseY = ev.clientY;
				previousMouseX = mouseX;
				previousMouseY = mouseY;
				if (ev.preventDefault) {
					ev.preventDefault();
				}
			};
			img.onmousemove = function(ev) {
				if (down) {
					mouseX = ev.clientX;
					mouseY = ev.clientY;
					var odx = mouseDownX - mouseX;
					var ody = mouseDownY - mouseY;
					if (Math.sqrt(odx*odx + ody*ody) > 5) {
						cancelClick = true;
					}
					var dx = mouseX - previousMouseX;
					var dy = mouseY - previousMouseY;
					previousMouseX = mouseX;
					previousMouseY = mouseY;
					x += dx;
					y += dy;
					x = Math.min(0, Math.max(window.innerWidth - img.naturalWidth-16, x))
					y = Math.min(0, Math.max(window.innerHeight - img.naturalHeight-16-bbox.top, y))
					img.style.left = x + 'px';
					img.style.top = y + 'px';
					if (ev.preventDefault) {
						ev.preventDefault();
					}
				}
			};
			window.addEventListener('mouseup', img.mouseup, false);
			img.onmouseup = function(ev) {
				if (ev.preventDefault) {
					ev.preventDefault();
				}
				down = false;
			};
		}
	};

	var removeZoomEventListeners = function() {
		var img = document.querySelector('.overlay-content .image-container img');
		if (img) {
			img.style.left = 'auto';
			img.style.top = 'auto';
			img.removeEventListener('touchstart', img.touchStartListener, false);
			img.removeEventListener('touchend', img.touchEndListener, false);
			img.removeEventListener('touchcancel', img.touchEndListener, false);
			img.removeEventListener('touchmove', img.touchMoveListener, false);
			window.removeEventListener('mouseup', img.mouseup, false);
			img.onmousedown =
			img.onmousemove =
			img.onmouseup = function() {};
		}
	};

	$scope.toggleZoom = function() {
		if (cancelClick) {
			cancelClick = false;
			return;
		}
		mouseDownX = window.event.clientX;
		mouseDownY = window.event.clientY;
		$scope.zoomedIn = !$scope.zoomedIn;
		if ($scope.zoomedIn) {
			addZoomEventListeners();
		} else {
			removeZoomEventListeners();
		}
	};

	$scope.loaded = function() {
		$scope.loading = false;
	};

	$scope.openSlideshowOverlay = function(url) {
		$scope.zoomedIn = false;
		removeZoomEventListeners();
		var index = -1;
		for (var i=0; i<$scope.slideshowItems.length; i++) {
			var obj = $scope.slideshowItems[i];
			if (obj.mainURL === url) {
				index = i;
				break;
			}
		}
		if (index === -1) {
			throw("URL not in $scope.slideshowItems: " + url)
			return;
		}
		$scope.currentSlideshowIndex = index;
		var itemURL = $scope.slideshowItems[$scope.currentSlideshowIndex].mainURL;
		if (/^[A-Za-z0-9_-]{11}$/.test(itemURL)) {
			$scope.loading = false;
			$scope.currentSlideshowItemType = 'VIDEO';
			$scope.currentSlideshowItem = $sce.trustAsResourceUrl('https://www.youtube.com/embed/'+itemURL+"?autoplay=1")
		} else {
			$scope.loading = true;
			$scope.currentSlideshowItemType = 'PHOTO';
			$scope.currentSlideshowItem = itemURL;
		}
	};

	$scope.closeSlideshowOverlay = function() {
		if (window.event) {
			if (
				event.target.classList.contains('image-container') || 
				event.target.classList.contains('overlay-content') || 
				event.target.id === 'object-image-zoom' || 
				event.target.classList.contains('close-button')
			) {
				$scope.currentSlideshowItemType = null;
				$scope.currentSlideshowItem = null;
			}
		} else {
			$scope.currentSlideshowItemType = null;
			$scope.currentSlideshowItem = null;
		}
	};

	$scope.nextSlideshowItem = function() {
		$scope.currentSlideshowIndex++;
		$scope.currentSlideshowIndex %= $scope.slideshowItems.length;
		$scope.openSlideshowOverlay( $scope.slideshowItems[$scope.currentSlideshowIndex].mainURL );
	};

	$scope.previousSlideshowItem = function() {
		$scope.currentSlideshowIndex--;
		if ($scope.currentSlideshowIndex < 0) {
			$scope.currentSlideshowIndex = $scope.slideshowItems.length - 1;
		}
		$scope.openSlideshowOverlay( $scope.slideshowItems[$scope.currentSlideshowIndex].mainURL );
	};

	$scope.openMapOverlay = function() {
		$scope.mapZoomed = true;
	};

	$scope.closeMapOverlay = function() {
		$scope.mapZoomed = false;
	};

	$scope.openVideoOverlay = function(youTubeId) {
		if (!/^[A-Za-z0-9_-]{11}$/.test(youTubeId)) {
			throw("openVideoOverlay: Invalid YouTube video ID: " + youTubeId)
			return;
		}
		$scope.videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/'+youTubeId+"?autoplay=1");
		$scope.videoZoomed = true;
	};

	$scope.closeVideoOverlay = function() {
		$scope.videoZoomed = false;
		$scope.videoURL = null;
	};

	$scope.highResImage = function(url) {
		return (url || '').replace(/s1024$/, 's2048');
	};

	$scope.mainImageRes = function(url) {
		return (url || '').replace(/s1024$/, 's606');
	};

	Objects.get(function(objectArr, objectIndex) {
		$scope.objects = objectIndex;
		$scope.object = objectIndex[$routeParams.bullet];

		$scope.images = [];
		var images = [];
		$scope.object.mainImageURL = $scope.object.mainImageURL;
		if ($scope.object.images) {
			images = $scope.object.images.filter(function(obj) {
				obj.mainURL = obj.mainURL;
				return obj.mainURL !== $scope.object.mainImageURL;
			});
			var lastIndex = 2;
			lastIndex -= $scope.object.youTubeIds.length;
			for (var i=0; i<images.length; i++) {
				$scope.images.push(images[i]);
				if (i === lastIndex && i < images.length-1) {
					$scope.images[i].lastThumb = true;
					$scope.images[i].lastThumbText = '+ '+(images.length-1-i);
					break;
				}
			}
		}

		$scope.slideshowItems = [{thumbnailURL: $scope.object.thumbnailURL, mainURL: $scope.object.mainImageURL}].concat($scope.object.youTubeIds).concat(images);
		if ($scope.object.mapParams) {
			var mapParams = $scope.object.mapParams;

			$scope.staticMapURL = $sce.trustAsResourceUrl(
				'https://maps.googleapis.com/maps/api/staticmap' + 
				'?key=AIzaSyD0ChaBHDpRwPmyLpp_ztitNVQoXXw02B8' +
				'&center='+parseFloat(mapParams.center.lat)+','+parseFloat(mapParams.center.lng)+
  				'&zoom='+parseInt(mapParams.zoom) + 
  				'&size=227x80&scale=' + (window.devicePixelRatio || 1)
			);
			$scope.mapURL = $sce.trustAsResourceUrl(
				'https://www.google.com/maps/embed/v1/place' + 
				'?key=AIzaSyD0ChaBHDpRwPmyLpp_ztitNVQoXXw02B8' +
				'&q='+parseFloat(mapParams.center.lat)+','+parseFloat(mapParams.center.lng)+
  				'&zoom='+parseInt(mapParams.zoom)
			);
		}
	});
});
