const {TensorInfo} = require('@tensorflow/tfjs-core');
const {MathBackendWebGL,GPGPUProgram} = require('@tensorflow/tfjs-backend-webgl');


const cache={};
/**
 * 
 * @param {TensorInfo} image 
 * @returns {GPGPUProgram}
 */
function GetProgram(image){
    const imageHeight = image.shape[0];
    const imageWidth = image.shape[1];
    const kernelKey = 'w' + imageWidth;
    if(!cache.hasOwnProperty(kernelKey)){
        const kernel = {
            variableNames: ['p'],
            outputShape: [Math.floor(imageHeight/2), Math.floor(imageWidth/2)],
            userCode: `
            void main() {
                ivec2 coords = getOutputCoords();
                int y = coords[0] * 2;
                int x = coords[1] * 2;
        
                float sum = getP(y, x) * 0.25;
                sum += getP(y+1,x) * 0.25; 
                sum += getP(y, x+1) * 0.25; 
                sum += getP(y+1,x+1) * 0.25;
                setOutput(sum);
            }
            `
        };
        cache[kernelKey]=kernel;
    }
    return cache[kernelKey];
}


const downsampleBilinear =(args)=>{
    /** @type {import('@tensorflow/tfjs').TensorInfo} */
    const image = args.inputs.image;
    /** @type {MathBackendWebGL} */
    const backend = args.backend;
    
    const program=GetProgram(image);
    
    return backend.runWebGLProgram(program,[image],image.dtype);
}

const downsampleBilinearConfig = {//: KernelConfig
    kernelName: "DownsampleBilinear",
    backendName: 'webgl',
    kernelFunc: downsampleBilinear,// as {} as KernelFunc,
};

module.exports={
    downsampleBilinearConfig,
    downsampleBilinear
}