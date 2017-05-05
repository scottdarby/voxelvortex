#define PHONG

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
uniform float uTime;
uniform float uAmp;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

#pragma glslify: random = require('./helpers/random.glsl')

float getGlow( sampler2D shadowMap, vec2 shadowMapSize, vec4 shadowCoord ) {

	shadowCoord.xyz /= shadowCoord.w;

	bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
	bool inFrustum = all( inFrustumVec );

	bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );

	bool frustumTest = all( frustumTestVec );

	if ( frustumTest ) {

		// horizontal blur
		vec4 texture = vec4(0.0);
		float width = 1.0 / shadowMapSize.x;
		float divisor = 0.0;
        float weight = 0.0;
		for (float x = -20.0; x <= 20.0; x++) {
			vec4 pass = texture2D(shadowMap, ((shadowCoord.xy + (random(vec2(shadowCoord.x + uTime, shadowCoord.y + uTime)) * 0.01)) + vec2(x * width, 0.0)));
			weight = 500.0;
            texture += pass * weight;
			divisor += weight;
		}
		float blurH = texture.r / divisor;

		// vertical blur
		vec4 texture2 = vec4(0.0);
		float height = 1.0 / shadowMapSize.y;
		float divisor2 = 0.0;
        float weight2 = 0.0;
        for (float y = -20.0; y <= 20.0; y++) {
			vec4 pass = texture2D(shadowMap, ((shadowCoord.xy + (random(vec2(shadowCoord.x + uTime, shadowCoord.y + uTime)) * 0.01)) + vec2(0.0, y * height)));
			weight2 = 500.0;
        	texture2 += pass * weight2;
			divisor2 += weight2;
		}
		float blurV = texture2.r / divisor2;

		return blurH * blurV;

	}

	return 1.0;

}

void main() {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_flip>
	#include <normal_fragment>
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_phong_fragment>


//	#include <lights_template>
	GeometricContext geometry;

	geometry.position = - vViewPosition;
	geometry.normal = normal;
	geometry.viewDir = normalize( vViewPosition );

	IncidentLight directLight;

	#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )

		SpotLight spotLight;

		for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {

			spotLight = spotLights[ i ];

			getSpotDirectLightIrradiance( spotLight, geometry, directLight );

			#ifdef USE_SHADOWMAP
			directLight.color *= all( bvec2( spotLight.shadow, directLight.visible ) ) ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;
			#endif

			RE_Direct( directLight, geometry, material, reflectedLight );

		}

	#endif

	#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )

		DirectionalLight directionalLight;

		for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

			directionalLight = directionalLights[ i ];

			getDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );

			#ifdef USE_SHADOWMAP

			float glow = all( bvec2( directionalLight.shadow, directLight.visible ) ) ? getGlow( directionalShadowMap[ i ], directionalLight.shadowMapSize, vDirectionalShadowCoord[ i ] ) : 1.0;

			directLight.color.r *= ((abs(glow - 1.0) * 30.0) * ( (uTime) > 1.0 ? 1.0 : (uTime) )) * uAmp;

			directLight.color *= all( bvec2( directionalLight.shadow, directLight.visible ) ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;

			#endif

			RE_Direct( directLight, geometry, material, reflectedLight );

		}

	#endif


	// modulation
	#include <aomap_fragment>

	vec4 noise = vec4(random(vec2(gl_FragCoord.x, gl_FragCoord.y)) * 0.01);

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	#include <envmap_fragment>

	gl_FragColor = vec4( outgoingLight, diffuseColor.a ) + noise;

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
