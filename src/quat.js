import { clamp } from './math.js';

export var quat_create = (x = 0, y = 0, z = 0, w = 1) => {
  return {
    x,
    y,
    z,
    w,
  };
};

export var quat_set = (q, x, y, z, w) => {
  q.x = x;
  q.y = y;
  q.z = z;
  q.w = w;
  return q;
};

export var quat_copy = (a, b) => {
  a.x = b.x;
  a.y = b.y;
  a.z = b.z;
  a.w = b.w;
  return a;
};

export var quat_setFromEuler = (q, euler) => {
  var { x, y, z } = euler;

  // http://www.mathworks.com/matlabcentral/fileexchange/
  //   20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
  //  content/SpinCalc.m

  var c1 = Math.cos(x / 2);
  var c2 = Math.cos(y / 2);
  var c3 = Math.cos(z / 2);

  var s1 = Math.sin(x / 2);
  var s2 = Math.sin(y / 2);
  var s3 = Math.sin(z / 2);

  q.x = s1 * c2 * c3 + c1 * s2 * s3;
  q.y = c1 * s2 * c3 - s1 * c2 * s3;
  q.z = c1 * c2 * s3 + s1 * s2 * c3;
  q.w = c1 * c2 * c3 - s1 * s2 * s3;

  return q;
};

export var quat_setFromAxisAngle = (q, axis, angle) => {
  // http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
  // assumes axis is normalized

  var halfAngle = angle / 2;
  var s = Math.sin(halfAngle);

  q.x = axis.x * s;
  q.y = axis.y * s;
  q.z = axis.z * s;
  q.w = Math.cos(halfAngle);

  return q;
};

export var quat_setFromRotationMatrix = (q, m) => {
  // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
  // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

  var m11 = m[0],
    m12 = m[4],
    m13 = m[8];
  var m21 = m[1],
    m22 = m[5],
    m23 = m[9];
  var m31 = m[2],
    m32 = m[6],
    m33 = m[10];

  var trace = m11 + m22 + m33;
  var s;

  if (trace > 0) {
    s = 0.5 / Math.sqrt(trace + 1);

    q.w = 0.25 / s;
    q.x = (m32 - m23) * s;
    q.y = (m13 - m31) * s;
    q.z = (m21 - m12) * s;
  } else if (m11 > m22 && m11 > m33) {
    s = 2 * Math.sqrt(1 + m11 - m22 - m33);

    q.w = (m32 - m23) / s;
    q.x = 0.25 * s;
    q.y = (m12 + m21) / s;
    q.z = (m13 + m31) / s;
  } else if (m22 > m33) {
    s = 2 * Math.sqrt(1 + m22 - m11 - m33);

    q.w = (m13 - m31) / s;
    q.x = (m12 + m21) / s;
    q.y = 0.25 * s;
    q.z = (m23 + m32) / s;
  } else {
    s = 2 * Math.sqrt(1 + m33 - m11 - m22);

    q.w = (m21 - m12) / s;
    q.x = (m13 + m31) / s;
    q.y = (m23 + m32) / s;
    q.z = 0.25 * s;
  }

  return q;
};

export var quat_angleTo = (a, b) => {
  return 2 * Math.acos(Math.abs(clamp(quat_dot(a, b), -1, 1)));
};

export var quat_rotateTowards = (a, b, step) => {
  var angle = quat_angleTo(a, b);

  if (!angle) return a;

  var t = Math.min(1, step / angle);

  quat_slerp(a, b, t);

  return a;
};

export var quat_dot = (a, b) => {
  return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
};

export var quat_length = q => {
  return Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
};

export var quat_normalize = q => {
  var l = quat_length(q);

  if (!l) {
    q.x = 0;
    q.y = 0;
    q.z = 0;
    q.w = 1;
  } else {
    l = 1 / l;

    q.x = q.x * l;
    q.y = q.y * l;
    q.z = q.z * l;
    q.w = q.w * l;
  }

  return q;
};

export var quat_multiply = (a, b) => {
  // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm
  var qax = a.x,
    qay = a.y,
    qaz = a.z,
    qaw = a.w;
  var qbx = b.x,
    qby = b.y,
    qbz = b.z,
    qbw = b.w;

  a.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
  a.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
  a.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
  a.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

  return a;
};

export var quat_slerp = (a, b, t) => {
  if (t === 0) return a;
  if (t === 1) return quat_copy(a, b);

  var { x, y, z, w } = a;

  // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

  var cosHalfTheta = w * b.w + x * b.x + y * b.y + z * b.z;

  if (cosHalfTheta < 0) {
    a.w = -b.w;
    a.x = -b.x;
    a.y = -b.y;
    a.z = -b.z;

    cosHalfTheta = -cosHalfTheta;
  } else {
    quat_copy(a, b);
  }

  if (cosHalfTheta >= 1.0) {
    a.w = w;
    a.x = x;
    a.y = y;
    a.z = z;

    return a;
  }

  var sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

  if (sqrSinHalfTheta <= Number.EPSILON) {
    var s = 1 - t;
    a.w = s * w + t * a.w;
    a.x = s * x + t * a.x;
    a.y = s * y + t * a.y;
    a.z = s * z + t * a.z;

    return quat_normalize(a);
  }

  var sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
  var halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
  var ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta,
    ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

  a.w = w * ratioA + a.w * ratioB;
  a.x = x * ratioA + a.x * ratioB;
  a.y = y * ratioA + a.y * ratioB;
  a.z = z * ratioA + a.z * ratioB;

  return a;
};
