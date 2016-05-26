angular.module('motw').factory('Timeline', function() {

    var blobTextures = [];
    for (var i = 0; i < 16; i++) {
        var tex = new THREE.ImageUtils.loadTexture('/img/blob_' + i + '.png', undefined, function () {
            self.loadingPercentageMax += 2;
        }, function () {
            self.loadingPercentageMax += 2;
        });
        tex.premultiplyAlpha = true;
        blobTextures.push(tex);
    }

    var landscapeShaderMaterial = new THREE.ShaderMaterial({
        vertexShader: [
            'uniform float scale;',
            'uniform float time;',
            // 'varying float fog;',
            'varying vec3 vColor;',
            'void main() {',
            '	vColor = color;',
            '	vec4 p = modelViewMatrix * vec4(position, 1.0);',
            '	p.xyz += (0.1+0.00001*p.z*p.z)*vec3( sin(time+position.x+position.z), cos(time+position.y+position.z), sin(time+position.x+position.y+position.z) );',
            // '	fog = clamp(1.0 - pow(min(1.0, max(0.0, -(p.z+100.0) / 300.0)), 2.0), 0.0, 1.0);',
            '	gl_Position = projectionMatrix * p;',
            '	gl_PointSize = scale * 350.0 / length( p.xyz );',
            '}'
        ].join("\n"),
        fragmentShader: [
            'uniform sampler2D map;',
            // 'varying float fog;',
            'varying vec3 vColor;',
            'void main() {',
            '  gl_FragColor = vec4(vColor.xyz, 0.25 * pow(texture2D( map, vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y )).a, 2.0));',
            '}'
        ].join("\n"),
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        uniforms: {
            time: {type: 'f', value: 0},
            scale: {type: 'f', value: 1},
            map: {type: 't', value: null}
        },
        transparent: false,
        depthWrite: false
    });
    var canvasShaderMaterial = new THREE.ShaderMaterial({
        vertexShader: [
            'varying vec2 vUv;',
            'varying float fog;',
            'void main() {',
            '  vUv = uv;',
            '  vec4 p = modelViewMatrix * vec4(position, 1.0);',
            '  fog = pow(min(1.0, max(0.0, -(p.z+100.0) / 300.0)), 2.0);',
            '  gl_Position = projectionMatrix * p;',
            '}'
        ].join("\n"),
        fragmentShader: [
            'uniform sampler2D map;',
            'uniform vec3 color;',
            'varying vec2 vUv;',
            'varying float fog;',
            'void main() {',
            '  gl_FragColor = vec4(mix(color, vec3(0.4, 0.408, 0.365), fog), pow(texture2D(map, vUv).a, 2.0));',
            '}'
        ].join("\n"),
        uniforms: {
            map: {type: 't', value: null},
            color: {type: 'v3', value: null}
        },
        transparent: true,
        depthWrite: false
    });
    var lineShaderMaterial = new THREE.ShaderMaterial({
        vertexShader: [
            'varying float fog;',
            'void main() {',
            '  vec4 p = modelViewMatrix * vec4(position, 1.0);',
            '  fog = pow(min(1.0, max(0.0, -(p.z+100.0) / 300.0)), 2.0);',
            '  gl_Position = projectionMatrix * p;',
            '}'
        ].join("\n"),
        fragmentShader: [
            'uniform vec3 color;',
            'varying float fog;',
            'void main() {',
            '  gl_FragColor = vec4(mix(color, vec3(0.4, 0.408, 0.365), fog), 1.0);',
            '}'
        ].join("\n"),
        uniforms: {
            color: {type: 'v3', value: null}
        },
        transparent: false,
        depthWrite: true
    });

    return {
        toolBar3D: null,
        labels: null,
        blobTextures: blobTextures,
        landscapeShaderMaterial: landscapeShaderMaterial,
        canvasShaderMaterial: canvasShaderMaterial,
        lineShaderMaterial: lineShaderMaterial,

        initToolbar: function(titles, colors, toolbarTick) {
            this.toolBar3D = new THREE.Object3D();
            this.toolBar3D.buttons = [];

            this.labels = new THREE.Object3D();
            this.labels.position.copy(this.toolBar3D.position);

            var textGeo = new THREE.PlaneBufferGeometry(256 / 45, 32 / 45);

            for (var i = 0; i < titles.length; i++) {
                var obj = new THREE.Object3D();
                var bg = new THREE.Mesh(
                    new THREE.PlaneBufferGeometry((6 / 5) * 6, 1),
                    new THREE.MeshBasicMaterial({color: colors[i]})
                );
                obj.position.set((6 / 5) * 6 * (i - (titles.length - 1) / 2), -10.5, 0);
                bg.geographyName = titles[i];
                bg.tick = toolbarTick;
                obj.add(bg);

                obj.tick = function () {
                    this.children[0].tick();
                };

                this.toolBar3D.buttons.push(bg);

                var textCanvas = document.createElement('canvas');
                textCanvas.width = 256;
                textCanvas.height = 32;

                var tex = new THREE.Texture(textCanvas);
                tex.minFilter = THREE.LinearFilter;

                setTimeout((function (textCanvas, tex, title) {
                    return function () {
                        var ctx = textCanvas.getContext('2d');
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

                        ctx.font = 'lighter 30px Lato, sans-serif';
                        ctx.fillStyle = '#FFFFFF';
                        var w = ctx.measureText(title).width;
                        ctx.fillText(title, (ctx.canvas.width - w) / 2, 28);
                        tex.needsUpdate = true;
                    };
                })(textCanvas, tex, titles[i]), 5000);

                var mat = new THREE.MeshBasicMaterial({map: tex, side: THREE.DoubleSide, blending: THREE.AdditiveBlending});
                mat.transparent = true;
                mat.depthWrite = false;
                mat.depthTest = false;

                var text = new THREE.Mesh(textGeo, mat);
                text.position.copy(obj.position);
                bg.label = text;
                this.labels.add(text);
                text.position.z = 0.01;

                this.toolBar3D.add(obj);
            }
            this.toolBar3D.visible = false;
            this.labels.visible = false;
        }

    };
});