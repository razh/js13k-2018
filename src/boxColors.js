import boxIndices from './boxIndices.js';
import { vec3_create, vec3_fromArray } from './vec3.js';
import { rearg } from './utils.js';

export var setFaceVertexColor = (face, index, color) => {
  if (face.a === index) {
    face.vertexColors[0] = color;
  }

  if (face.b === index) {
    face.vertexColors[1] = color;
  }

  if (face.c === index) {
    face.vertexColors[2] = color;
  }
};

export var applyBoxVertexColors = (() => {
  return (geom, colors) => {
    Object.keys(colors).map(key => {
      var color = vec3_fromArray(vec3_create(), colors[key]);
      var indices = boxIndices[key];

      geom.faces.map(face =>
        indices.map(index => setFaceVertexColor(face, index, color)),
      );
    });

    return geom;
  };
})();

export var applyDefaultVertexColors = (geom, defaultColor) => {
  var color = vec3_fromArray(vec3_create(), defaultColor);

  geom.faces.map(face => {
    for (var i = 0; i < 3; i++) {
      if (face.vertexColors[i] === undefined) {
        face.vertexColors[i] = color;
      }
    }
  });

  return geom;
};

export var colors = rearg(applyBoxVertexColors);
export var defaultColors = rearg(applyDefaultVertexColors);
