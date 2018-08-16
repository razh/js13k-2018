export var createShaderProgram = (gl, vs, fs) => {
  var program = gl.createProgram();

  var createShader = (type, source) => {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
  };

  createShader(gl.VERTEX_SHADER, vs);
  createShader(gl.FRAGMENT_SHADER, fs);

  gl.linkProgram(program);

  return program;
};

export var createFloat32Buffer = (gl, array) => {
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
  return buffer;
};

export var setFloat32Attribute = (gl, location, buffer, size) => {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
};

export var setFloatUniform = (gl, location, value) => {
  gl.uniform1f(location, value);
};

export var setMat4Uniform = (gl, location, array) => {
  gl.uniformMatrix4fv(location, false, array);
};

export var setVec3Uniform = (gl, location, vector) => {
  gl.uniform3f(location, vector.x, vector.y, vector.z);
};

export var getAttributeLocations = (gl, program) => {
  var locations = {};

  var count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

  for (var i = 0; i < count; i++) {
    var attribute = gl.getActiveAttrib(program, i);
    var { name } = attribute;
    locations[name] = gl.getAttribLocation(program, name);
  }

  return locations;
};

export var getUniformLocations = (gl, program) => {
  var locations = {};

  var count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

  for (var i = 0; i < count; i++) {
    var uniform = gl.getActiveUniform(program, i);
    var { name } = uniform;
    locations[name] = gl.getUniformLocation(program, name);
  }

  return locations;
};
