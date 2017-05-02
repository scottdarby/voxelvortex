"use strict";

// libs
import * as THREE from 'three';
import Tone from './helpers/TonePanner3D';
import TWEEN from 'tween.js';
var glslify = require('glslify');
import OrbitContructor from 'three-orbit-controls';
var OrbitControls = OrbitContructor(THREE);
import Stats from 'stats.js';
import StartAudioContext from 'StartAudioContext';

// 3d
import Cubes from './3d/Cubes';
import Floor from './3d/Floor';

// core
import Config from './Config';

export default class Scene {

    constructor() {

		let that = this;

		this.initSound().then((player) => {

			document.querySelector('#loading').classList.toggle('hide');
			document.querySelector('#loaded').classList.toggle('hide');

	        document.querySelector('#start').addEventListener('click', function(){
	            document.querySelector('.container').classList.toggle('hide');
	            document.querySelector('.footer').classList.toggle('hide');
	            that.start();
	        });

	        document.querySelector('#start-medium').addEventListener('click', function(){
	            Config.scene.antialias = false;
	            Config.scene.shadowsOn = false;
	            Config.cubes.count = 100000;
	            document.querySelector('.container').classList.toggle('hide');
	            document.querySelector('.footer').classList.toggle('hide');
	            that.start();
	        });

	        document.querySelector('#start-mobile').addEventListener('click', function(){
	            Config.scene.antialias = false;
	            Config.scene.shadowsOn = false;
	            Config.camera.animate = true;
	            Config.cubes.count = 80000;
	            document.querySelector('.container').classList.toggle('hide');
	            document.querySelector('.footer').classList.toggle('hide');
	            that.start();
	        });

			StartAudioContext(player.context, "#start-mobile");

		});

    }

	initSound() {

		return new Promise((resolve, reject) => {

			this.stereoRefDistance = 600;

			// set up effects
	        this.mono = new Tone.Mono();
	        this.lowPass = new Tone.Filter(2000, 'lowpass');
	        this.highPass = new Tone.Filter(2000, 'highpass');
			this.vol = new Tone.Volume(-12);
			this.volMono = new Tone.Volume(-1);

			// route audio to effects
	        this.pannerStereo = new Tone.Panner3D().chain(this.vol, Tone.Master);
	        this.pannerStereo.refDistance = this.stereoRefDistance;
	        this.pannerStereo.rolloffFactor = 30;

	        this.pannerStereoLowPass = new Tone.Panner3D().chain(this.lowPass, this.vol, Tone.Master);
	        this.pannerStereoLowPass.refDistance = this.stereoRefDistance;
	        this.pannerStereoLowPass.rolloffFactor = 30;

	        this.pannerStereoHighPass = new Tone.Panner3D().chain(this.highPass, this.vol, Tone.Master);
	        this.pannerStereoHighPass.refDistance = this.stereoRefDistance;
	        this.pannerStereoHighPass.rolloffFactor = 30;

	        this.pannerMono = new Tone.Panner3D().chain(this.mono, this.volMono, Tone.Master);
	        this.pannerMono.refDistance = 2000;
	        this.pannerMono.rolloffFactor = 1;

			// number of frequency band to analyse
	        this.numFreqBands = 128;

	        this.fft = new Tone.Analyser("fft", this.numFreqBands);
	        this.fft.smoothing = 0.1;

	        this.meter = new Tone.Meter("level");
	        this.meter.smoothing = 0.1;

	        this.audioTrack = new Tone.Player({
	            url : "./audio/vortex.mp3",
	            loop: true,
				onload: function(player){
					resolve(player);
				}
	        })
	        .fan(this.pannerMono)
	        .fan(this.pannerStereo)
	        .fan(this.pannerStereoLowPass)
	        .fan(this.pannerStereoHighPass)
	        .fan(this.fft)
	        .fan(this.meter)
	        .sync().start(0);

		});

	}

    start() {

        this.stats = new Stats();
        //document.body.appendChild(this.stats.dom);

        this.camera;
        this.scene;
        this.renderer;
        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;

        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(Config.scene.bgColor, 0.0002);

        this.startingPos = {x: 11.0, y: -10.0, z: 1600.0};

        this.camera = new THREE.PerspectiveCamera(Config.camera.fov, window.innerWidth / window.innerHeight, 1, 30000);
        this.camera.position.set(this.startingPos.x, this.startingPos.y, this.startingPos.z);
        this.camera.updateMatrixWorld();
        this.camera.lookAt(this.scene.position);

		// sound dummy objects
        let soundDummyGeometry = new THREE.BoxGeometry( 1, 1, 1 );
        let material = new THREE.MeshBasicMaterial( {transparent: true, opacity: 0.0} );

        this.soundDummyMesh = new THREE.Mesh( soundDummyGeometry, material );
        this.scene.add(this.soundDummyMesh);
        this.soundDummyMesh.position.set(0.0, 0.0, 0.0);

        this.soundDummyMeshLow = new THREE.Mesh( soundDummyGeometry, material );
        this.scene.add(this.soundDummyMeshLow);
        this.soundDummyMeshLow.position.set(0.0, -800.0, 0.0);

        this.soundDummyMeshHigh = new THREE.Mesh( soundDummyGeometry, material );
        this.scene.add(this.soundDummyMeshHigh);
        this.soundDummyMeshHigh.position.set(0.0, 800.0, 0.0);

		// init renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: Config.scene.antialias
        });

        this.renderer.setClearColor(Config.scene.bgColor);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.autoClear = false;
        this.renderer.sortObjects = false;
        document.body.appendChild(this.renderer.domElement);

        if (Config.scene.shadowsOn) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.shadowMap.soft = true;
        }

        // controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.minDistance = 0;
        this.controls.maxDistance = 3500;

		// update tone js listener position on camera move
		let that = this;
		this.controls.addEventListener("change", function(){
			Tone.Listener.updatePosition(that.camera);
		});
		Tone.Listener.updatePosition(this.camera);

        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        this.onWindowResize();

        this.addLights();
        this.addObjects();
        this.addSoundEvents();

		// animate camera movement?
		if (Config.camera.animate) {
        	this.cameraPath();
		}

        this.animate();

    }

    cameraPath() {

        this.keyFrames = [
            {
                // top
                endPostion: {x: 0.00018859215792802603, y: 1500.069061008756, z: 0.0015889159820352994},
                lookAt: {x: 0.0, y: 0.0, z: 0.0},
                duration: 30000
            },
            {
                // front
                endPostion: this.startingPos,
                lookAt: {x: 0.0, y: 0.0, z: 0.0},
                duration: 20000
            },
            {
                // bottom
                endPostion: {x: -1.8612775309937888, y: -2217.744598647205, z: 927.9460349485214},
                lookAt: {x: 0.0, y: -400.0, z: 0.0},
                duration: 20000
            },
            {
                // front
                endPostion: this.startingPos,
                lookAt: {x: 0.0, y: 0.0, z: 0.0},
                duration: 20000
            },
            {
                // inside down
                endPostion: {x: -206.52301178333693, y: 692.4916988501099, z: 1246.8844256078478},
                lookAt: {x: -0.2129994570341797, y: -0.5967888278233401, z: -0.7736112242518124},
                duration: 30000
            },
            {
                // inside up
                endPostion: {x: 309.51104227838596, y: -1058.2529779091565, z: -192.21440434739702},
                lookAt: {x: -0.18236665353450238, y: 0.9661928720881703, z: -0.18224636513423087},
                duration: 30000
            },

        ];

        this.moveCamera(
            0,
            null,
            this.keyFrames[0].endPostion,
            this.keyFrames[0].lookAt,
            this.keyFrames[0].duration,
        );

    }

    moveCamera(keyframe, from, to, lookAt, duration, easing) {

        let that = this;

        if (from == null) {
            from = this.camera.position;
        }

        if (easing == null) {
            easing = TWEEN.Easing.Quartic.InOut;
        }

        let fromPosition = new THREE.Vector3().copy(this.camera.position);
        let fromRotation = new THREE.Euler().copy(this.camera.rotation);

        // set final postion and grab final rotation
        this.camera.position.set(to.x, to.y, to.z);
        this.camera.lookAt(lookAt);
        let toRotation = new THREE.Euler().copy(this.camera.rotation);

        // reset original position and rotation
        this.camera.position.set(fromPosition.x, fromPosition.y, fromPosition.z);
        this.camera.rotation.set(fromRotation.x, fromRotation.y, fromRotation.z);

        // position
        new TWEEN.Tween(from)
            .to(to, duration)
            .onUpdate(function() {
                that.camera.position.set(this.x, this.y, this.z);
            })
            .easing(easing)
            .start();

        // rotate with slerp
        let fromQuaternion = new THREE.Quaternion().copy(this.camera.quaternion);
        let toQuaternion = new THREE.Quaternion().setFromEuler(toRotation);
        let moveQuaternion = new THREE.Quaternion();
        this.camera.quaternion.set(moveQuaternion);

        let o = {t: 0};
        return new TWEEN.Tween(o)
            .to({t: 1}, duration)
            .onUpdate(function() {
                THREE.Quaternion.slerp(fromQuaternion, toQuaternion, moveQuaternion, o.t);
                that.camera.quaternion.set(moveQuaternion.x, moveQuaternion.y, moveQuaternion.z, moveQuaternion.w);
            })
            .easing(easing)
            .onComplete(function(){

                let nextKeyFrame = keyframe + 1;

                if (typeof that.keyFrames[nextKeyFrame] == 'undefined') {
                    nextKeyFrame = 0;
                }

                that.moveCamera(
                    nextKeyFrame,
                    null,
                    that.keyFrames[nextKeyFrame].endPostion,
                    that.keyFrames[nextKeyFrame].lookAt,
                    that.keyFrames[nextKeyFrame].duration,
                    that.keyFrames[nextKeyFrame].easing,
                );

            })
            .start();

    }

    addSoundEvents() {

		Tone.Transport.start();

    }

    addLights() {

		// add lights
		this.hemispherLight = new THREE.HemisphereLight(0x224466, 0, 0.7);
		this.scene.add(this.hemispherLight);

		this.directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
		this.directionalLight.position.set(0, 2500, 0);
		this.directionalLight.target.position.set(0, 0, 0);

		if (Config.scene.shadowsOn) {
			this.directionalLight.castShadow = true;
			this.directionalLight.shadow.mapSize.width = 2048;
			this.directionalLight.shadow.mapSize.height = 2048;
			this.directionalLight.shadow.camera.near = 0;
			this.directionalLight.shadow.camera.far = 6000;
		}

		//let directionalLightHelper = new THREE.DirectionalLightHelper(this.directionalLight);
		//this.scene.add( directionalLightHelper);

		var d = 5000;
		this.directionalLight.shadow.camera.left = -d;
		this.directionalLight.shadow.camera.right = d;
		this.directionalLight.shadow.camera.top = d;
		this.directionalLight.shadow.camera.bottom = -d;
		this.directionalLight.shadow.camera.updateProjectionMatrix();
		this.directionalLight.shadow.shadowBias = -0.001;
		this.scene.add(this.directionalLight);

		this.spotLight = new THREE.SpotLight(0xfff6bc, 0.7);
		this.spotLight.position.set(0, 2500, 0);
		this.spotLight.target.position.set(0, 0, 0);

		this.spotLight.castShadow = false;
		this.spotLight.angle = Math.PI / 2;
		this.spotLight.penumbra = 0.2;
		this.spotLight.decay = 0;
		this.spotLight.distance = 6000;

		this.scene.add(this.spotLight);

	}

    addObjects() {

        // add 3d objects
        this.cubes = new Cubes(this.scene);
        this.cubes.create();

        this.floor = new Floor(this.scene);
        this.floor.create();

    }

	// resize renderer on window resize
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {

        requestAnimationFrame(this.animate.bind(this));
        this.render();
    }

	// main animation loop
    render() {

        this.stats.begin();

        this.time = (this.clock.getElapsedTime() * 10.0) + 600.0;

        let delta = this.clock.getDelta();

        TWEEN.update();

        // update refDistance as shape grows
        this.stereoRefDistance = Math.min(2000, this.time);
        this.pannerStereo.refDistance = this.stereoRefDistance;
        this.pannerStereoLowPass.refDistance = this.stereoRefDistance;
        this.pannerStereoHighPass.refDistance = this.stereoRefDistance;

        let fftValues = this.fft.analyse();

        // control bass frequencies
        fftValues[0] *= 0.4;
        fftValues[1] *= 0.5;
        fftValues[2] *= 0.6;
        fftValues[3] *= 0.7;
        fftValues[4] *= 0.8;
        fftValues[5] *= 0.9;

        this.numFreqBands = 32; // we only care about 32 bands but sample more than this so the lower range has higher fidelity

        let fftBandsTexture = new THREE.DataTexture( fftValues, this.numFreqBands/4, 1, THREE.RGBAFormat );
        fftBandsTexture.needsUpdate = true;

        this.cubes.mesh.material.uniforms.delta.value = delta;
        this.cubes.mesh.customDepthMaterial.uniforms.delta.value = delta;

        this.cubes.mesh.material.uniforms.fftBands.value = fftBandsTexture;
        this.cubes.mesh.customDepthMaterial.uniforms.fftBands.value = fftBandsTexture;

        this.cubes.mesh.material.uniforms.time.value = this.time;
        this.cubes.mesh.customDepthMaterial.uniforms.time.value = this.time;

        this.cubes.mesh.material.uniforms.frequency.value = this.time + 0.0 * 0.000005;
        this.cubes.mesh.customDepthMaterial.uniforms.frequency.value = this.time + 0.0 * 0.000005;

        this.cubes.mesh.material.uniforms.amp.value = this.meter.value;
        this.cubes.mesh.customDepthMaterial.uniforms.amp.value = this.meter.value;

        //this.renderer.clear();

        this.stats.end();

        this.renderer.render(this.scene, this.camera);

        this.controls.update();

        this.pannerStereo.updatePosition(this.soundDummyMesh);
        this.pannerMono.updatePosition(this.soundDummyMesh);
        this.pannerStereoLowPass.updatePosition(this.soundDummyMeshLow);
        this.pannerStereoHighPass.updatePosition(this.soundDummyMeshHigh);

    }
}
