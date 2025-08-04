// Initialize SpaceKit
const viz = new Spacekit.Simulation(document.getElementById('main-container'), {
     basePath: 'https://typpo.github.io/spacekit/src',
     camera: { distance: 1 },
     unitsPerAu: 50,
   });
   
   // Add realistic star field
   viz.createStars();
   
   // Get scene, renderer, and main camera (overview)
   const scene = viz.getScene();
   const renderer = viz.getRenderer();
   const mainCamera = viz.getCamera();
   
   // === Add your tracker camera ===
   const trackerCamera = new THREE.PerspectiveCamera(40, 1, 0.01, 10);
   trackerCamera.position.set(0, 0, 0);
   
   // Create a “body” object to rotate the camera
   const trackerBody = new THREE.Object3D();
   trackerBody.add(trackerCamera);
   scene.add(trackerBody);
   
   // Add a frustum helper to show FOV
   const helper = new THREE.CameraHelper(trackerCamera);
   scene.add(helper);
   
   // Optional: add a target star to focus on
   const target = new THREE.Mesh(
     new THREE.SphereGeometry(0.02, 16, 16),
     new THREE.MeshBasicMaterial({ color: 0xffff00 })
   );
   target.position.set(0, 0, -1);
   trackerBody.add(target);
   
   // === Animate camera body rotation ===
   viz.onTick(() => {
     trackerBody.rotation.y += 0.003;
     trackerBody.rotation.x += 0.0015;
     helper.update();
   });
   
   // === Split view: override render loop ===
   viz.setRenderFunction(() => {
     const width = window.innerWidth;
     const height = window.innerHeight;
   
     renderer.setScissorTest(true);
   
     // LEFT: overview with pan/tilt support (SpaceKit camera)
     renderer.setViewport(0, 0, width / 2, height);
     renderer.setScissor(0, 0, width / 2, height);
     renderer.render(scene, mainCamera);
   
     // RIGHT: what the tracker camera sees
     renderer.setViewport(width / 2, 0, width / 2, height);
     renderer.setScissor(width / 2, 0, width / 2, height);
     renderer.render(scene, trackerCamera);
   
     renderer.setScissorTest(false);
   });
   