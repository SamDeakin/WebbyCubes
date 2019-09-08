import { RenderPass } from './renderpass.js'

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

export class QuadRenderPass extends RenderPass {
    constructor(shaderProgramInfo, quadTexture) {
        super(shaderProgramInfo)

        this.quadTexture = quadTexture
        this.numVertices = 6
        this.instanceCount = 1

        this.vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadData), gl.STATIC_DRAW)

        this.uvBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quaduvs), gl.STATIC_DRAW)

        this.indexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(quadIndices), gl.STATIC_DRAW)
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

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer)
        gl.vertexAttribPointer(
            this.shaderProgramInfo.uvLocation,
            2,
            gl.FLOAT,
            false,
            0,
            0,
        )
        gl.vertexAttribDivisor(this.shaderProgramInfo.uvLocation, 0)
        gl.enableVertexAttribArray(this.shaderProgramInfo.uvLocation)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.quadTexture)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.quadTexture)
        gl.uniform1i(this.shaderProgramInfo.samplerLocation, 0)
    }

    unbindGLData() {
        gl.disableVertexAttribArray(this.shaderProgramInfo.vertexLocation)
        gl.disableVertexAttribArray(this.shaderProgramInfo.uvLocation)
        gl.bindTexture(gl.TEXTURE_2D, null)
    }
}

export class FXRenderPass extends QuadRenderPass {
    constructor(shaderProgramInfo, quadTexture, canvas) {
        super(shaderProgramInfo, quadTexture)

        this.controlbar = $("#controlbar")
        this.canvas = canvas
    }

    bindGLData() {
        super.bindGLData()

        // Upload the height that must be blurred
        const heightPercent = this.controlbar.height() / this.canvas.height
        this.blurredAreaUniform = gl.uniform1f(
            this.shaderProgramInfo.blurredAreaLocation,
            heightPercent,
        )

        this.renderAreaUniform = gl.uniform2fv(
            this.shaderProgramInfo.renderAreaLocation,
            [this.canvas.height, this.canvas.width,],
        )
    }
}
