/* LEPAK — Reviews stage: procedural bamboo whisk (chasen) in clay material.
   three.js r160, scroll-driven rotation with hand-rolled spring physics. */
(function () {
  'use strict';
  if (window.matchMedia('(max-width: 809px)').matches) return;           // hidden on phone
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function init() {
    if (!window.THREE) return;
    var canvas = document.getElementById('whiskCanvas');
    if (!canvas) return;
    var stage = canvas.parentElement;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, failIfMajorPerformanceCaveat: true });
    } catch (e) { return; }   // software GL: skip the whisk entirely
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    var scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 3));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 2));

    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0, 10);

    var clay = new THREE.MeshStandardMaterial({ color: 0x4d7d5c, roughness: 1, metalness: 0 });

    /* ---- build the chasen ---- */
    var whisk = new THREE.Group();

    var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 2.6, 24), clay);
    handle.position.y = -1.9;
    whisk.add(handle);

    var collar = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.09, 12, 32), clay);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = -0.62;
    whisk.add(collar);

    function tine(startR, midR, tipR, height, lean, thickness) {
      // curve: rises from collar, bows outward, curls inward at the tip
      var curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(startR, -0.55, 0),
        new THREE.Vector3(midR, height * 0.35, 0),
        new THREE.Vector3(midR * 1.05, height * 0.8, 0),
        new THREE.Vector3(tipR, height, 0)
      );
      var geo = new THREE.TubeGeometry(curve, 14, thickness, 6, false);
      var m = new THREE.Mesh(geo, clay);
      m.rotation.y = lean;
      return m;
    }

    var i, n;
    var OUTER = 30, INNER = 14;
    for (i = 0; i < OUTER; i++) {
      n = tine(0.36, 1.45, 0.55, 2.15, (i / OUTER) * Math.PI * 2, 0.045);
      whisk.add(n);
    }
    for (i = 0; i < INNER; i++) {
      n = tine(0.28, 0.55, 0.18, 1.7, (i / INNER) * Math.PI * 2 + 0.2, 0.04);
      whisk.add(n);
    }

    var group = new THREE.Group();
    group.add(whisk);
    whisk.position.y = 0.55;
    group.scale.setScalar(1.12);
    group.rotation.z = THREE.MathUtils.degToRad(20);   // fixed tilt
    scene.add(group);

    /* ---- sizing ---- */
    function resize() {
      var w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    new ResizeObserver(resize).observe(stage);

    /* ---- scroll spring rotation ---- */
    var SENS = 0.05, TENSION = 0.052, FRICTION = 0.5;
    var rot = { x: 0, y: 0 }, vel = { x: 0, y: 0 }, target = { x: 0, y: 0 };
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      target.y = y * SENS * Math.PI / 180;
      target.x = y * SENS * 0.5 * Math.PI / 180;
    }, { passive: true });

    var inView = false;
    new IntersectionObserver(function (e) { inView = e[0].isIntersecting; }).observe(stage);

    var needsFirst = true;
    (function loop() {
      if (inView) {
        vel.x += TENSION * (target.x - rot.x); vel.x -= FRICTION * vel.x; rot.x += vel.x;
        vel.y += TENSION * (target.y - rot.y); vel.y -= FRICTION * vel.y; rot.y += vel.y;
        var moving = Math.abs(vel.x) + Math.abs(vel.y) +
                     Math.abs(target.x - rot.x) + Math.abs(target.y - rot.y) > 0.0004;
        if (moving || needsFirst) {
          needsFirst = false;
          group.rotation.x = rot.x;
          group.rotation.y = rot.y;
          renderer.render(scene, camera);
        }
      }
      requestAnimationFrame(loop);
    })();
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
