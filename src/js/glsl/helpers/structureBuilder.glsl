#pragma glslify: rotationController = require('./rotationController.glsl')
#pragma glslify: random = require('./random.glsl')

vec3 structureBuilder(
    vec3 offset,
    float time,
    float timeOffset,
    float id,
    vec3 finalDest,
    sampler2D fftBands,
    vec3 scale,
    float frequency,
    float amp,
    vec3 transformed,
    inout vec3 vOffset,
    float explode,
    float explodeTime,
    float contract,
    float contractTime,
    vec3 position,
    inout float reachedDest,
    inout float distanceFromCenter
) {

    vOffset = offset;

    reachedDest = 0.3; // starting alpha

    amp = pow(abs(amp * 5.0), 2.1);

    float growthSpeed = 1.0;

    float prevIndex = id - 1.0;

    float multiplier = 2000.0;
    float spiralFreq = 0.0001;

    finalDest.x = (sin(id * 0.005) * multiplier) * sin(id * spiralFreq);
    finalDest.y = (cos(id * (frequency * 0.000001)) * multiplier);
    finalDest.z = cos(id * 0.005) * multiplier * sin(id * spiralFreq);

    if (mod(id, 2.0) == 0.0) {
        finalDest.x = -(sin(prevIndex * 0.005) * multiplier) * sin(prevIndex * spiralFreq);
        finalDest.y = -(cos(prevIndex * (frequency * 0.000001)) * multiplier);
        finalDest.z = -(cos(prevIndex * 0.005) * multiplier * sin(prevIndex * spiralFreq));
    }

    // add some randomness
    //amp += random(vec2(id, prevIndex)) * 100.0;

    // get a series of numbers running from 31 -> 0 -> 31
    float mod64 = mod(id, 63.0);
    float triangleWaveIndex = abs(mod64 - 31.0);

    // 4 values (RGBA) * 8 = 32 bands
    float modIndex = mod(floor(triangleWaveIndex / 4.0), 8.0);

    // extract fftdata from texture
    vec4 fftData = texture2D(fftBands, vec2(modIndex, 0.0));

    finalDest.x += sin(id) * (amp * 0.5);
    finalDest.y += sin(id * 0.1) * (amp * 0.5);
    finalDest.z += cos(id) * (amp * 0.5);

    // get unit vector towards destination point
    vec3 difference = normalize(finalDest.xyz - offset.xyz);
    vec3 newOffset = offset.xyz + (difference * (time * growthSpeed));

    vOffset = newOffset;

    distanceFromCenter = distance(newOffset, offset);
    float distanceFromDestination = distance(finalDest, offset);

    // is new offset further from center than finalDest?
    if (distanceFromCenter > distanceFromDestination) {
        vOffset = finalDest;
        reachedDest = 0.9;
        distanceFromCenter = distanceFromDestination;
    }

    vOffset.x += sin(id) * (amp * 0.5);
    vOffset.y += sin(id * 0.1) * (amp * 0.5);
    vOffset.z += cos(id) * (amp * 0.5);

    /* square growth
    float newPlusX = (offset.x + (time - timeOffset)) * growthSpeed;
    float newMinusX = (offset.x - (time - timeOffset)) * growthSpeed;

    float newPlusY = (offset.y + (time - timeOffset)) * growthSpeed;
    float newMinusY = (offset.y - (time - timeOffset)) * growthSpeed;

    float newPlusZ = (offset.z + (time - timeOffset)) * growthSpeed;
    float newMinusZ = (offset.z - (time - timeOffset)) * growthSpeed;*/

    //bool reachedX = false;
    //bool reachedY = true;
    //bool reachedZ = false;

    // move position towards destination along each axis
    /*if (newPlusX < finalDest.x) {
       vOffset.x = newPlusX;
    } else {
       if (newMinusX > finalDest.x) {
           vOffset.x = newMinusX;
       } else {
           reachedX = true;
           vOffset.x = finalDest.x + (sin(id) * (amp * 0.6));
       }
    }

    if (newPlusY < finalDest.y) {
       vOffset.y = newPlusY;
    } else {
       if (newMinusY > finalDest.y) {
           vOffset.y = newMinusY;
       } else {
          reachedY = true;
           vOffset.y = finalDest.y + (sin(id * 0.1) * (amp * 0.6));
       }
    }

    if (newPlusZ < finalDest.z) {
       vOffset.z = newPlusZ;
    } else {
       if (newMinusZ > finalDest.z) {
           vOffset.z = newMinusZ;
       } else {
          reachedZ = true;
           vOffset.z = finalDest.z + (cos(id) * (amp) * 0.6);
       }
    }*/

    //if (reachedX && reachedY && reachedZ) {
    //    reachedDest = 1.0;
//    }

    vec3 vScale = scale;

    float mod4 = mod(id, 4.0);

    if (mod4 == 0.0) {
        vScale *= pow(abs(fftData.x), 2.0);
    }
    if (mod4 == 1.0) {
        vScale *= pow(abs(fftData.y), 2.0);
    }
    if (mod4 == 2.0) {
        vScale *= pow(abs(fftData.z), 2.0);
    }
    if (mod4 == 3.0) {
        vScale *= pow(abs(fftData.w), 2.0);
    }

    transformed *= (vScale * 0.7);
    transformed.xyz += vOffset.xyz;

    // explode
    if (explode == 1.0) {

        float newTime = (time - explodeTime);
        float timeMultiplier = 25.0;
        float threshold = 100.0;

        if (newTime > threshold) {

            newTime = threshold;

            if (contract == 1.0) {

                float newNewTime = (time - contractTime) + threshold;

                float decrement = (newNewTime - threshold) * 0.5;

                timeMultiplier -= decrement;

                if (timeMultiplier > 25.0) {
                    timeMultiplier = 25.0;
                }

                if (timeMultiplier < 1.0) {
                    timeMultiplier = 1.0;
                }

            }

        }

        vec3 difference = normalize(vOffset.xyz - offset.xyz);
        vec3 newTransformed = transformed.xyz + (difference * (newTime * timeMultiplier));
        transformed.xyz = newTransformed;

    }

    return transformed;

}

#pragma glslify: export(structureBuilder)
