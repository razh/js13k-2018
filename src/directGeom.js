export var directGeom_fromGeom = geom => {
  var vertices = [];
  var colors = [];

  geom.faces.map(face => {
    vertices.push(
      geom.vertices[face.a],
      geom.vertices[face.b],
      geom.vertices[face.c],
    );

    var { vertexColors } = face;
    if (vertexColors.length === 3) {
      colors.push(...vertexColors);
    } else {
      var { color } = face;
      colors.push(color, color, color);
    }
  });

  return {
    vertices,
    colors,
  };
};
