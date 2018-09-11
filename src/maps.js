import { boxGeom_create } from './boxGeom.js';
import { component_create, entity_add } from './entity.js';
import { keys_create } from './keys.js';
import { light_create } from './directionalLight.js';
import { material_create } from './material.js';
import { mesh_create } from './mesh.js';
import { object3d_create, object3d_add } from './object3d.js';
import { player_create, player_update } from './player.js';
import {
  physics_add,
  physics_bodies,
  physics_update,
  get_physics_component,
  BODY_STATIC,
  BODY_DYNAMIC,
} from './physics.js';
import {
  vec3_create,
  vec3_applyQuaternion,
  vec3_cross,
  vec3_fromArray,
  vec3_normalize,
  vec3_set,
} from './vec3.js';

export var createMap = (gl, scene, camera) => {
  var map = object3d_create();
  object3d_add(scene, map);

  var keys = keys_create();

  // Lights
  var ambient = vec3_create(0.5, 0.5, 0.5);

  var light = light_create(vec3_create(1, 1, 1));
  vec3_set(light.position, 128, 48, 0);

  var directionalLights = [light];

  directionalLights.map(light => object3d_add(scene, light));

  // Camera
  var cameraObject = object3d_create();
  object3d_add(cameraObject, camera);
  object3d_add(map, cameraObject);

  // Action
  var playerMesh = physics_add(
    mesh_create(boxGeom_create(30, 56, 30), material_create()),
    BODY_DYNAMIC,
  );
  playerMesh.position.y += 28;
  object3d_add(map, playerMesh);

  var player = player_create(playerMesh, get_physics_component(playerMesh));
  player.scene = scene;

  entity_add(
    map,
    component_create({
      update(component, dt) {
        physics_update(physics_bodies(map));

        player.dt = dt;

        player.command.forward = 0;
        player.command.right = 0;
        player.command.up = 0;

        if (keys.KeyW || keys.ArrowUp) player.command.forward++;
        if (keys.KeyS || keys.ArrowDown) player.command.forward--;
        if (keys.KeyA || keys.ArrowLeft) player.command.right--;
        if (keys.KeyD || keys.ArrowRight) player.command.right++;
        if (keys.Space) player.command.up++;

        var movespeed = 127;
        player.command.forward *= movespeed;
        player.command.right *= movespeed;
        player.command.up *= movespeed;

        vec3_applyQuaternion(
          vec3_set(player.viewForward, 0, 0, -1),
          camera.quaternion,
        );
        vec3_normalize(
          vec3_cross(vec3_set(player.viewRight, 0, -1, 0), player.viewForward),
        );

        player_update(player);
        Object.assign(cameraObject.position, playerMesh.position);
      },
    }),
  );

  [
    // Floor
    [[512, 4, 512], [0, -2, 0]],
    [[32, 56, 1], [0, 28, -128]],
    [[32, 28, 1], [-64, 14, -128]],
    [[640, 8, 128], [-448, 28, 0]],
    [[384, 16, 512], [0, 16, -512]],
    [[64, 64, 64], [160, 32, 160]],
  ].map(([dimensions, position]) => {
    var mesh = physics_add(
      mesh_create(boxGeom_create(...dimensions), material_create()),
      BODY_STATIC,
    );
    vec3_fromArray(mesh.position, position);
    object3d_add(map, mesh);
  });

  return {
    ambient,
    directional: directionalLights,
  };
};
