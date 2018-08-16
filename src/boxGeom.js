import { geom_create, geom_push } from './geom.js';

export var boxGeom_create = (width, height, depth) => {
  var halfWidth = width / 2;
  var halfHeight = height / 2;
  var halfDepth = depth / 2;

  // Generated from new THREE.BoxGeometry(1, 1, 1).
  // prettier-ignore
  var vertices = [
    // px.
    halfWidth, halfHeight, halfDepth,
    halfWidth, halfHeight, -halfDepth,
    halfWidth, -halfHeight, halfDepth,
    halfWidth, -halfHeight, -halfDepth,

    // nx.
    -halfWidth, halfHeight, -halfDepth,
    -halfWidth, halfHeight, halfDepth,
    -halfWidth, -halfHeight, -halfDepth,
    -halfWidth, -halfHeight, halfDepth,
  ];

  // prettier-ignore
  var faces = [
    0, 2, 1,
    2, 3, 1,
    4, 6, 5,
    6, 7, 5,
    4, 5, 1,
    5, 0, 1,
    7, 6, 2,
    6, 3, 2,
    5, 7, 0,
    7, 2, 0,
    1, 3, 4,
    3, 6, 4,
  ];

  return geom_push(geom_create(), vertices, faces);
};
