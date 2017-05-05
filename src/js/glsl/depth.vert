#define DEPTH_PACKING 3201

attribute float id;
attribute vec3 scale;
attribute vec3 offset;
uniform float time;
uniform float timeOffset;
uniform float frequency;
uniform float amp;
uniform sampler2D fftBands;
uniform float explode;
uniform float explodeTime;
uniform float contract;
uniform float contractTime;

varying vec3 finalDest;
varying vec3 vOffset;
varying float distanceFromCenter;

varying float reachedDest;

#pragma glslify: rotationMatrix = require('./helpers/rotation.glsl')
#pragma glslify: structureBuilder = require('./helpers/structureBuilder.glsl')
#pragma glslify: rotationController = require('./helpers/rotationController.glsl')

#include <common>
void main() {
  #include <begin_vertex>

  transformed = structureBuilder(
      offset,
      time,
      timeOffset,
      id,
      finalDest,
      fftBands,
      scale,
      frequency,
      amp,
      transformed,
      vOffset,
      explode,
      explodeTime,
      contract,
      contractTime,
      position,
      reachedDest,
      distanceFromCenter
  );

  vec4 newPos = rotationController(
      time,
      modelViewMatrix,
      vOffset,
      amp,
      id,
      transformed
  );

  #include <project_vertex>


  	gl_Position = projectionMatrix * newPos;
}
