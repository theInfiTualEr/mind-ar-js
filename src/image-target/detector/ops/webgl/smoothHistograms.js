const {MathBackendWebGL} = require('@tensorflow/tfjs-backend-webgl');
const ORIENTATION_NUM_BINS = 36;
const ORIENTATION_SMOOTHING_ITERATIONS = 5;

const cache={};
function GetProgram(histograms){
    const kernelKey=`h${histograms.shape[0]}`;
    if(!cache.hasOwnProperty(kernelKey)){
        const kernel = {
            variableNames: ['histogram'],
            outputShape: [histograms.shape[0], ORIENTATION_NUM_BINS],
            userCode: `
            void main() {
                ivec2 coords = getOutputCoords();

                int featureIndex = coords[0];
                int binIndex = coords[1];

                int prevBin = imod(binIndex - 1 + ${ORIENTATION_NUM_BINS}, ${ORIENTATION_NUM_BINS});
                int nextBin = imod(binIndex + 1, ${ORIENTATION_NUM_BINS});
                float result = 0.274068619061197 * getHistogram(featureIndex, prevBin) + 0.451862761877606 * getHistogram(featureIndex, binIndex) + 0.274068619061197 * getHistogram(featureIndex, nextBin);

                setOutput(result);
            }
            `
        };
        cache[kernelKey]=kernel;
    }
    return cache[kernelKey];
}

const smoothHistograms=(args)=>{
    /** @type {import('@tensorflow/tfjs').TensorInfo} */
    let {histograms} = args.inputs;
    /** @type {MathBackendWebGL} */
    const backend = args.backend;

    const program = GetProgram(histograms);
    for (let i = 0; i < ORIENTATION_SMOOTHING_ITERATIONS; i++) {
        histograms = backend.runWebGLProgram(program,[histograms],histograms.dtype);//this._compileAndRun(program, [histograms]);
    }
    return histograms;
    
}



const smoothHistogramsConfig = {//: KernelConfig
    kernelName: "SmoothHistograms",
    backendName: 'webgl',
    kernelFunc: smoothHistograms,// as {} as KernelFunc,
};

module.exports={
    smoothHistogramsConfig,
    smoothHistograms
}