"use strict";

// libs
import * as THREE from 'three';
var glslify = require('glslify');

// core
import Config from '../Config';

export default class Cubes {

    constructor(scene) {

        this.scene = scene;

        // how many cubes?
        this.instances = Config.cubes.count;

    }

    create() {

        let geometry = new THREE.InstancedBufferGeometry();

        let vertices = new THREE.BufferAttribute(new Float32Array([
            // Front
            -1, 1, 1,
            1, 1, 1,
            -1, -1, 1,
            1, -1, 1,
            // Back
            1, 1, -1,
            -1, 1, -1,
            1, -1, -1,
            -1, -1, -1,
            // Left
            -1, 1, -1,
            -1, 1, 1,
            -1, -1, -1,
            -1, -1, 1,
            // Right
            1, 1, 1,
            1, 1, -1,
            1, -1, 1,
            1, -1, -1,
            // Top
            -1, 1, 1,
            1, 1, 1,
            -1, 1, -1,
            1, 1, -1,
            // Bottom
            1, -1, 1,
            -1, -1, 1,
            1, -1, -1,
            -1, -1, -1
        ]), 3);

        geometry.addAttribute('position', vertices);
        let uvs = new THREE.BufferAttribute(new Float32Array([
            // Front
            0, 0,
            1, 0,
            0, 1,
            1, 1,
            // Back
            1, 0,
            0, 0,
            1, 1,
            0, 1,
            // Left
            1, 1,
            1, 0,
            0, 1,
            0, 0,
            // Right
            1, 0,
            1, 1,
            0, 0,
            0, 1,
            // Top
            0, 0,
            1, 0,
            0, 1,
            1, 1,
            // Bottom
            1, 0,
            0, 0,
            1, 1,
            0, 1
        ]), 2);
        geometry.addAttribute('uv', uvs);
        let indices = new Uint16Array([
            0, 1, 2,
            2, 1, 3,
            4, 5, 6,
            6, 5, 7,
            8, 9, 10,
            10, 9, 11,
            12, 13, 14,
            14, 13, 15,
            16, 17, 18,
            18, 17, 19,
            20, 21, 22,
            22, 21, 23
        ]);
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        // per instance data
        let indexes = new THREE.InstancedBufferAttribute(new Float32Array(this.instances), 1, 1);
        for (let i = 0, l = indexes.count; i < l; i++) {
            indexes.setXYZ(i, i);
        }
        geometry.addAttribute('id', indexes);

        let offsets = new THREE.InstancedBufferAttribute(new Float32Array(this.instances * 3), 3, 1);
        let scales = new THREE.InstancedBufferAttribute(new Float32Array(this.instances * 3), 3, 1);
        let vector = new THREE.Vector4();

        // add random offset position
        offsets = new THREE.InstancedBufferAttribute(new Float32Array(this.instances * 3), 3, 1);
        for (let i = 0, ul = offsets.count; i < ul; i++) {
            let x = 0.0;
            let y = 0.0;
            let z = 0.0;
            offsets.setXYZ(i, x, y, z);
        }
        geometry.addAttribute('offset', offsets);

        for (let i = 0, ul = scales.count; i < ul; i++) {

            let highest = Math.sin(i/1000) * 20;

            let x = highest;
            let y = highest;
            let z = highest;

            scales.setXYZ(i, x, y, z);
        }
        geometry.addAttribute('scale', scales);

        let shaderSource = THREE.ShaderLib['standard'];
        let uniforms = THREE.UniformsUtils.clone(shaderSource.uniforms)
        uniforms.time = {
            type: 'f',
            value: 0,
        }
        uniforms.timeOffset = {
            type: 'f',
            value: 1.0,
        }
        uniforms.fftBands = {
            type: 't',
        }
        uniforms.frequency = {
            type: 'f',
            value: 1.0,
        }
        uniforms.delta = {
            type: 'f',
            value: 1.0,
        }
        uniforms.amp = {
            type: 'f',
            value: 1.0,
        }
        uniforms.metalness = {
            type: 'f',
            value: 1.0,
        }
        uniforms.roughness = {
            type: 'f',
            value: 0.5,
        }
        uniforms.diffuse = {
            type: 'v3',
            value: new THREE.Vector3(33/255, 148/255, 206/255),
        }
        uniforms.emissive = {
            type: 'v3',
            value: new THREE.Vector3(0, 80/255, 100/255),
        }
        uniforms.explode = {
            type: 'f',
            value: 0.0,
        }
        uniforms.explodeTime = {
            type: 'f',
            value: 0.0,
        }
        uniforms.contract = {
            type: 'f',
            value: 0.0,
        }
        uniforms.contractTime = {
            type: 'f',
            value: 0.0,
        }

        this.materialScene = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: glslify('../glsl/cube.vert'),
            fragmentShader: glslify('../glsl/cube.frag'),
            shading: THREE.FlatShading,
            side: THREE.DoubleSide,
            lights: true,
            fog: true,
            skinning: false,
            transparent: true,
        });

        this.mesh = new THREE.Mesh(geometry, this.materialScene);

        if (Config.scene.shadowsOn) {
            this.mesh.frustumCulled = false;
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = true;
        }

        this.scene.add(this.mesh);

        let depthMaterial = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: glslify('../glsl/depth.vert'),
            fragmentShader: glslify('../glsl/depth.frag'),
        });

        this.mesh.customDepthMaterial = depthMaterial;

    }


}
