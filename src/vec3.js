export var vec3_create = (x = 0, y = 0, z = 0) => {
  return {
    x,
    y,
    z,
  };
};

export var vec3_set = (v, x, y, z) => {
  v.x = x;
  v.y = y;
  v.z = z;
  return v;
};

export var vec3_setScalar = (v, scalar) => {
  v.x = scalar;
  v.y = scalar;
  v.z = scalar;
  return v;
};

export var vec3_setX = (v, x) => {
  v.x = x;
  return v;
};

export var vec3_setY = (v, y) => {
  v.y = y;
  return v;
};

export var vec3_setZ = (v, z) => {
  v.z = z;
  return v;
};

export var vec3_clone = v => {
  return vec3_create(v.x, v.y, v.z);
};

export var vec3_add = (a, b) => {
  a.x += b.x;
  a.y += b.y;
  a.z += b.z;
  return a;
};

export var vec3_addVectors = (v, a, b) => {
  v.x = a.x + b.x;
  v.y = a.y + b.y;
  v.z = a.z + b.z;
  return v;
};

export var vec3_addScaledVector = (a, b, s) => {
  a.x += b.x * s;
  a.y += b.y * s;
  a.z += b.z * s;
  return a;
};

export var vec3_sub = (a, b) => {
  a.x -= b.x;
  a.y -= b.y;
  a.z -= b.z;
  return a;
};

export var vec3_subVectors = (v, a, b) => {
  v.x = a.x - b.x;
  v.y = a.y - b.y;
  v.z = a.z - b.z;
  return v;
};

export var vec3_multiply = (a, b) => {
  a.x *= b.x;
  a.y *= b.y;
  a.z *= b.z;
  return a;
};

export var vec3_multiplyScalar = (v, scalar) => {
  v.x *= scalar;
  v.y *= scalar;
  v.z *= scalar;
  return v;
};

export var vec3_applyMatrix4 = (v, m) => {
  var { x, y, z } = v;

  var w = 1 / (m[3] * x + m[7] * y + m[11] * z + m[15]);

  v.x = (m[0] * x + m[4] * y + m[8] * z + m[12]) * w;
  v.y = (m[1] * x + m[5] * y + m[9] * z + m[13]) * w;
  v.z = (m[2] * x + m[6] * y + m[10] * z + m[14]) * w;

  return v;
};

export var vec3_applyQuaternion = (v, q) => {
  var { x, y, z } = v;
  var qx = q.x,
    qy = q.y,
    qz = q.z,
    qw = q.w;

  // calculate quat * vector

  var ix = qw * x + qy * z - qz * y;
  var iy = qw * y + qz * x - qx * z;
  var iz = qw * z + qx * y - qy * x;
  var iw = -qx * x - qy * y - qz * z;

  // calculate result * inverse quat

  v.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
  v.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
  v.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

  return v;
};

export var vec3_transformDirection = (v, m) => {
  // input: THREE.Matrix4 affine matrix
  // vector interpreted as a direction

  var { x, y, z } = v;

  v.x = m[0] * x + m[4] * y + m[8] * z;
  v.y = m[1] * x + m[5] * y + m[9] * z;
  v.z = m[2] * x + m[6] * y + m[10] * z;

  return vec3_normalize(v);
};

export var vec3_divideScalar = (v, scalar) => {
  return vec3_multiplyScalar(v, 1 / scalar);
};

export var vec3_min = (a, b) => {
  a.x = Math.min(a.x, b.x);
  a.y = Math.min(a.y, b.y);
  a.z = Math.min(a.z, b.z);
  return a;
};

export var vec3_max = (a, b) => {
  a.x = Math.max(a.x, b.x);
  a.y = Math.max(a.y, b.y);
  a.z = Math.max(a.z, b.z);
  return a;
};

export var vec3_dot = (a, b) => {
  return a.x * b.x + a.y * b.y + a.z * b.z;
};

export var vec3_length = v => {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
};

export var vec3_normalize = v => {
  return vec3_divideScalar(v, vec3_length(v) || 1);
};

export var vec3_cross = (a, b) => {
  var { x, y, z } = a;

  a.x = y * b.z - z * b.y;
  a.y = z * b.x - x * b.z;
  a.z = x * b.y - y * b.x;

  return a;
};

export var vec3_crossVectors = (v, a, b) => {
  var ax = a.x;
  var ay = a.y;
  var az = a.z;

  var bx = b.x;
  var by = b.y;
  var bz = b.z;

  v.x = ay * bz - az * by;
  v.y = az * bx - ax * bz;
  v.z = ax * by - ay * bx;

  return v;
};

export var vec3_distanceTo = (a, b) => {
  return Math.sqrt(vec3_distanceToSquared(a, b));
};

export var vec3_distanceToSquared = (a, b) => {
  var dx = a.x - b.x,
    dy = a.y - b.y,
    dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
};

export var vec3_setFromMatrixPosition = (v, m) => {
  v.x = m[12];
  v.y = m[13];
  v.z = m[14];
  return v;
};

export var vec3_fromArray = (v, array) => {
  v.x = array[0];
  v.y = array[1];
  v.z = array[2];
  return v;
};

export var vec3_X = vec3_create(1, 0, 0);
export var vec3_Y = vec3_create(0, 1, 0);
export var vec3_Z = vec3_create(0, 0, 1);
