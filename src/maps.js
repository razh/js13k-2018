import { playSuccess, playFire, playHit, playBells } from './audio.js';
import { box3_create, box3_containsPoint } from './box3.js';
import { boxGeom_create } from './boxGeom.js';
import { colors, defaultColors } from './boxColors.js';
import { align, $scale } from './boxTransforms.js';
import { component_create, entity_add } from './entity.js';
import { geom_merge } from './geom.js';
import { keys_create } from './keys.js';
import { light_create } from './directionalLight.js';
import { fbm3d } from './fbm.js';
import { material_create } from './material.js';
import { clamp, mapLinear, randFloat } from './math.js';
import { mesh_create } from './mesh.js';
import { object3d_create, object3d_add, object3d_lookAt } from './object3d.js';
import {
  player_create,
  player_update,
  PMF_GRAPPLE_FLY,
  PMF_GRAPPLE_PULL,
  PMF_GRAPPLE,
  GRAPPLE_SPEED,
} from './player.js';
import {
  physics_add,
  physics_bodies,
  physics_update,
  get_physics_component,
  BODY_STATIC,
  BODY_DYNAMIC,
} from './physics.js';
import { ray_create, ray_intersectObjects } from './ray.js';
import {
  vec3_create,
  vec3_add,
  vec3_addScaledVector,
  vec3_applyQuaternion,
  vec3_cross,
  vec3_distanceTo,
  vec3_fromArray,
  vec3_length,
  vec3_multiplyScalar,
  vec3_normalize,
  vec3_set,
  vec3_subVectors,
} from './vec3.js';
import { compose } from './utils.js';

var DEBUG = false;

export var createMap = (gl, scene, camera) => {
  var fogColor = [0.8, 0.9, 1];
  gl.clearColor(...fogColor, 1);
  vec3_set(scene.fogColor, ...fogColor);
  scene.fogFar = 2048;

  var map = object3d_create();
  object3d_add(scene, map);

  var keys = keys_create();

  // Lights
  var ambient = vec3_create(0.3, 0.3, 0.3);

  var light0 = light_create(vec3_create(0.8, 0.8, 1));
  vec3_set(light0.position, 0, 64, 256);

  var light1 = light_create(vec3_create(0.5, 0.5, 0.6), 4);
  vec3_set(light1.position, 128, 512, -128);

  var directionalLights = [light0, light1];

  directionalLights.map(light => object3d_add(map, light));

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
  playerMesh.visible = false;
  object3d_add(map, playerMesh);

  var player = player_create(playerMesh, get_physics_component(playerMesh));
  player.scene = map;

  var GRAPPLE_OFFSET = vec3_create(8, -8, 0);
  var grappleStartDelta = vec3_create();
  var grapplePositionDelta = vec3_create();

  var rayGeometry = align('nz')(boxGeom_create(2, 1, 1));
  var rayMaterial = material_create();

  vec3_set(rayMaterial.color, 0.1, 0.1, 0.1);
  vec3_set(rayMaterial.emissive, 0.9, 0.9, 1);
  var rayMesh = mesh_create(rayGeometry, rayMaterial);
  rayMesh.visible = false;
  object3d_add(map, rayMesh);

  var pointGeometry = boxGeom_create(3, 3, 3);
  var pointMaterial = material_create();
  vec3_set(pointMaterial.specular, 0.3, 0.3, 0.3);
  var pointMesh = mesh_create(pointGeometry, pointMaterial);
  pointMesh.visible = false;
  object3d_add(map, pointMesh);

  var grappleAmmo = 100;
  var grappleFireRate = grappleAmmo / 6;
  var grappleRegenRate = grappleAmmo / 8;

  var gameEl = document.querySelector('.g');
  var progressEl = document.querySelector('.p');
  progressEl.hidden = false;

  var safePositions = [
    // Beginning
    [0, 60, 0],
    // First leap
    [0, 180, -900],
    // Island
    [372, 80, -2700],
    // Tiny outcrop
    [1560, 24, -2960],
    // Play area
    [2480, 128, -1600],
    // Drop
    [5448, 80, -2112],
    // Run up end
    [5876, 200, -7200],
    // Atrium
    [8192, -144, -11800],
  ].map(([x, y, z]) => vec3_create(x, y, z));
  var lastSafeIndex = 0;
  var safePositionThreshold = 64;

  if (DEBUG) {
    Object.assign(playerMesh.position, safePositions[safePositions.length - 1]);
  }

  var checkpointGeom = geom_merge(
    compose(
      align('ny'),
      $scale({ py: [0, 1, 0] }),
    )(boxGeom_create(24, 24, 24)),
    compose(
      align('py'),
      $scale({ ny: [0, 1, 0] }),
    )(boxGeom_create(24, 24, 24)),
  );
  var checkpointMeshes = safePositions.map((position, index) => {
    var material = material_create();
    vec3_set(material.color, 0.5, 0.5, 0.5);
    vec3_set(material.emissive, 0.5, 0.5, 0.5);
    var mesh = mesh_create(checkpointGeom, material);
    Object.assign(mesh.position, position);
    mesh.position.y += 28;
    mesh.visible = index > 0;
    object3d_add(map, mesh);
    return mesh;
  });

  if (DEBUG) {
    document.addEventListener('keydown', event => {
      if (event.code === 'ShiftRight') {
        // eslint-disable-next-line no-console
        console.log(playerMesh.position);
      }
    });
  }

  var atriumBox = box3_create(
    vec3_create(7680, -260, -12312),
    vec3_create(8704, 0, -11288),
  );

  var ceilingMaterial = material_create();
  var ceilingMesh = physics_add(
    mesh_create(boxGeom_create(1024, 24, 1024), ceilingMaterial),
    BODY_STATIC,
  );
  object3d_add(map, ceilingMesh);
  vec3_set(ceilingMaterial.color, 0.5, 0.5, 0.5);
  vec3_set(ceilingMesh.position, 8192, 5120, -11800);

  entity_add(
    map,
    component_create({
      update(component, dt) {
        var bodies = physics_bodies(map);
        physics_update(bodies);

        player.dt = dt;

        player.command.forward = 0;
        player.command.right = 0;
        player.command.up = 0;
        player.command.hook = 0;

        if (keys.KeyW || keys.ArrowUp) player.command.forward++;
        if (keys.KeyS || keys.ArrowDown) player.command.forward--;
        if (keys.KeyA || keys.ArrowLeft) player.command.right--;
        if (keys.KeyD || keys.ArrowRight) player.command.right++;
        if (keys.Space) player.command.up++;
        if (keys.ShiftLeft || keys.ShiftRight) player.command.hook++;

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

        // Grappling hook
        var ray = ray_create();
        Object.assign(ray.origin, playerMesh.position);
        vec3_set(ray.direction, 0, 0, -1);
        vec3_applyQuaternion(ray.direction, camera.quaternion);

        var isGrappling = player.movementFlags & PMF_GRAPPLE;

        if (player.command.hook) {
          // Hook fire.
          if (!isGrappling) {
            var intersections = ray_intersectObjects(
              ray,
              bodies
                .map(body => body.parent)
                .filter(object => object !== playerMesh),
            );
            if (intersections.length) {
              Object.assign(player.grapplePoint, intersections[0].point);
              Object.assign(pointMesh.position, playerMesh.position);
              vec3_add(
                pointMesh.position,
                vec3_applyQuaternion(
                  Object.assign(grappleStartDelta, GRAPPLE_OFFSET),
                  camera.quaternion,
                ),
              );
              player.movementFlags |= PMF_GRAPPLE_FLY;
              playFire();
            }
          }
        } else {
          // Hook free.
          player.movementFlags &= ~PMF_GRAPPLE;
        }

        // Hook think.
        isGrappling = player.movementFlags & PMF_GRAPPLE;
        rayMesh.visible = isGrappling;
        pointMesh.visible = isGrappling;
        if (isGrappling) {
          if (player.movementFlags & PMF_GRAPPLE_FLY) {
            // Hook move.
            vec3_subVectors(
              grapplePositionDelta,
              player.grapplePoint,
              pointMesh.position,
            );
            var grappleDeltaLength = Math.min(
              vec3_length(grapplePositionDelta),
              GRAPPLE_SPEED * dt,
            );
            vec3_normalize(grapplePositionDelta);
            vec3_addScaledVector(
              pointMesh.position,
              grapplePositionDelta,
              grappleDeltaLength,
            );

            // Hook connected.
            if (!grappleDeltaLength) {
              player.movementFlags &= ~PMF_GRAPPLE_FLY;
              player.movementFlags |= PMF_GRAPPLE_PULL;
              playHit();
            }
          }

          Object.assign(rayMesh.position, playerMesh.position);
          vec3_add(
            rayMesh.position,
            vec3_applyQuaternion(
              Object.assign(grappleStartDelta, GRAPPLE_OFFSET),
              camera.quaternion,
            ),
          );
          rayMesh.scale.z = vec3_distanceTo(
            rayMesh.position,
            pointMesh.position,
          );
          object3d_lookAt(rayMesh, pointMesh.position);
        }

        grappleAmmo += isGrappling
          ? -grappleFireRate * dt
          : grappleRegenRate * dt;
        if (grappleAmmo <= 0) {
          player.movementFlags &= ~PMF_GRAPPLE;
          keys.ShiftLeft = false;
          keys.ShiftRight = false;
        }
        grappleAmmo = clamp(grappleAmmo, 0, 100);

        progressEl.style.setProperty('--p-w', `${grappleAmmo}%`);
        var opacity = mapLinear(playerMesh.position.y, -512, -1536, 1, 0);
        gameEl.style.opacity = clamp(opacity, 0, 1);

        // Safe positions
        safePositions.map((position, index) => {
          var mesh = checkpointMeshes[index];
          var hasVisited = mesh.material.emissive.y === 1;
          if (
            position &&
            vec3_distanceTo(playerMesh.position, position) <=
              safePositionThreshold
          ) {
            lastSafeIndex = index;
            mesh.material.emissive.y = 1;
            if (!hasVisited && index > 0) {
              playSuccess();
            }
          }
        });

        var isDead = playerMesh.position.y <= -2048;
        var safePosition = safePositions[lastSafeIndex];
        if (isDead && safePosition) {
          playBells();
          Object.assign(playerMesh.position, safePosition);
          grappleAmmo = 100;
        }

        // Close the box.
        if (box3_containsPoint(atriumBox, playerMesh.position)) {
          ceilingMesh.position.y -= 2048 * dt;
          ceilingMesh.position.y = Math.max(-132, ceilingMesh.position.y);
        }
      },
    }),
  );

  var fbm = fbm3d();

  var perturbVertex = (offset, scale = 1) => {
    return vertex =>
      vec3_multiplyScalar(
        vertex,
        1 +
          scale * fbm(vertex.x + offset, vertex.y + offset, vertex.z + offset),
      );
  };

  var createRockGeometry = (
    width,
    depth,
    topHeight,
    bottomHeight,
    topScale = 1,
    bottomScale = 1,
    topTransforms = [],
    bottomTransforms = [],
    fbmScale = 1,
  ) => {
    var geom = geom_merge(
      compose(
        align('ny'),
        $scale({ py: [topScale, 1, topScale] }),
        ...topTransforms,
      )(boxGeom_create(width, topHeight, depth)),
      compose(
        align('py'),
        $scale({ ny: [bottomScale, 1, bottomScale] }),
        ...bottomTransforms,
      )(boxGeom_create(width, bottomHeight, depth)),
    );

    geom.vertices.map(perturbVertex(width * Math.random(), fbmScale));
    return geom;
  };

  var createPlatformGeometry = (...args) => {
    return createRockGeometry(
      ...args,
      0.6,
      0.2,
      [],
      [defaultColors([0.8, 0.8, 0.8]), colors({ ny: [0.3, 0.2, 0.2] })],
    );
  };

  var towerColor = [0.6, 0.6, 0.6];

  var topTowerTransforms = [defaultColors(towerColor)];
  var bottomTowerTransforms = [
    defaultColors(towerColor),
    colors({ ny: [0.3, 0.2, 0.2] }),
  ];

  var createRockMesh = (geom, material, position) => {
    var mesh = physics_add(mesh_create(geom, material), BODY_STATIC);
    vec3_fromArray(mesh.position, position);
    object3d_add(map, mesh);
  };

  // Platforms
  [
    [createPlatformGeometry(128, 128, 16, 32), [-64, 16, -320]],
    [createPlatformGeometry(128, 128, 16, 32), [-32, 48, -512]],
    [createPlatformGeometry(128, 128, 16, 32), [0, 80, -704]],
    [createPlatformGeometry(128, 128, 16, 32), [0, 120, -920]],
    [createPlatformGeometry(192, 400, 16, 32), [-256, -72, -1536]],
    [createPlatformGeometry(512, 192, 24, 32), [360, 16, -2700]],
    [createPlatformGeometry(128, 128, 12, 32), [960, -64, -2800]],
    [createPlatformGeometry(128, 128, 12, 24), [1560, -24, -2950]],
    // Long rest path
    [createPlatformGeometry(192, 1024, 40, 128), [1920, 116, -2160]],
    // Play area
    [createPlatformGeometry(768, 512, 32, 128), [2496, 64, -1600]],
    // Tower climb resting
    [createPlatformGeometry(256, 256, 16, 32), [4672, 160, -1984]],
    // Drop
    [createPlatformGeometry(128, 128, 16, 32), [4864, 128, -2016]],
    [createPlatformGeometry(128, 128, 16, 32), [5056, 96, -2048]],
    [createPlatformGeometry(128, 128, 16, 32), [5248, 64, -2080]],
    [createPlatformGeometry(128, 128, 16, 32), [5448, 24, -2112]],
    // Run up
    [createPlatformGeometry(256, 1024, 24, 32), [5704, -128, -2784]],
    // Run up land
    [createPlatformGeometry(512, 512, 24, 32), [5876, 128, -7200]],
    // // Ramp rest
    [createPlatformGeometry(360, 360, 16, 32), [6912, 128, -11456]],
  ].map(([geom, position]) => {
    var material = material_create();
    vec3_set(material.color, 0.5, randFloat(0.7, 0.8), 0.5);
    createRockMesh(geom, material, position);
  });

  var createTowerGeometry = (...args) =>
    createRockGeometry(
      ...args,
      randFloat(0.8, 0.9),
      randFloat(0.4, 0.6),
      topTowerTransforms,
      bottomTowerTransforms,
      0.2,
    );

  // Towers and rocks
  [
    [createTowerGeometry(240, 480, 40, 480), [0, -24, 0]],
    // Towers
    [createTowerGeometry(384, 384, 384, 640), [-480, 170, -1536]],
    [createTowerGeometry(384, 384, 384, 680), [480, 130, -2048]],
    [createTowerGeometry(384, 384, 384, 480), [-480, 130, -2560]],
    [createTowerGeometry(768, 320, 1536, 512), [384, 256, -3072]],
    [createTowerGeometry(256, 300, 240, 128), [1440, 320, -2900]],
    [createTowerGeometry(256, 300, 240, 128), [1440, 320, -2960]],
    [createTowerGeometry(256, 300, 240, 320), [1920, 320, -3200]],
    [createTowerGeometry(240, 270, 240, 360), [2240, 272, -2800]],
    [createTowerGeometry(256, 192, 240, 360), [2240, 128, -2240]],
    // After play area tower climb
    [createTowerGeometry(256, 192, 240, 360), [3072, 0, -1440]],
    [createTowerGeometry(256, 256, 256, 360), [3584, 128, -1952]],
    [createTowerGeometry(256, 256, 320, 240), [4096, 256, -1664]],
    [createTowerGeometry(160, 160, 208, 400), [4672, 448, -1984]],
    // Run up boost
    [createTowerGeometry(480, 480, 64, 128), [5768, 1600, -4032]],
    // Run up sides
    [createTowerGeometry(128, 256, 320, 480), [5448, 1472, -4928]],
    [createTowerGeometry(128, 384, 320, 240), [6088, 1536, -5888]],
    // Run up block
    [createTowerGeometry(640, 128, 800, 512), [5768, 768, -6592]],
    // Ramp
    [createTowerGeometry(256, 256, 640, 512), [6400, 0, -10496]],
    [createTowerGeometry(224, 224, 768, 576), [6912, 512, -11456]],
  ].map(([geom, position]) => {
    var material = material_create();
    vec3_set(material.color, 0.5, 0.5, 0.5);
    createRockMesh(geom, material, position);
  });

  // Floors and walls
  [
    // Play area boxes
    [[256, 64, 64], [2508, 96, -1500]],
    [[64, 56, 320], [2240, 96, -1600]],
    // Walkway
    [[128, 128, 2048], [5920, -320, -8736]],
    // Atrium
    [[1024, 8, 1024], [8192, -260, -11800]],
    // Walls
    [[1024, 128, 32], [8192, -192, -12312]],
    [[1024, 128, 32], [8192, -192, -11288]],
    [[32, 128, 1024], [7680, -192, -11800]],
    [[32, 128, 1024], [8704, -192, -11800]],
    // Block thing
    [[256, 64, 256], [7936, -256, -12088]],
  ].map(([dimensions, position]) => {
    var material = material_create();
    var mesh = physics_add(
      mesh_create(boxGeom_create(...dimensions), material),
      BODY_STATIC,
    );
    vec3_set(material.color, 0.5, 0.5, 0.5);
    vec3_fromArray(mesh.position, position);
    object3d_add(map, mesh);
  });

  return {
    ambient,
    directional: directionalLights,
  };
};
