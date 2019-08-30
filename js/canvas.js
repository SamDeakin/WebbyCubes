"use strict"

function makeCanvas() {
    const canvas = document.querySelector("#main")
    const gl = canvas.getContext("webgl")

    if (gl == null) {
        alert(":(")
        return
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
}

makeCanvas()