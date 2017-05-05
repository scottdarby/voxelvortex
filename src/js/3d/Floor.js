"use strict";

// libs
import * as THREE from 'three';
var glslify = require('glslify');

// core
import Config from '../Config';

export default class Floor {

    constructor(scene) {
        this.scene = scene;
    }

    create() {

        this.geometry = new THREE.PlaneGeometry(100000, 100000, 1, 1);

        let shaderSource = THREE.ShaderLib['phong'];
        let uniforms = THREE.UniformsUtils.clone(shaderSource.uniforms)
        uniforms.diffuse = {
            type: 'v3',
            value: new THREE.Vector3(0, 0, 0),
        }
        uniforms.specular = {
            type: 'v3',
            value: new THREE.Vector3(3/255, 26/255, 45/255),
        }
        uniforms.shininess = {
            type: 'f',
            value: 2.0,
        }
        uniforms.uTime = {
            type: 'f',
            value: 0.0
        }
        uniforms.uAmp = {
            type: 'f',
            value: 0.0
        }

        this.floorMaterial = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: glslify('../glsl/floor.vert'),
            fragmentShader: glslify('../glsl/floor.frag'),
            shading: THREE.SmoothShading,
            lights: true,
            fog: true,
        });

        this.mesh = new THREE.Mesh(this.geometry, this.floorMaterial);

        this.mesh.position.y = -2500;
        this.mesh.rotation.x = -Math.PI / 2;

        if (Config.scene.shadowsOn) {
            this.mesh.receiveShadow = true;
        }

        this.scene.add(this.mesh);

    }

}
