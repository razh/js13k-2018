export var keys_create = () => {
  var keys = {};

  document.addEventListener('keydown', event => (keys[event.code] = true));
  document.addEventListener('keyup', event => (keys[event.code] = false));

  return keys;
};
