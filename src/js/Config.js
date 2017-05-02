"use strict";

const Config = {

    scene: {
        bgColor: '#000000',
        shadowsOn: true,
        antialias: window.devicePixelRatio == 1 // switch off anti-aliasing on hi-dpi displays
    },
    cubes: {
        count: 150000,
    },
    camera: {
        fov: 120,
        animate: false,
    },

};

export default Config;
