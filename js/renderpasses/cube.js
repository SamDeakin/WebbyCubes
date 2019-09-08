import { RenderPass } from './renderpass.js'

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
    // Skip 0, as that can easily be misinterpreted.
    1, // front
    2, // back
    3, // top
    4, // bottom
    5, // right
    6, // left
]

const cubeNormals = [
    0.0, 0.0, 1.0, // Front face
    0.0, 0.0, -1.0, // Back face
    0.0, 1.0, 0.0, // Top face
    0.0, -1.0, 0.0, // Bottom face
    1.0, 0.0, 0.0, // Right face
    -1.0, 0.0, 0.0, // Left face
]

export class CubeRenderPass extends RenderPass {
    constructor(shaderProgramInfo) {
        super(shaderProgramInfo)

        this.numVertices = 36
        this.instanceCount = 1

        this.vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeData), gl.STATIC_DRAW)

        // Half size. We leave in the range of (-0.5, 0.5) to force a "centre" cube
        this.modelData = mat4.create()
        mat4.scale(
            this.modelData,
            this.modelData,
            [0.5, 0.5, 0.5],
        )

        this.modelInverseData = mat4.create()
        mat4.invert(this.modelInverseData, this.modelData)

        this.indexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW)

        this.worldTransformBuffer = gl.createBuffer()
        this.worldInverseTransformBuffer = gl.createBuffer()
        this.colourBuffer = gl.createBuffer()
        this.cubeidBuffer = gl.createBuffer()

        this.normalBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer)
        let normals = new Float32Array(cubeNormals.length * 4)
        for (let face = 0; face < 6; face++) { // 6 faces per cube
            for (let vertex = 0; vertex < 4; vertex++) { // 4 vertices per face
                for (let index = 0; index < 3; index++) { // 3 numbers per vec3
                    normals[
                        face * 4 * 3
                        + vertex * 3
                        + index
                    ] = cubeNormals[
                        face * 3
                        + index
                    ]
                }
            }
        }
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW)

        this.faceidBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.faceidBuffer)
        let faceids = new Float32Array(cubeSideIds.length * 4)
        for (let i = 0; i < cubeSideIds.length; i++) {
            faceids[i * 4 + 0] = cubeSideIds[i] / 255
            faceids[i * 4 + 1] = cubeSideIds[i] / 255
            faceids[i * 4 + 2] = cubeSideIds[i] / 255
            faceids[i * 4 + 3] = cubeSideIds[i] / 255
        }
        gl.bufferData(gl.ARRAY_BUFFER, faceids, gl.STATIC_DRAW)
    }

    resize(size, positions, colours, ids) {
        this.instanceCount = size

        // Reset world positions
        this.worldData = new Float32Array(size * 16)
        this.worldInverseData = new Float32Array(size * 16)
        // Fill worldData with matrix transforms for every position
        for (let i = 0; i < size; i++) {
            let transform = mat4.create()
            mat4.fromTranslation(transform, positions[i])
            let inverse = mat4.create()
            mat4.invert(inverse, transform)
            for (let j = 0; j < 16; j++) {
                this.worldData[i * 16 + j] = transform[j]
                this.worldInverseData[i * 16 + j] = transform[j]
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.worldTransformBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, this.worldData, gl.DYNAMIC_DRAW, 0)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.worldInverseTransformBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, this.worldInverseData, gl.DYNAMIC_DRAW, 0)

        // Reset colours
        this.colourData = new Float32Array(size * 3)
        for (let i = 0; i < size; i++) {
            this.colourData[i * 3 + 0] = colours[i][0]
            this.colourData[i * 3 + 1] = colours[i][1]
            this.colourData[i * 3 + 2] = colours[i][2]
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colourBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, this.colourData, gl.DYNAMIC_DRAW, 0)

        // Reset cube IDs
        // IDs are pre-transformed to a vec3 of uints for us
        this.idData = new Float32Array(size * 3)
        for (let i = 0; i < size; i++) {
            this.idData[i * 3 + 0] = ids[i][0] / 255.0
            this.idData[i * 3 + 1] = ids[i][1] / 255.0
            this.idData[i * 3 + 2] = ids[i][2] / 255.0
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeidBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, this.idData, gl.DYNAMIC_DRAW, 0)
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

        gl.bindBuffer(gl.ARRAY_BUFFER, this.worldTransformBuffer)
        gl.vertexAttribPointer(this.shaderProgramInfo.worldLocation + 0, 4, gl.FLOAT, false, 64, 0)
        gl.vertexAttribPointer(this.shaderProgramInfo.worldLocation + 1, 4, gl.FLOAT, false, 64, 16)
        gl.vertexAttribPointer(this.shaderProgramInfo.worldLocation + 2, 4, gl.FLOAT, false, 64, 32)
        gl.vertexAttribPointer(this.shaderProgramInfo.worldLocation + 3, 4, gl.FLOAT, false, 64, 48)
        gl.vertexAttribDivisor(this.shaderProgramInfo.worldLocation + 0, 1)
        gl.vertexAttribDivisor(this.shaderProgramInfo.worldLocation + 1, 1)
        gl.vertexAttribDivisor(this.shaderProgramInfo.worldLocation + 2, 1)
        gl.vertexAttribDivisor(this.shaderProgramInfo.worldLocation + 3, 1)
        gl.enableVertexAttribArray(this.shaderProgramInfo.worldLocation + 0)
        gl.enableVertexAttribArray(this.shaderProgramInfo.worldLocation + 1)
        gl.enableVertexAttribArray(this.shaderProgramInfo.worldLocation + 2)
        gl.enableVertexAttribArray(this.shaderProgramInfo.worldLocation + 3)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.worldInverseTransformBuffer)
        gl.vertexAttribPointer(this.shaderProgramInfo.worldInverseLocation + 0, 4, gl.FLOAT, false, 64, 0)
        gl.vertexAttribPointer(this.shaderProgramInfo.worldInverseLocation + 1, 4, gl.FLOAT, false, 64, 16)
        gl.vertexAttribPointer(this.shaderProgramInfo.worldInverseLocation + 2, 4, gl.FLOAT, false, 64, 32)
        gl.vertexAttribPointer(this.shaderProgramInfo.worldInverseLocation + 3, 4, gl.FLOAT, false, 64, 48)
        gl.vertexAttribDivisor(this.shaderProgramInfo.worldInverseLocation + 0, 1)
        gl.vertexAttribDivisor(this.shaderProgramInfo.worldInverseLocation + 1, 1)
        gl.vertexAttribDivisor(this.shaderProgramInfo.worldInverseLocation + 2, 1)
        gl.vertexAttribDivisor(this.shaderProgramInfo.worldInverseLocation + 3, 1)
        gl.enableVertexAttribArray(this.shaderProgramInfo.worldInverseLocation + 0)
        gl.enableVertexAttribArray(this.shaderProgramInfo.worldInverseLocation + 1)
        gl.enableVertexAttribArray(this.shaderProgramInfo.worldInverseLocation + 2)
        gl.enableVertexAttribArray(this.shaderProgramInfo.worldInverseLocation + 3)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colourBuffer)
        gl.vertexAttribPointer(
            this.shaderProgramInfo.colourLocation,
            3,
            gl.FLOAT,
            false,
            0,
            0,
        )
        gl.vertexAttribDivisor(this.shaderProgramInfo.colourLocation, 1)
        gl.enableVertexAttribArray(this.shaderProgramInfo.colourLocation)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer)
        gl.vertexAttribPointer(
            this.shaderProgramInfo.normalLocation,
            3,
            gl.FLOAT,
            false,
            0,
            0,
        )
        gl.vertexAttribDivisor(this.shaderProgramInfo.normalLocation, 0)
        gl.enableVertexAttribArray(this.shaderProgramInfo.normalLocation)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeidBuffer)
        gl.vertexAttribPointer(
            this.shaderProgramInfo.cubeidLocation,
            3,
            gl.FLOAT,
            false,
            0,
            0,
        )
        gl.vertexAttribDivisor(this.shaderProgramInfo.cubeidLocation, 1)
        gl.enableVertexAttribArray(this.shaderProgramInfo.cubeidLocation)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.faceidBuffer)
        gl.vertexAttribPointer(
            this.shaderProgramInfo.faceidLocation,
            1,
            gl.FLOAT,
            false,
            0,
            0,
        )
        gl.vertexAttribDivisor(this.shaderProgramInfo.faceidLocation, 0)
        gl.enableVertexAttribArray(this.shaderProgramInfo.faceidLocation)
    }

    unbindGLData() {
        gl.disableVertexAttribArray(this.shaderProgramInfo.vertexLocation)
        gl.disableVertexAttribArray(this.shaderProgramInfo.worldLocation + 0)
        gl.disableVertexAttribArray(this.shaderProgramInfo.worldLocation + 1)
        gl.disableVertexAttribArray(this.shaderProgramInfo.worldLocation + 2)
        gl.disableVertexAttribArray(this.shaderProgramInfo.worldLocation + 3)
        gl.disableVertexAttribArray(this.shaderProgramInfo.worldInverseLocation + 0)
        gl.disableVertexAttribArray(this.shaderProgramInfo.worldInverseLocation + 1)
        gl.disableVertexAttribArray(this.shaderProgramInfo.worldInverseLocation + 2)
        gl.disableVertexAttribArray(this.shaderProgramInfo.worldInverseLocation + 3)
        gl.disableVertexAttribArray(this.shaderProgramInfo.colourLocation)
        gl.disableVertexAttribArray(this.shaderProgramInfo.normalLocation)
        gl.disableVertexAttribArray(this.shaderProgramInfo.cubeidLocation)
        gl.disableVertexAttribArray(this.shaderProgramInfo.faceidLocation)
    }
}
