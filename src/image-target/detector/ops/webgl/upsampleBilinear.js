const {MathBackendWebGL} = require('@tensorflow/tfjs-backend-webgl');

const cache={};
function GetProgram(image,targetImage){
    const imageWidth = image.shape[1];
    const kernelKey = 'w' + imageWidth;
    if(!cache.hasOwnProperty(kernelKey)){
        const kernel = {
            variableNames: ['p'],
            outputShape: [targetImage.shape[0], targetImage.shape[1]],
            userCode: `
              void main() {
                ivec2 coords = getOutputCoords();
                int j = coords[0];
                int i = coords[1];
        
                float sj = 0.5 * float(j) - 0.25; 
                float si = 0.5 * float(i) - 0.25;
        
                float sj0 = floor(sj);
                float sj1 = ceil(sj);
                float si0 = floor(si);
                float si1 = ceil(si);
        
                int sj0I = int(sj0);
                int sj1I = int(sj1);
                int si0I = int(si0);
                int si1I = int(si1);
        
                float sum = 0.0;
                sum += getP(sj0I, si0I) * (si1 - si) * (sj1 - sj);
                sum += getP(sj1I, si0I) * (si1 - si) * (sj - sj0);
                sum += getP(sj0I, si1I) * (si - si0) * (sj1 - sj);
                sum += getP(sj1I, si1I) * (si - si0) * (sj - sj0);
                setOutput(sum);
              }
            `
        };
        cache[kernelKey]=kernel;
    }

    return cache[kernelKey];
}

const upsampleBilinear =(args)=>{
    /** @type {import('@tensorflow/tfjs').TensorInfo} */
    const {image,targetImage} = args.inputs;

    
    /** @type {MathBackendWebGL} */
    const backend = args.backend;

    const program = GetProgram(image,targetImage);
    return backend.runWebGLProgram(program,[image],image.dtype);

    
}

const upsampleBilinearConfig = {//: KernelConfig
    kernelName: "UpsampleBilinear",
    backendName: 'webgl',
    kernelFunc: upsampleBilinear,// as {} as KernelFunc,
};

module.exports={
    upsampleBilinearConfig,
    upsampleBilinear
}