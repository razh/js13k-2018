import { vec3_create } from './vec3.js';

// MeshPhongMaterial.
export var material_create = () => {
  return {
    color: vec3_create(1, 1, 1),
    // 0x111111
    specular: vec3_create(1 / 15, 1 / 15, 1 / 15),
    shininess: 30,
    emissive: vec3_create(),
  };
};
