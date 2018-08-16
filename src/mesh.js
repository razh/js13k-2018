import { object3d_create } from './object3d.js';

export var mesh_create = (geometry, material) => {
  return {
    ...object3d_create(),
    geometry,
    material,
  };
};
