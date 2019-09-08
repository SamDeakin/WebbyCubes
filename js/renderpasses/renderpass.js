export class RenderPass {
    constructor(shaderProgramInfo) {
        this.shaderProgramInfo = shaderProgramInfo
    }

    run(now, delta, viewData, viewInverseData, perspectiveData) {
        gl.useProgram(this.shaderProgramInfo.program)

        this.bindGLData()

        if (this.shaderProgramInfo.modelLocation) {
            this.modelUniform = gl.uniformMatrix4fv(
                this.shaderProgramInfo.modelLocation, // The uniform location
                false, // Whether to transpose the mat4, but true is unsupported lol
                this.modelData, // Initial uniform data
            )
        }
        if (this.shaderProgramInfo.modelInverseLocation) {
            this.modelInverseUniform = gl.uniformMatrix4fv(
                this.shaderProgramInfo.modelInverseLocation,
                false,
                this.modelInverseData,
            )
        }
        if (this.shaderProgramInfo.viewLocation) {
            this.viewUniform = gl.uniformMatrix4fv(
                this.shaderProgramInfo.viewLocation,
                false,
                viewData,
            )
        }
        if (this.shaderProgramInfo.viewInverseLocation) {
            this.viewInverseUniform = gl.uniformMatrix4fv(
                this.shaderProgramInfo.viewInverseLocation,
                false,
                viewInverseData,
            )
        }
        if (this.shaderProgramInfo.perspectiveLocation) {
            this.perspectiveUniform = gl.uniformMatrix4fv(
                this.shaderProgramInfo.perspectiveLocation,
                false,
                perspectiveData,
            )
        }

        gl.drawElementsInstanced(
            gl.TRIANGLES, // Draw normal triangles
            this.numVertices, // Number of vertices per instance
            gl.UNSIGNED_SHORT, // Data format of the index buffer
            0, // Start at the beginning of the buffer
            this.instanceCount, // Number of cubes to draw
        )

        this.unbindGLData()

        gl.useProgram(null)
        gl.bindBuffer(gl.ARRAY_BUFFER, null)
        gl.bindBuffer(gl.ARRAY_BUFFER, null)
    }
}
