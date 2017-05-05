#define PHYSICAL

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

varying vec3 vViewPosition;

varying float reachedDest;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

#pragma glslify: rotationMatrix = require('./helpers/rotation.glsl')
#pragma glslify: structureBuilder = require('./helpers/structureBuilder.glsl')
#pragma glslify: rotationController = require('./helpers/rotationController.glsl')

void main() {

	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED

	vNormal = normalize( transformedNormal );

#endif

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

	#include <displacementmap_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

	mvPosition = rotationController(
		time,
	    modelViewMatrix,
	    vOffset,
	    amp,
	    id,
	    transformed
	);

	gl_Position = projectionMatrix * mvPosition;

}
