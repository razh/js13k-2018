import { object3d_create } from './object3d.js';
import { vec3_create } from './vec3.js';

export var light_create = (color = vec3_create(), intensity = 1) => {
  return {
    ...object3d_create(),
    color,
    intensity,
    target: object3d_create(),
  };
};
