import { RenderPass } from './renderpass.js'

const planeData = [
    [1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0],
]

const planeIndices = [
    0, 1, 2,
    0, 2, 3,
]

export class PlaneRenderPass extends RenderPass {
    constructor(shaderProgramInfo, planeMin, planeMax) {
        super(shaderProgramInfo)

        this.numVertices = 6
        this.instanceCount = 1

        // Shift the plane down by this value to match the bottom of the "0" row cubes,
        // and then be just a bit below it to avoid z-fighting.
        let planeShiftValue = 0.5
        let zShiftValue = 0.0001
        this.planeData = [
            planeData[0][0] * planeMin[0],
            planeData[0][1] - planeShiftValue - zShiftValue,
            planeData[0][2] * planeMin[1],
            planeData[1][0] * planeMax[0],
            planeData[1][1] - planeShiftValue - zShiftValue,
            planeData[1][2] * planeMin[1],
            planeData[2][0] * planeMax[0],
            planeData[2][1] - planeShiftValue - zShiftValue,
            planeData[2][2] * planeMax[1],
            planeData[3][0] * planeMin[0],
            planeData[3][1] - planeShiftValue - zShiftValue,
            planeData[3][2] * planeMax[1],
        ]

        this.vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.planeData), gl.STATIC_DRAW)

        this.indexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(planeIndices), gl.STATIC_DRAW)
    }

    bindGLData() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.vertexAttribPointer(
            this.shaderProgramInfo.vertexLocation,
            3, // 3 floats per vertex
            gl.FLOAT, // Vertices are defined with floats
            false, // Don't normalize
            0, // No padding between vertices
            0, // Start at the beginning of the buffer
        )
        gl.vertexAttribDivisor(this.shaderProgramInfo.vertexLocation, 0)
        gl.enableVertexAttribArray(this.shaderProgramInfo.vertexLocation)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    unbindGLData() {
        gl.disableVertexAttribArray(this.shaderProgramInfo.vertexLocation)

        gl.disable(gl.BLEND);
    }
}