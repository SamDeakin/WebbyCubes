
const cubeData = [
    // Front face
    -1.0, -1.0,  1.0,
    1.0, -1.0,  1.0,
    1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
    1.0,  1.0, -1.0,
    1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
    1.0,  1.0,  1.0,
    1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
    1.0, -1.0, -1.0,
    1.0,  1.0, -1.0,
    1.0,  1.0,  1.0,
    1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
]

const cubeIndices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
];

class RenderPass {
    constructor(gl, shaderProgramInfo) {
        this.gl = gl
        this.shaderProgramInfo = shaderProgramInfo
    }

    run(now, delta, viewData, perspectiveData) {
        this.gl.useProgram(this.shaderProgramInfo.program)

        this.bindGLData()

        this.modelUniform = this.gl.uniformMatrix4fv(
            this.shaderProgramInfo.modelLocation, // The uniform location
            false, // Whether to transpose the mat4, but true is unsupported lol
            this.modelData, // Initial uniform data
        )
        this.viewUniform = this.gl.uniformMatrix4fv(
            this.shaderProgramInfo.viewLocation,
            false,
            viewData,
        )
        this.projectionUniform = this.gl.uniformMatrix4fv(
            this.shaderProgramInfo.perspectiveLocation,
            false,
            perspectiveData,
        )

        this.gl.drawElementsInstanced(
            this.gl.TRIANGLES, // Draw normal triangles
            this.numVertices, // Number of vertices per instance
            this.gl.UNSIGNED_SHORT, // Data format of the index buffer
            0, // Start at the beginning of the buffer
            this.instanceCount, // Number of cubes to draw
        )

        this.unbindGLData()
    }
}

export class CubeRenderPass extends RenderPass {
    constructor(gl, shaderProgramInfo) {
        super(gl, shaderProgramInfo)

        this.numVertices = 36
        this.instanceCount = 1

        this.vertexBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(cubeData), this.gl.STATIC_DRAW)

        // Half size and translate to be in range 0-1
        this.modelData = mat4.create()
        mat4.translate(
            this.modelData,
            this.modelData,
            [1, 1, 1],
        )
        mat4.multiplyScalar(
            this.modelData,
            this.modelData,
            0.5,
        )

        this.worldData = new Float32Array(mat4.create())
        this.worldTransformBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.worldTransformBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.worldData), this.gl.DYNAMIC_DRAW, 0, 16)

        this.indexBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), this.gl.STATIC_DRAW)
    }

    bindGLData() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)
        this.gl.vertexAttribPointer(
            this.shaderProgramInfo.vertexLocation,
            3, // 3 floats per vertex
            this.gl.FLOAT, // Vertices are defined with floats
            false, // Don't normalize
            0, // No padding between vertices
            0, // Start at the beginning of the buffer
        )
        this.gl.enableVertexAttribArray(this.shaderProgramInfo.vertexLocation)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.worldTransformBuffer)
        this.gl.vertexAttribPointer(this.shaderProgramInfo.worldLocation + 0, 4, this.gl.FLOAT, false, 16, 0)
        this.gl.vertexAttribPointer(this.shaderProgramInfo.worldLocation + 1, 4, this.gl.FLOAT, false, 16, 16)
        this.gl.vertexAttribPointer(this.shaderProgramInfo.worldLocation + 2, 4, this.gl.FLOAT, false, 16, 32)
        this.gl.vertexAttribPointer(this.shaderProgramInfo.worldLocation + 3, 4, this.gl.FLOAT, false, 16, 48)
        this.gl.vertexAttribDivisor(this.shaderProgramInfo.worldLocation + 0, 1)
        this.gl.vertexAttribDivisor(this.shaderProgramInfo.worldLocation + 1, 1)
        this.gl.vertexAttribDivisor(this.shaderProgramInfo.worldLocation + 2, 1)
        this.gl.vertexAttribDivisor(this.shaderProgramInfo.worldLocation + 3, 1)
        this.gl.enableVertexAttribArray(this.shaderProgramInfo.worldLocation + 0)
        this.gl.enableVertexAttribArray(this.shaderProgramInfo.worldLocation + 1)
        this.gl.enableVertexAttribArray(this.shaderProgramInfo.worldLocation + 2)
        this.gl.enableVertexAttribArray(this.shaderProgramInfo.worldLocation + 3)

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
    }

    unbindGLData() {
        this.gl.disableVertexAttribArray(this.shaderProgramInfo.vertexLocation)
        this.gl.disableVertexAttribArray(this.shaderProgramInfo.worldLocation + 0)
        this.gl.disableVertexAttribArray(this.shaderProgramInfo.worldLocation + 1)
        this.gl.disableVertexAttribArray(this.shaderProgramInfo.worldLocation + 2)
        this.gl.disableVertexAttribArray(this.shaderProgramInfo.worldLocation + 3)
    }
}
