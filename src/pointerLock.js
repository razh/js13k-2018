export var pointerLock_create = (controls, element) => {
  var hasPointerLock = 'pointerLockElement' in document;

  if (!hasPointerLock) {
    controls.enabled = true;
    return;
  }

  var onPointerLockChange = () => {
    controls.enabled = element === document.pointerLockElement;
  };

  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('click', () => element.requestPointerLock());
};
