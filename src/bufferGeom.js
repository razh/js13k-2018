import { bufferAttr_copyVector3sArray } from './bufferAttr.js';
import { directGeom_fromGeom } from './directGeom.js';

export var bufferGeom_create = () => {
  return {
    attrs: {},
  };
};

export var bufferGeom_fromGeom = (bufferGeom, geom) =>
  bufferGeom_fromDirectGeom(bufferGeom, directGeom_fromGeom(geom));

export var bufferGeom_fromDirectGeom = (bufferGeom, geom) => {
  var positions = new Float32Array(geom.vertices.length * 3);
  bufferGeom.attrs.position = bufferAttr_copyVector3sArray(
    positions,
    geom.vertices,
  );

  var colors = new Float32Array(geom.colors.length * 3);
  bufferGeom.attrs.color = bufferAttr_copyVector3sArray(colors, geom.colors);

  return bufferGeom;
};
