import {
  quat_create,
  quat_set,
  quat_normalize,
  quat_multiply,
} from './quat.js';

var pitchQuat = quat_create();
var yawQuat = quat_create();

export var controls_create = object => {
  var controls = {
    object,
    sensitivity: 0.002,
    enabled: false,
    onMouseMove(event) {
      if (!controls.enabled) {
        return;
      }

      var { movementX, movementY } = event;

      var pitch = -movementY * controls.sensitivity;
      var yaw = -movementX * controls.sensitivity;

      quat_normalize(quat_set(pitchQuat, pitch, 0, 0, 1));
      quat_normalize(quat_set(yawQuat, 0, yaw, 0, 1));

      // pitch * object * yaw
      quat_multiply(object.quaternion, pitchQuat);
      quat_multiply(yawQuat, object.quaternion);
      Object.assign(object.quaternion, yawQuat);
    },
  };

  document.addEventListener('mousemove', controls.onMouseMove);

  return controls;
};

export var controls_dispose = controls => {
  document.removeEventListener('mousemove', controls.onMouseMove);
};
