import './style.css'
import * as THREE from 'three';
import { DeviceOrientationControls } from 'three/examples/jsm/controls/DeviceOrientationControls.js';
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";


document.querySelector('#app').innerHTML = `
  <button id="start">Start 360°</button>
  <div id="counter"></div>
`
const scene    = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera   = new THREE.PerspectiveCamera(
  75, window.innerWidth/window.innerHeight, 0.1, 1000
);
camera.rotation.reorder('YXZ');

camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

// CUBE + LIGHT
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(2,2,2),
  new THREE.MeshBasicMaterial({ color: 0xffffff })
);
scene.add(cube);
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5,5,5);
scene.add(light);

// CONTROLS (no animate() here)
const controls = new DeviceOrientationControls(camera);
new RGBELoader().load("/wasteland_clouds_puresky_4k.hdr", (BGhdr) => {
  BGhdr.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = BGhdr;
  scene.environment = BGhdr;

});
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

async function initControls() {
  // ────────────────
  // 1️⃣ Chrome + Edge: force the "Allow motion sensors?" prompt
  if ('AbsoluteOrientationSensor' in window) {
    try {
      const sensor = new AbsoluteOrientationSensor({ frequency: 60 });
      sensor.addEventListener('reading', () => {
        // once we get any data, stop the sensor
        sensor.stop();
      });
      sensor.addEventListener('error', (e) => {
        // ignore the normal NotReadableError, warn only on others
        if (e.error.name !== 'NotReadableError') {
          console.warn('Sensor error:', e.error.name);
        }
      });
      sensor.start();  // ⚡️ triggers the prompt, but won't throw
    } catch (err) {
      // if .start() itself is disallowed, just ignore
      console.warn('Sensor API start failed:', err.name || err);
    }
  }

  // ────────────────
  // 2️⃣ iOS Safari: explicit permission API
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    try {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res !== 'granted') {
        alert('Motion permission denied');
        return;
      }
    } catch (err) {
      console.error('DeviceOrientationEvent.requestPermission failed', err);
      return;
    }
  }

  // ────────────────
  // 3️⃣ Finally: connect controls and start animation
  controls.connect();
  animate();
}



// START BUTTON
document.getElementById('start')
  .addEventListener('click', e => {
    e.target.remove();
    initControls();
  });

// HANDLE RESIZE
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});



window.addEventListener('deviceorientation', (e) => {
  console.log('alpha:', e.alpha, 'beta:', e.beta, 'gamma:', e.gamma);
  document.getElementById('counter').innerHTML = `alpha: ${e.alpha}, beta: ${e.beta}, gamma: ${e.gamma}`
});