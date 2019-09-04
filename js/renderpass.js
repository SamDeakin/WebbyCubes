
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

// ID values to be rendered to colour attachment 1 alpha channel and tested when a user clicks.
// These let us tell which face of the cube was touched.
const cubeSideIds = [
    // Skip past 1, 1 is the default alpha value.
    2, // front
    3, // back
    4, // top
    5, // bottom
    6, // right
    7, // left
]

const quadData = [
    -1, -1, 0,
    -1, 1, 0,
    1, -1, 0,
    1, 1, 0,
]

const quadIndices = [
    1, 0, 2, // Bottom left
    3, 2, 1, // Top right
]

const quaduvs = [
    0, 0,
    0, 1,
    1, 0,
    1, 1,
]

class RenderPass {
    constructor(gl, shaderProgramInfo) {
        this.gl = gl
        this.shaderProgramInfo = shaderProgramInfo
    }

    run(now, delta, viewData, perspectiveData) {
        this.gl.useProgram(this.shaderProgramInfo.program)

        this.bindGLData()

        if (this.shaderProgramInfo.modelLocation) {
            this.modelUniform = this.gl.uniformMatrix4fv(
                this.shaderProgramInfo.modelLocation, // The uniform location
                false, // Whether to transpose the mat4, but true is unsupported lol
                this.modelData, // Initial uniform data
            )
        }
        if (this.shaderProgramInfo.viewLocation) {
            this.viewUniform = this.gl.uniformMatrix4fv(
                this.shaderProgramInfo.viewLocation,
                false,
                viewData,
            )
        }
        if (this.shaderProgramInfo.perspectiveLocation) {
            this.perspectiveUniform = this.gl.uniformMatrix4fv(
                this.shaderProgramInfo.perspectiveLocation,
                false,
                perspectiveData,
            )
        }

        this.gl.drawElementsInstanced(
            this.gl.TRIANGLES, // Draw normal triangles
            this.numVertices, // Number of vertices per instance
            this.gl.UNSIGNED_SHORT, // Data format of the index buffer
            0, // Start at the beginning of the buffer
            this.instanceCount, // Number of cubes to draw
        )

        this.unbindGLData()

        this.gl.useProgram(null)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
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

        this.cubeidBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeidBuffer)
        // Test cube id data
        let buf = new Float32Array([6/255, 9/255, 69/255])
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(buf), this.gl.DYNAMIC_DRAW)

        this.faceidBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.faceidBuffer)
        let faceids = new Float32Array(cubeSideIds.length * 6)
        for (let i = 0; i < cubeSideIds.length; i++) {
            faceids[i * 6 + 0] = cubeSideIds[i] / 255
            faceids[i * 6 + 1] = cubeSideIds[i] / 255
            faceids[i * 6 + 2] = cubeSideIds[i] / 255
            faceids[i * 6 + 3] = cubeSideIds[i] / 255
            faceids[i * 6 + 4] = cubeSideIds[i] / 255
            faceids[i * 6 + 5] = cubeSideIds[i] / 255
        }
        this.gl.bufferData(this.gl.ARRAY_BUFFER, faceids, this.gl.STATIC_DRAW)
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
        this.gl.vertexAttribDivisor(this.shaderProgramInfo.vertexLocation, 0)
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

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeidBuffer)
        this.gl.vertexAttribPointer(
            this.shaderProgramInfo.cubeidLocation,
            3,
            this.gl.FLOAT,
            false,
            0,
            0,
        )
        this.gl.vertexAttribDivisor(this.shaderProgramInfo.cubeidLocation, 1)
        this.gl.enableVertexAttribArray(this.shaderProgramInfo.cubeidLocation)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.faceidBuffer)
        this.gl.vertexAttribPointer(
            this.shaderProgramInfo.faceidLocation,
            1,
            this.gl.FLOAT,
            false,
            0,
            0,
        )
        this.gl.vertexAttribDivisor(this.shaderProgramInfo.faceidLocation, 0)
        this.gl.enableVertexAttribArray(this.shaderProgramInfo.faceidLocation)
    }

    unbindGLData() {
        this.gl.disableVertexAttribArray(this.shaderProgramInfo.vertexLocation)
        this.gl.disableVertexAttribArray(this.shaderProgramInfo.worldLocation + 0)
        this.gl.disableVertexAttribArray(this.shaderProgramInfo.worldLocation + 1)
        this.gl.disableVertexAttribArray(this.shaderProgramInfo.worldLocation + 2)
        this.gl.disableVertexAttribArray(this.shaderProgramInfo.worldLocation + 3)
        this.gl.disableVertexAttribArray(this.shaderProgramInfo.cubeidLocation)
        this.gl.disableVertexAttribArray(this.shaderProgramInfo.faceidLocation)
    }
}

export class QuadRenderPass extends RenderPass {
    constructor(gl, shaderProgramInfo, quadTexture) {
        super(gl, shaderProgramInfo)

        this.quadTexture = quadTexture
        this.numVertices = 6
        this.instanceCount = 1

        this.vertexBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quadData), this.gl.STATIC_DRAW)

        this.uvBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.uvBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quaduvs), this.gl.STATIC_DRAW)

        this.indexBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(quadIndices), this.gl.STATIC_DRAW)
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
        this.gl.vertexAttribDivisor(this.shaderProgramInfo.vertexLocation, 0)
        this.gl.enableVertexAttribArray(this.shaderProgramInfo.vertexLocation)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.uvBuffer)
        this.gl.vertexAttribPointer(
            this.shaderProgramInfo.uvLocation,
            2,
            this.gl.FLOAT,
            false,
            0,
            0,
        )
        this.gl.vertexAttribDivisor(this.shaderProgramInfo.uvLocation, 0)
        this.gl.enableVertexAttribArray(this.shaderProgramInfo.uvLocation)

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)

        this.gl.activeTexture(this.gl.TEXTURE0)
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.quadTexture)
        this.gl.activeTexture(this.gl.TEXTURE0)
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.quadTexture)
        this.gl.uniform1i(this.shaderProgramInfo.samplerLocation, 0)
    }

    unbindGLData() {
        this.gl.disableVertexAttribArray(this.shaderProgramInfo.vertexLocation)
        this.gl.disableVertexAttribArray(this.shaderProgramInfo.uvLocation)
        // this.gl.bindTexture(this.gl.TEXTURE_2D, null)
    }
}
