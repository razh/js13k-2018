// Vertices.
// pz-nz order is reversed for the nx side.
var px_py_pz = [0];
var px_py_nz = [1];
var px_ny_pz = [2];
var px_ny_nz = [3];
var nx_py_nz = [4];
var nx_py_pz = [5];
var nx_ny_nz = [6];
var nx_ny_pz = [7];

// Edges.
var px_py = [].concat(px_py_pz, px_py_nz);
var px_ny = [].concat(px_ny_pz, px_ny_nz);
var nx_py = [].concat(nx_py_nz, nx_py_pz);
var nx_ny = [].concat(nx_ny_nz, nx_ny_pz);

var px_pz = [].concat(px_py_pz, px_ny_pz);
var px_nz = [].concat(px_py_nz, px_ny_nz);
var nx_nz = [].concat(nx_py_nz, nx_ny_nz);
var nx_pz = [].concat(nx_py_pz, nx_ny_pz);

var py_pz = [].concat(px_py_pz, nx_py_pz);
var py_nz = [].concat(px_py_nz, nx_py_nz);
var ny_pz = [].concat(px_ny_pz, nx_ny_pz);
var ny_nz = [].concat(px_ny_nz, nx_ny_nz);

// Faces.
var px = [].concat(px_py, px_ny);
var nx = [].concat(nx_py, nx_ny);
var py = [].concat(px_py, nx_py);
var ny = [].concat(px_ny, nx_ny);
var pz = [].concat(px_pz, nx_pz);
var nz = [].concat(px_nz, nx_nz);

// All vertices.
var all = [].concat(px, nx);

export default {
  px_py_pz,
  px_py_nz,
  px_ny_pz,
  px_ny_nz,
  nx_py_nz,
  nx_py_pz,
  nx_ny_nz,
  nx_ny_pz,

  px_py,
  px_ny,
  nx_py,
  nx_ny,

  px_pz,
  px_nz,
  nx_nz,
  nx_pz,

  py_pz,
  py_nz,
  ny_pz,
  ny_nz,

  px,
  nx,
  py,
  ny,
  pz,
  nz,

  all,
};
