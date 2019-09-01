import { cube, world } from "./cubes.js"

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

    run(now, delta, viewData, projectionData) {
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
            this.shaderProgramInfo.projectionLocation,
            false,
            projectionData,
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

class cubeRenderPass extends RenderPass {
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

export default class glCanvas {
    constructor() {
        this.canvas = document.querySelector("#main")
        this.width = 0
        this.height = 0

        this.gl = this.canvas.getContext("webgl2")

        if (this.gl == null) {
            alert(":(")
            return
        }

        this.loadData()
    }

    render(now, delta) {
        // Rerun this every frame because the user may have resized the window and canvas
        this.setupView()

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        this.gl.clearDepth(1.0); // Clear everything
        this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
        this.gl.depthFunc(this.gl.LEQUAL); // Near things obscure far things

        // Clear the canvas before we start drawing on it.
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.cubeRenderPass.run(now, delta, this.viewMatrix, this.projectionMatrix)
    }

    loadData() {
        let cubeVS = fetch('../assets/cubeVS.glsl')
        let cubeFS = fetch('../assets/cubeFS.glsl')

        const _this = this
        Promise.all([cubeVS, cubeFS]).then(resources => {
            Promise.all(resources.map(res => {
                return res.text()
            })).then(texts => {
                _this.cubeVSsource = texts[0]
                _this.cubeFSsource = texts[1]
                _this.beginRender()
            })
        })
    }

    createPrograms() {
        this.cubeVS = this.gl.createShader(this.gl.VERTEX_SHADER)
        this.gl.shaderSource(this.cubeVS, this.cubeVSsource)
        this.gl.compileShader(this.cubeVS)

        if (!this.gl.getShaderParameter(this.cubeVS, this.gl.COMPILE_STATUS)) {
            console.log('Failed to compile shader cubeVS: ' + this.gl.getShaderInfoLog(this.cubeVS))
            this.gl.deleteShader(this.cubeVS)
        }

        this.cubeFS = this.gl.createShader(this.gl.FRAGMENT_SHADER)
        this.gl.shaderSource(this.cubeFS, this.cubeFSsource)
        this.gl.compileShader(this.cubeFS)

        if (!this.gl.getShaderParameter(this.cubeFS, this.gl.COMPILE_STATUS)) {
            console.log('Failed to compile shader cubeFS: ' + this.gl.getShaderInfoLog(this.cubeFS))
            this.gl.deleteShader(this.cubeFS)
        }

        this.cubeShaderProgram = this.gl.createProgram()
        this.gl.attachShader(this.cubeShaderProgram, this.cubeVS)
        this.gl.attachShader(this.cubeShaderProgram, this.cubeFS)
        this.gl.linkProgram(this.cubeShaderProgram)

        if (!this.gl.getProgramParameter(this.cubeShaderProgram, this.gl.LINK_STATUS)) {
            console.log('Failed to link cubeShaderProgram: ' + this.gl.getProgramInfoLog(this.cubeShaderProgram))
            this.gl.deleteProgram(this.cubeShaderProgram)
        }

        this.cubeShaderProgramInfo = {
            program: this.cubeShaderProgram,
            vertexLocation: this.gl.getAttribLocation(this.cubeShaderProgram, 'a_position'),
            worldLocation: this.gl.getAttribLocation(this.cubeShaderProgram, 'a_world'),
            modelLocation: this.gl.getUniformLocation(this.cubeShaderProgram, 'u_model'),
            viewLocation: this.gl.getUniformLocation(this.cubeShaderProgram, 'u_view'),
            projectionLocation: this.gl.getUniformLocation(this.cubeShaderProgram, 'u_projection'),
        }
    }

    resetSize() {
        this.width = this.canvas.clientWidth
        this.canvas.width = this.width
        this.height = this.canvas.clientHeight
        this.canvas.height = this.height
        this.gl.viewport(0, 0, this.width, this.height)
    }

    setupView() {
        if (this.width == this.canvas.clientWidth && this.height == this.canvas.clientHeight) {
            return
        }
        this.resetSize()

        this.viewMatrix = mat4.create()
        mat4.lookAt(
            this.viewMatrix, // Data destination
            [0.0, 0.0, 5.0], // Position
            [0.0, 0.0, 0.0], // target
            [0.0, 1.0, 0.0], // Up
        )

        this.projectionMatrix = mat4.create()
        mat4.perspective(
            this.projectionMatrix,
            45.0 * Math.PI / 180.0, // Vertical FOV in radians
            this.width / this.height, // Aspect ratio
            0.1, // Near plane
            100.0, // Far plane
        )
    }

    beginRender() {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT)

        this.createPrograms()
        this.setupView()

        this.cubeRenderPass = new cubeRenderPass(
            this.gl,
            this.cubeShaderProgramInfo,
            this.viewMatrix,
            this.projectionMatrix,
        )

        let last = performance.now()
        let _this = this
        function render(now) {
            let delta = now - last
            last = now

            _this.render(now, delta)

            requestAnimationFrame(render)
        }

        requestAnimationFrame(render)
    }
}
