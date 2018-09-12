import {
  box3_create,
  box3_copy,
  box3_overlapsBox,
  box3_translate,
} from './box3.js';
import { physics_bodies } from './physics.js';
import {
  vec3_create,
  vec3_add,
  vec3_addScaledVector,
  vec3_dot,
  vec3_length,
  vec3_multiplyScalar,
  vec3_normalize,
  vec3_setScalar,
  vec3_subVectors,
  pm_clipVelocity,
  OVERCLIP,
} from './vec3.js';

// movement flags
var PMF_JUMP_HELD = 2;
export var PMF_GRAPPLE_FLY = 1024;
export var PMF_GRAPPLE_PULL = 2048; // pull towards grapple location
export var PMF_GRAPPLE = PMF_GRAPPLE_FLY | PMF_GRAPPLE_PULL;
export var GRAPPLE_SPEED = 1024;

var JUMP_VELOCITY = 270;

// movement parameters
var PM_STOPSPEED = 100;

var PM_ACCELERATE = 10;
var PM_AIRACCELERATE = 1;

var PM_FRICTION = 6;

var g_speed = 320;
var g_gravity = 800;

export var player_create = (object, body) => {
  return {
    object,
    body,

    scene: undefined,

    // player input
    command: {
      forward: 0,
      right: 0,
      up: 0,
      hook: 0,
    },

    // run-time variables
    dt: 0,
    gravity: g_gravity,
    speed: g_speed,
    viewForward: vec3_create(),
    viewRight: vec3_create(),
    grapplePoint: vec3_create(), // location of grapple to pull towards if PMF_GRAPPLE_PULL

    // walk movement
    movementFlags: 0,
    walking: false,
    groundPlane: false,
    groundTrace: {
      normal: vec3_create(0, 1, 0),
    },
  };
};

export var player_update = player => {
  if (player.command.up < 10) {
    // not holding jump
    player.movementFlags &= ~PMF_JUMP_HELD;
  }

  player_checkGround(player);

  if (player.movementFlags & PMF_GRAPPLE_PULL) {
    player_grappleMove(player);
    // We can wiggle a bit
    player_airMove(player);
  } else if (player.walking) {
    // walking on ground
    player_walkMove(player);
  } else {
    // airborne
    player_airMove(player);
  }

  player_checkGround(player);
};

var player_checkJump = player => {
  if (player.command.up < 10) {
    // not holding jump
    return false;
  }

  if (player.movementFlags & PMF_JUMP_HELD) {
    player.command.up = 0;
    return false;
  }

  player.groundPlane = false;
  player.walking = false;
  player.movementFlags |= PMF_JUMP_HELD;

  player.body.velocity.y = JUMP_VELOCITY;

  return true;
};

var player_walkMove = (() => {
  var wishvel = vec3_create();
  var wishdir = vec3_create();

  return player => {
    if (player_checkJump(player)) {
      player_airMove(player);
      return;
    }

    player_friction(player);

    var fmove = player.command.forward;
    var smove = player.command.right;

    var scale = player_cmdScale(player);

    // project moves down to flat plane
    player.viewForward.y = 0;
    player.viewRight.y = 0;

    // project the forward and right directions onto the ground plane
    pm_clipVelocity(player.viewForward, player.groundTrace.normal, OVERCLIP);
    pm_clipVelocity(player.viewRight, player.groundTrace.normal, OVERCLIP);
    //
    vec3_normalize(player.viewForward);
    vec3_normalize(player.viewRight);

    vec3_setScalar(wishvel, 0);
    vec3_addScaledVector(wishvel, player.viewForward, fmove);
    vec3_addScaledVector(wishvel, player.viewRight, smove);

    Object.assign(wishdir, wishvel);
    var wishspeed = vec3_length(wishdir);
    vec3_normalize(wishdir);
    wishspeed *= scale;

    player_accelerate(player, wishdir, wishspeed, PM_ACCELERATE);

    pm_clipVelocity(player.body.velocity, player.groundTrace.normal, OVERCLIP);

    // don't do anything if standing still
    if (!player.body.velocity.x && !player.body.velocity.z) {
      return;
    }
  };
})();

var player_airMove = (() => {
  var wishvel = vec3_create();
  var wishdir = vec3_create();

  return player => {
    player_friction(player);

    var fmove = player.command.forward;
    var smove = player.command.right;

    var scale = player_cmdScale(player);

    // project moves down to flat plane
    player.viewForward.y = 0;
    player.viewRight.y = 0;
    vec3_normalize(player.viewForward);
    vec3_normalize(player.viewRight);

    vec3_setScalar(wishvel, 0);
    vec3_addScaledVector(wishvel, player.viewForward, fmove);
    vec3_addScaledVector(wishvel, player.viewRight, smove);
    wishvel.y = 0;

    Object.assign(wishdir, wishvel);
    var wishspeed = vec3_length(wishdir);
    vec3_normalize(wishdir);
    wishspeed *= scale;

    // not on ground, so little effect on velocity
    player_accelerate(player, wishdir, wishspeed, PM_AIRACCELERATE);

    // we may have a ground plane that is very steep, even
    // though we don't have a groundentity
    // slide along the steep plane
    if (player.groundPlane) {
      pm_clipVelocity(
        player.body.velocity,
        player.groundTrace.normal,
        OVERCLIP,
      );
    }

    player.body.velocity.y -= player.gravity * player.dt;
  };
})();

var player_grappleMove = (() => {
  var vel = vec3_create();
  var v = vec3_create();

  return player => {
    vec3_multiplyScalar(Object.assign(v, player.viewForward), -16);
    vec3_add(v, player.grapplePoint);
    vec3_subVectors(vel, v, player.object.position);
    var vlen = vec3_length(vel);
    vec3_normalize(vel);

    if (vlen <= 100) {
      vec3_multiplyScalar(vel, 10 * vlen);
    } else {
      vec3_multiplyScalar(vel, 800);
    }

    Object.assign(player.body.velocity, vel);

    player.groundPlane = false;
  };
})();

var player_friction = (() => {
  var vec = vec3_create();

  return player => {
    var vel = player.body.velocity;

    Object.assign(vec, vel);
    if (player.walking) {
      vec.y = 0; // ignore slope movement
    }

    var speed = vec3_length(vec);
    if (speed < 1) {
      vel.x = 0;
      vel.z = 0;
      return;
    }

    var drop = 0;

    // apply ground friction
    if (player.walking) {
      var control = speed < PM_STOPSPEED ? PM_STOPSPEED : speed;
      drop += control * PM_FRICTION * player.dt;
    }

    // scale the velocity
    var newspeed = speed - drop;
    if (newspeed < 0) {
      newspeed = 0;
    }
    newspeed /= speed;

    vec3_multiplyScalar(vel, newspeed);
  };
})();

var player_cmdScale = player => {
  var max = Math.abs(player.command.forward);
  if (Math.abs(player.command.right) > max) {
    max = Math.abs(player.command.right);
  }

  if (Math.abs(player.command.up) > max) {
    max = Math.abs(player.command.up);
  }

  if (!max) {
    return 0;
  }

  var total = Math.sqrt(
    player.command.forward ** 2 +
      player.command.right ** 2 +
      player.command.up ** 2,
  );
  var scale = (player.speed * max) / (127 * total);

  return scale;
};

var player_accelerate = (player, wishdir, wishspeed, accel) => {
  var currentspeed = vec3_dot(player.body.velocity, wishdir);
  var addspeed = wishspeed - currentspeed;
  if (addspeed <= 0) {
    return;
  }
  var accelspeed = accel * player.dt * wishspeed;
  if (accelspeed > addspeed) {
    accelspeed = addspeed;
  }

  vec3_addScaledVector(player.body.velocity, wishdir, accelspeed);
};

var player_checkGround = (() => {
  var boxA = box3_create();
  var boxB = box3_create();

  var delta = vec3_create(0, -0.25, 0);

  return player => {
    var bodies = physics_bodies(player.scene).filter(
      body => body !== player.body,
    );

    box3_translate(
      box3_copy(boxA, player.body.boundingBox),
      player.object.position,
    );
    box3_translate(boxA, delta);

    for (var i = 0; i < bodies.length; i++) {
      var body = bodies[i];
      box3_translate(box3_copy(boxB, body.boundingBox), body.parent.position);

      if (box3_overlapsBox(boxA, boxB)) {
        player.groundPlane = true;
        player.walking = true;
        return;
      }
    }

    // If we do not overlap anything, we are in free fall.
    player.groundPlane = false;
    player.walking = false;
  };
})();
