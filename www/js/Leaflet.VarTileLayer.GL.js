L.TileLayer.GL = L.GridLayer.extend({
	options: {
		tileUrls: [],
		tileLayers: [],
		fragmentShader: "void main(void) {gl_FragColor = vec4(0.2,0.2,0.2,1.0);}",
		uniforms: {},
		subdomains: ["a", "b", "c", "d"],
	},

	initialize: function(options) {
		options = L.setOptions(this, options);

		this._renderer = L.DomUtil.create("canvas");
		this._renderer.width = this._renderer.height = options.tileSize;
		this._glError = false;

		var gl = (this._gl =
			this._renderer.getContext("webgl", {
				premultipliedAlpha: false,
			}) ||
			this._renderer.getContext("experimental-webgl", {
				premultipliedAlpha: false,
			}));
		gl.viewportWidth = options.tileSize;
		gl.viewportHeight = options.tileSize;

		// Create `TileLayer`s from the tileUrls option.
		this._tileLayers = Array.from(options.tileLayers);
		for (var i = 0; i < options.tileUrls.length && i < 8; i++) {
			this._tileLayers.push(L.tileLayer(options.tileUrls[i]));
		}

		this._loadGLProgram();

		// Init textures
		this._textures = [];
		for (i = 0; i < this._tileLayers.length && i < 8; i++) {
			this._textures[i] = gl.createTexture();
			gl.uniform1i(gl.getUniformLocation(this._glProgram, "uTexture" + i), i);
		}
	},

	getGlError: function() {
		return this._glError;
	},

	_loadGLProgram: function() {
		var gl = this._gl;

		// Force using this vertex shader.
		// Just copy all attributes to predefined variants and set the vertex positions
		var vertexShaderCode =
			"attribute vec2 aVertexCoords;  " +
			"attribute vec2 aTextureCoords;  " +
			"attribute vec2 aCRSCoords;  " +
			"attribute vec2 aLatLngCoords;  " +
			"attribute float aValue;  " +
			"varying vec2 vTextureCoords;  " +
			"varying vec2 vCRSCoords;  " +
			"varying vec2 vLatLngCoords;  " +
			"varying float vValue;  " +
			"void main(void) {  " +
			"	gl_Position = vec4(aVertexCoords , 1.0, 1.0);  " +
			"	vTextureCoords = aTextureCoords;  " +
			"	vCRSCoords = aCRSCoords;  " +
			"	vLatLngCoords = aLatLngCoords;  " +
			"	vValue = aValue;  " +
			"}";

		// Force using this bit for the fragment shader. All fragment shaders
		// will use the same predefined variants, and
		var fragmentShaderHeader =
			"precision highp float;\n" +
			"uniform float uNow;\n" +
			"varying vec2 vTextureCoords;\n" +
			"varying vec2 vCRSCoords;\n" +
			"varying vec2 vLatLngCoords;\n" +
			"varying float vValue;\n";

		for (var i = 0; i < this._tileLayers.length && i < 8; i++) {
			fragmentShaderHeader += "uniform sampler2D uTexture" + i + ";\n";
		}

		fragmentShaderHeader += this._getUniformSizes();

		var program = (this._glProgram = gl.createProgram());
		var vertexShader = gl.createShader(gl.VERTEX_SHADER);
		var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(vertexShader, vertexShaderCode);
		gl.shaderSource(fragmentShader, fragmentShaderHeader + this.options.fragmentShader);
		gl.compileShader(vertexShader);
		gl.compileShader(fragmentShader);

		// @event shaderError
		// Fired when there was an error creating the shaders.
		if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
			this._glError = gl.getShaderInfoLog(vertexShader);
			console.error(this._glError);
			return null;
		}
		if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
			this._glError = gl.getShaderInfoLog(fragmentShader);
			console.error(this._glError);
			return null;
		}

		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		gl.useProgram(program);

		this._aVertexPosition = gl.getAttribLocation(program, "aVertexCoords");
		this._aTexPosition = gl.getAttribLocation(program, "aTextureCoords");
		this._aCRSPosition = gl.getAttribLocation(program, "aCRSCoords");
		this._aLatLngPosition = gl.getAttribLocation(program, "aLatLngCoords");
		this._aValuePosition = gl.getAttribLocation(program, "aValue");

		this._initUniforms(program);

		// If the shader is time-dependent (i.e. animated), or has custom uniforms,
		// init the texture cache
		if (this._isReRenderable) {
			this._fetchedTextures = {};
			this._2dContexts = {};
		}

		// 		console.log('Tex position: ', this._aTexPosition);
		// 		console.log('CRS position: ', this._aCRSPosition);
		// 		console.log("uNow position: ", this._uNowPosition);

		// Create three data buffer with 8 elements each - the (easting,northing)
		// CRS coords, the (s,t) texture coords and the viewport coords for each
		// of the 4 vertices
		// Data for the texel and viewport coords is totally static, and
		// needs to be declared only once.
		this._CRSBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this._CRSBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(8), gl.STATIC_DRAW);
		if (this._aCRSPosition !== -1) {
			gl.enableVertexAttribArray(this._aCRSPosition);
			gl.vertexAttribPointer(this._aCRSPosition, 2, gl.FLOAT, false, 8, 0);
		}

		this._LatLngBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this._LatLngBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(8), gl.STATIC_DRAW);
		if (this._aLatLngPosition !== -1) {
			gl.enableVertexAttribArray(this._aLatLngPosition);
			gl.vertexAttribPointer(this._aLatLngPosition, 2, gl.FLOAT, false, 8, 0);
		}

		this._ValueBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this._ValueBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(4), gl.STATIC_DRAW);
		if (this._aValuePosition !== -1) {
			gl.enableVertexAttribArray(this._aValuePosition);
			gl.vertexAttribPointer(this._aValuePosition, 1, gl.FLOAT, false, 0, 0);
		}

		this._TexCoordsBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this._TexCoordsBuffer);

		// prettier-ignore
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			1.0, 0.0,
			0.0, 0.0,
			1.0, 1.0,
			0.0, 1.0,
		]), gl.STATIC_DRAW);
		if (this._aTexPosition !== -1) {
			gl.enableVertexAttribArray(this._aTexPosition);
			gl.vertexAttribPointer(this._aTexPosition, 2, gl.FLOAT, false, 8, 0);
		}

		this._VertexCoordsBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this._VertexCoordsBuffer);

		// prettier-ignore
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			 1,  1,
			-1,  1,
			 1, -1,
			-1, -1
		]), gl.STATIC_DRAW);
		if (this._aVertexPosition !== -1) {
			gl.enableVertexAttribArray(this._aVertexPosition);
			gl.vertexAttribPointer(this._aVertexPosition, 2, gl.FLOAT, false, 8, 0);
		}
	},

	// Looks at the size of the default values given for the uniforms.
	// Returns a string valud for defining the uniforms in the shader header.
	_getUniformSizes() {
		var defs = "";
		this._uniformSizes = {};
		for (var uniformName in this.options.uniforms) {			
			var defaultValue = this.options.uniforms[uniformName];
			if (typeof defaultValue === "number") {
				this._uniformSizes[uniformName] = 0;
				defs += "uniform float " + uniformName + ";\n";
			} else if (Array.isArray(defaultValue)) {
				if (defaultValue.length > 4) {
					throw new Error("Max size for uniform value is 4 elements");
				}
				this._uniformSizes[uniformName] = defaultValue.length;
				if (defaultValue.length === 1) {
					defs += "uniform float " + uniformName + ";\n";
				} else {
					defs += "uniform vec" + defaultValue.length + " " + uniformName + ";\n";
				}
			} else {
				throw new Error(
					"Default value for uniforms must be either number or array of numbers"
				);
			}
		}
		return defs;
	},

	// Inits the uNow uniform, and the user-provided uniforms, given the current GL program.
	// Sets the _isReRenderable property if there are any set uniforms.
	_initUniforms(program) {
		var gl = this._gl;
		this._uNowPosition = gl.getUniformLocation(program, "uNow");
		this._isReRenderable = false;

		if (this._uNowPosition) {
			gl.uniform1f(this._uNowPosition, performance.now());
			this._isReRenderable = true;
		}

		this._uniformLocations = {};
		for (var uniformName in this.options.uniforms) {
			this._uniformLocations[uniformName] = gl.getUniformLocation(program, uniformName);
			this.setUniform(uniformName, this.options.uniforms[uniformName]);
			this._isReRenderable = true;
		}
	},

	// This is called once per tile - uses the layer's GL context to
	//   render a tile, passing the complex space coordinates to the
	//   GPU, and asking to render the vertexes (as triangles) again.
	// Every pixel will be opaque, so there is no need to clear the scene.
	_render: function(coords) {
		var gl = this._gl;
		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		gl.clearColor(0.5, 0.5, 0.5, 0);
		gl.enable(gl.BLEND);

		var tileBounds = this._tileCoordsToBounds(coords);
		var west = tileBounds.getWest(),
			east = tileBounds.getEast(),
			north = tileBounds.getNorth(),
			south = tileBounds.getSouth();

		// Create data array for LatLng buffer
		// prettier-ignore
		var latLngData = [
			// Vertex 0
			east, north,

			// Vertex 1
			west, north,

			// Vertex 2
			east, south,

			// Vertex 3
			west, south,
		];

		// ...upload them to the GPU...
		gl.bindBuffer(gl.ARRAY_BUFFER, this._LatLngBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(latLngData), gl.STATIC_DRAW);

		// Variable values
		var values = [0.0,0.0,0.0,0.0]
		if (this.options.valueCallback) {
			values = [
				this.options.valueCallback(north, east),
				this.options.valueCallback(north, west),
				this.options.valueCallback(south, east),
				this.options.valueCallback(south, west)
			];
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, this._ValueBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);

		// ...also create data array for CRS buffer...
		// Kinda inefficient, but doesn't look performance-critical
		var crs = this._map.options.crs,
			min = crs.project(L.latLng(south, west)),
			max = crs.project(L.latLng(north, east));

		// prettier-ignore
		var crsData = [
			// Vertex 0
			max.x, max.y,

			// Vertex 1
			min.x, max.y,

			// Vertex 2
			max.x, min.y,

			// Vertex 3
			min.x, min.y,
		];
		// ...and also upload that to the GPU...
		gl.bindBuffer(gl.ARRAY_BUFFER, this._CRSBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(crsData), gl.STATIC_DRAW);

		// ... and then the magic happens.
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	},

	_bindTexture: function(index, imageData) {
		// Helper function. Binds a ImageData (HTMLImageElement, HTMLCanvasElement or
		// ImageBitmap) to a texture, given its index (0 to 7).
		// The image data is assumed to be in RGBA format.
		var gl = this._gl;

		gl.activeTexture(gl.TEXTURE0 + index);
		gl.bindTexture(gl.TEXTURE_2D, this._textures[index]);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.generateMipmap(gl.TEXTURE_2D);
	},

	// Gets called by L.GridLayer before createTile(), just before coord wrapping happens.
	// Needed to store the context of each <canvas> tile when the tile coords is wrapping.
	_addTile(coords, container) {
		// This is quite an ugly hack, but WTF.
		this._unwrappedKey = this._tileCoordsToKey(coords);
		L.GridLayer.prototype._addTile.call(this, coords, container);
	},

	createTile: function(coords, done) {
		var tile = L.DomUtil.create("canvas", "leaflet-tile");
		tile.width = tile.height = this.options.tileSize;
		tile.onselectstart = tile.onmousemove = L.Util.falseFn;

		var ctx = tile.getContext("2d");
		var unwrappedKey = this._unwrappedKey;
		var texFetches = [];
		for (var i = 0; i < this._tileLayers.length && i < 8; i++) {
			// 				this.options.tileUrls[i]
			texFetches.push(this._getNthTile(i, coords));
		}

		Promise.all(texFetches).then(
			function(textureImages) {
				if (!this._map) {
					return;
				}
				// If the shader is time-dependent (i.e. animated),
				// save the textures for later access
				if (this._isReRenderable) {
					var key = this._tileCoordsToKey(coords);
					this._fetchedTextures[key] = textureImages;
					this._2dContexts[unwrappedKey] = ctx;
				}

				var gl = this._gl;
				for (var i = 0; i < this._tileLayers.length && i < 8; i++) {
					this._bindTexture(i, textureImages[i]);
				}

				this._render(coords);
				ctx.drawImage(this._renderer, 0, 0);
				done();
			}.bind(this),
			function(err) {
				L.TileLayer.prototype._tileOnError.call(this, done, tile, err);
			}.bind(this)
		);

		return tile;
	},

	_removeTile: function(key) {
		if (this._isReRenderable) {
			delete this._fetchedTextures[key];
			delete this._2dContexts[key];
		}
		L.TileLayer.prototype._removeTile.call(this, key);
	},

	onAdd: function() {
		// If the shader is time-dependent (i.e. animated), start an animation loop.
		if (this._uNowPosition) {
			L.Util.cancelAnimFrame(this._animFrame);
			this._animFrame = L.Util.requestAnimFrame(this._onFrame, this);
		}
		L.TileLayer.prototype.onAdd.call(this);
	},

	onRemove: function(map) {
		// Stop the animation loop, if any.
		L.Util.cancelAnimFrame(this._animFrame);
		L.TileLayer.prototype.onRemove.call(this, map);
	},

	_onFrame: function() {
		if (this._uNowPosition && this._map) {
			this.reRender();
			this._animFrame = L.Util.requestAnimFrame(this._onFrame, this, false);
		}
	},

	// Runs the shader (again) on all tiles
	reRender: function() {
		if (!this._isReRenderable) { return; }
		var gl = this._gl;

		gl.uniform1f(this._uNowPosition, performance.now());

		for (var key in this._tiles) {
			var tile = this._tiles[key];
			var coords = this._keyToTileCoords(key);
			var wrappedKey = this._tileCoordsToKey(this._wrapCoords(coords));

			if (!tile.current || !tile.loaded || !this._fetchedTextures[wrappedKey]) {
				continue;
			}

			for (var i = 0; i < this._tileLayers.length && i < 8; i++) {
				this._bindTexture(i, this._fetchedTextures[wrappedKey][i]);
			}
			this._render(coords);

			this._2dContexts[key].drawImage(this._renderer, 0, 0);
		}
	},

	// Sets the value(s) for a uniform.
	setUniform(name, value) {
		switch (this._uniformSizes[name]) {
			case 0:
				this._gl.uniform1f(this._uniformLocations[name], value);
				break;
			case 1:
				this._gl.uniform1fv(this._uniformLocations[name], value);
				break;
			case 2:
				this._gl.uniform2fv(this._uniformLocations[name], value);
				break;
			case 3:
				this._gl.uniform3fv(this._uniformLocations[name], value);
				break;
			case 4:
				this._gl.uniform4fv(this._uniformLocations[name], value);
				break;
		}
	},

	// Gets the tile for the Nth `TileLayer` in `this._tileLayers`,
	// for the given tile coords, returns a promise to the tile.
	_getNthTile: function(n, coords) {
		var layer = this._tileLayers[n];
		// Monkey-patch a few things, both for TileLayer and TileLayer.WMS
		layer._tileZoom = this._tileZoom;
		layer._map = this._map;
		layer._crs = this._map.options.crs;
		layer._globalTileRange = this._globalTileRange;
		return new Promise(
			function(resolve, reject) {
				var tile = document.createElement("img");
				tile.crossOrigin = "";
				tile.src = layer.getTileUrl(coords);
				L.DomEvent.on(tile, "load", resolve.bind(this, tile));
				L.DomEvent.on(tile, "error", reject.bind(this, tile));
			}.bind(this)
		);
	},
});

L.tileLayer.gl = function(opts) {
	return new L.TileLayer.GL(opts);
};
