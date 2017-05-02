#pragma glslify: rotationMatrix = require('./rotation.glsl')

vec4 rotationController(
    float time,
    mat4 modelViewMatrix,
    vec3 vOffset,
    float amp,
    float id,
    vec3 transformed
) {

    // rotate around global axis
    mat4 rotation = rotationMatrix( vec3(0.0, 1.0, 0.0), (time * 0.05));
    mat4 newMatrix = modelViewMatrix * rotation;

    // rotate around local axis
    float rotationSpeed = amp * 0.0001;
    mat4 rotation2 = rotationMatrix( vOffset, (time + id) * 0.3);
    mat4 newMatrix2 = newMatrix * rotation2;

    vec4 newPos = newMatrix2 * vec4( transformed, 1.0 );

    return newPos;

}

#pragma glslify: export(rotationController)
