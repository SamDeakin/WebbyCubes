import { World } from "./cubes.js"
import { CubeRenderPass, QuadRenderPass } from "./renderpass.js"
import { Camera } from "./camera.js"
import { ControlBar } from "./controlbar.js"

const MouseMoveThreshold = 15 // Min to count as move instead of click
const MouseComboMoveThreshold = 0.7 // If >x% of movement is in x or y axis then lock to just that type of dragging

export default class GLCanvas {
    constructor() {
        this.canvas = document.querySelector("#main")
        this.width = 0
        this.height = 0

        this.camera = new Camera(
            // [0, 7, 15],
            [0, 1, 5],
            [0, 1, 0],
            this.width,
            this.height,
        )

        let _this = this
        let mouse = {
            x: 0,
            y: 0,
            dx: 0,
            dy: 0,
            netdx: 0,
            netdy: 0,
            held: false,
            click: false,
            draggingX: false,
            draggingY: false,
            button: 0,
        }
        this.canvas.addEventListener('mousedown', (e) => {
            // Set up tracking so we can filter mouseup and mousemove into drag and click
            mouse.held = true
            mouse.click = true
            mouse.x = e.clientX
            mouse.y = e.clientY
            mouse.dx = 0
            mouse.dy = 0
            mouse.netdx = 0
            mouse.netdy = 0
            mouse.draggingX = false
            mouse.draggingY = false
            mouse.button = e.buttons
            e.preventDefault()
        }, false)
        this.canvas.addEventListener('mouseup', (e) => {
            mouse.held = false
            if (mouse.click) {
                _this.mouseClicked(mouse.x, mouse.y)
            }
            e.preventDefault()
        }, false)
        this.canvas.addEventListener('mouseleave', (e) => {
            mouse.held = false
            e.preventDefault()
        })
        this.canvas.addEventListener('mousemove', (e) => {
            if (!mouse.held) {
                return
            }

            // Skip this event if the mouse didn't actually move
            if (e.clientX == mouse.x && e.clientY == mouse.y) {
                return
            }

            mouse.netdx += Math.abs(e.clientX - mouse.x)
            mouse.netdy += Math.abs(e.clientY - mouse.y)
            mouse.dx += e.clientX - mouse.x
            mouse.dy += e.clientY - mouse.y

            mouse.x = e.clientX
            mouse.y = e.clientY

            // Return if we are under the threshold
            if (mouse.netdx + mouse.netdy < MouseMoveThreshold) {
                return
            }

            if (!mouse.draggingX && !mouse.draggingY) {
                const total = mouse.netdx + mouse.dy
                if (mouse.netdx / total > MouseComboMoveThreshold) {
                    mouse.draggingX = true
                } else if (mouse.netdy / total > MouseComboMoveThreshold) {
                    mouse.draggingY = true
                } else {
                    mouse.draggingX = true
                    mouse.draggingY = true
                }
            }

            mouse.click = false

            if (mouse.draggingX && mouse.button == 1)
                _this.mouseDraggedXPrimary(mouse.x, mouse.dx)
            if (mouse.draggingY && mouse.button == 1)
                _this.mouseDraggedYPrimary(mouse.y, mouse.dy)
            if (mouse.draggingX && mouse.button == 2)
                _this.mouseDraggedXSecondary(mouse.x, mouse.dx)
            if (mouse.draggingY && mouse.button == 2)
                _this.mouseDraggedYSecondary(mouse.y, mouse.dy)

            mouse.dx = 0
            mouse.dy = 0
            e.preventDefault()
        }, false)

        // Set up touch events for mobile
        this.canvas.addEventListener("touchstart", (e) => {
            var touch = e.touches[0]
            var mouseEvent = new MouseEvent("mousedown", {
                clientX: touch.clientX,
                clientY: touch.clientY,
                buttons: e.touches.length,
            })
            _this.canvas.dispatchEvent(mouseEvent)
            e.preventDefault()
        }, false)
        this.canvas.addEventListener("touchend", function (e) {
            var mouseEvent = new MouseEvent("mouseup", {})
            _this.canvas.dispatchEvent(mouseEvent)
            e.preventDefault()
        }, false)
        this.canvas.addEventListener("touchmove", function (e) {
            var touch = e.touches[0]
            var mouseEvent = new MouseEvent("mousemove", {
                clientX: touch.clientX,
                clientY: touch.clientY,
            })
            _this.canvas.dispatchEvent(mouseEvent)
            e.preventDefault()
        }, false)

        // Prevent right click on canvas
        this.canvas.addEventListener("contextmenu", function (e) {
            e.preventDefault()
            return false
        })

        // Prevent scrolling when touching the canvas
        document.body.addEventListener("touchstart", function (e) {
            if (e.target == _this.canvas) {
                e.preventDefault()
            }
        }, false)
        document.body.addEventListener("touchend", function (e) {
            if (e.target == _this.canvas) {
                e.preventDefault()
            }
        }, false)
        document.body.addEventListener("touchmove", function (e) {
            if (e.target == _this.canvas) {
                e.preventDefault()
            }
        }, false)

        window.gl = this.canvas.getContext("webgl2")

        if (gl == null) {
            alert(":(")
            return
        }

        this.loadData()

        this.controlbar = new ControlBar()
    }

    render(now, delta) {
        // Rerun this every frame because the user may have resized the window and canvas
        this.setupView()

        let perspectiveMatrix = this.camera.perspective
        let viewMatrix = this.camera.view
        let viewInverseMatrix = mat4.create()
        mat4.invert(viewInverseMatrix, viewMatrix)

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)

        gl.clearColor(0.0, 0.0, 0.0, 1.0) // Clear to black, fully opaque
        gl.clearDepth(1.0) // Clear everything
        gl.enable(gl.DEPTH_TEST) // Enable depth testing
        gl.depthFunc(gl.LEQUAL) // Near things obscure far things
        gl.cullFace(gl.BACK)
        gl.viewport(0, 0, this.width, this.height)

        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1,
        ])

        // Clear the canvas before we start drawing on it.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        this.cubeRenderPass.run(now, delta, viewMatrix, viewInverseMatrix, perspectiveMatrix)

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        gl.disable(gl.DEPTH_TEST);
        gl.viewport(0, 0, this.width, this.height)

        gl.drawBuffers([
            gl.BACK,
        ])

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        // Render texture to screen
        this.quadRenderPass.run(now, delta, viewMatrix, viewInverseMatrix, perspectiveMatrix)
    }

    loadData() {
        let cubeVS = fetch('../assets/cubeVS.glsl')
        let cubeFS = fetch('../assets/cubeFS.glsl')
        let quadVS = fetch('../assets/quadVS.glsl')
        let quadFS = fetch('../assets/quadFS.glsl')

        const _this = this
        Promise.all([cubeVS, cubeFS, quadVS, quadFS]).then(resources => {
            Promise.all(resources.map(res => {
                return res.text()
            })).then(texts => {
                _this.cubeVSsource = texts[0]
                _this.cubeFSsource = texts[1]
                _this.quadVSsource = texts[2]
                _this.quadFSsource = texts[3]
                _this.beginRender()
            })
        })
    }

    createPrograms() {
        this.cubeVS = gl.createShader(gl.VERTEX_SHADER)
        gl.shaderSource(this.cubeVS, this.cubeVSsource)
        gl.compileShader(this.cubeVS)

        if (!gl.getShaderParameter(this.cubeVS, gl.COMPILE_STATUS)) {
            console.log('Failed to compile shader cubeVS: ' + gl.getShaderInfoLog(this.cubeVS))
            gl.deleteShader(this.cubeVS)
        }

        this.cubeFS = gl.createShader(gl.FRAGMENT_SHADER)
        gl.shaderSource(this.cubeFS, this.cubeFSsource)
        gl.compileShader(this.cubeFS)

        if (!gl.getShaderParameter(this.cubeFS, gl.COMPILE_STATUS)) {
            console.log('Failed to compile shader cubeFS: ' + gl.getShaderInfoLog(this.cubeFS))
            gl.deleteShader(this.cubeFS)
        }

        this.cubeShaderProgram = gl.createProgram()
        gl.attachShader(this.cubeShaderProgram, this.cubeVS)
        gl.attachShader(this.cubeShaderProgram, this.cubeFS)
        gl.linkProgram(this.cubeShaderProgram)

        if (!gl.getProgramParameter(this.cubeShaderProgram, gl.LINK_STATUS)) {
            console.log('Failed to link cubeShaderProgram: ' + gl.getProgramInfoLog(this.cubeShaderProgram))
            gl.deleteProgram(this.cubeShaderProgram)
        }

        this.cubeShaderProgramInfo = {
            program: this.cubeShaderProgram,
            vertexLocation: 8, // gl.getAttribLocation(this.cubeShaderProgram, 'a_position'),
            worldLocation: 0, // gl.getAttribLocation(this.cubeShaderProgram, 'a_world'),
            worldInverseLocation: 4, // gl.getAttribLocation(this.cubeShaderProgram, 'a_world_inverse'),
            cubeidLocation: 9, // gl.getAttribLocation(this.cubeShaderProgram, 'a_cube'),
            faceidLocation: 10, // gl.getAttribLocation(this.cubeShaderProgram, 'a_face'),
            colourLocation: 11, // gl.getAttribLocation(this.cubeShaderProgram, 'a_colour'),
            normalLocation: 12, // gl.getAttribLocation(this.cubeShaderProgram, 'a_normal'),
            modelLocation: gl.getUniformLocation(this.cubeShaderProgram, 'u_model'),
            modelInverseLocation: gl.getUniformLocation(this.cubeShaderProgram, 'u_model_inverse'),
            viewLocation: gl.getUniformLocation(this.cubeShaderProgram, 'u_view'),
            viewInverseLocation: gl.getUniformLocation(this.cubeShaderProgram, 'u_view_inverse'),
            perspectiveLocation: gl.getUniformLocation(this.cubeShaderProgram, 'u_perspective'),
        }

        this.quadVS = gl.createShader(gl.VERTEX_SHADER)
        gl.shaderSource(this.quadVS, this.quadVSsource)
        gl.compileShader(this.quadVS)

        if (!gl.getShaderParameter(this.quadVS, gl.COMPILE_STATUS)) {
            console.log('Failed to compile shader quadVS: ' + gl.getShaderInfoLog(this.quadVS))
            gl.deleteShader(this.quadVS)
        }

        this.quadFS = gl.createShader(gl.FRAGMENT_SHADER)
        gl.shaderSource(this.quadFS, this.quadFSsource)
        gl.compileShader(this.quadFS)

        if (!gl.getShaderParameter(this.quadFS, gl.COMPILE_STATUS)) {
            console.log('Failed to compile shader quadFS: ' + gl.getShaderInfoLog(this.quadFS))
            gl.deleteShader(this.quadFS)
        }

        this.quadShaderProgram = gl.createProgram()
        gl.attachShader(this.quadShaderProgram, this.quadVS)
        gl.attachShader(this.quadShaderProgram, this.quadFS)
        gl.linkProgram(this.quadShaderProgram)

        if (!gl.getProgramParameter(this.quadShaderProgram, gl.LINK_STATUS)) {
            console.log('Failed to link quadShaderProgram: ' + gl.getProgramInfoLog(this.quadShaderProgram))
            gl.deleteProgram(this.quadShaderProgram)
        }

        this.quadShaderProgramInfo = {
            program: this.quadShaderProgram,
            vertexLocation: 0, // gl.getAttribLocation(this.quadShaderProgram, 'a_position'),
            uvLocation: 1, // gl.getAttribLocation(this.quadShaderProgram, 'a_uv'),
            samperLocation: gl.getUniformLocation(this.quadShaderProgram, 'u_sampler'),
        }
    }

    createFramebuffer() {
        this.framebuffer = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)

        // Create colour attachment
        this.frameColourTexture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, this.frameColourTexture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.frameColourTexture,
            0, // No mipmapping (this isn't supported and must be 0 anyways)
        )

        // Create depth attachment
        this.frameDepthBuffer = gl.createRenderbuffer()
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.frameDepthBuffer)
        gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.RENDERBUFFER,
            this.frameDepthBuffer,
        )

        // Create id sampling attachment
        this.frameIDTexture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, this.frameIDTexture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT1,
            gl.TEXTURE_2D,
            this.frameIDTexture,
            0, // No mipmapping (this isn't supported and must be 0 anyways)
        )
    }

    resetSize() {
        this.width = this.canvas.clientWidth
        this.canvas.width = this.width
        this.height = this.canvas.clientHeight
        this.canvas.height = this.height
        gl.viewport(0, 0, this.width, this.height)
        this.camera.generatePerspective(this.width, this.height)

        // Resize render buffers and storage
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
        gl.bindTexture(gl.TEXTURE_2D, this.frameColourTexture)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.width,
            this.height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null,
        )

        gl.bindRenderbuffer(gl.RENDERBUFFER, this.frameDepthBuffer)
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, this.width, this.height)

        gl.bindTexture(gl.TEXTURE_2D, this.frameIDTexture)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0, // LOD 0
            gl.RGBA, // The texel format
            this.width,
            this.height,
            0, // Only borders of 0 width are supported
            gl.RGBA, // Internal format and texel format are the same
            gl.UNSIGNED_BYTE, // Internal texel format
            null,
        )
    }

    setupView() {
        if (this.width == this.canvas.clientWidth && this.height == this.canvas.clientHeight) {
            return
        }
        this.resetSize()
    }

    beginRender() {
        this.createPrograms()
        this.createFramebuffer() // The FBO textures are resized by setupView() -> resetSize()
        this.setupView()

        this.world = new World()

        this.cubeRenderPass = new CubeRenderPass(
            this.cubeShaderProgramInfo,
        )
        this.cubeRenderPass.resize(
            this.world.size,
            this.world.positions,
            this.world.colours,
            this.world.ids,
        )

        this.quadRenderPass = new QuadRenderPass(
            this.quadShaderProgramInfo,
            this.frameColourTexture,
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

    /// Event handling functions
    mouseClicked(x, y) {
        y = this.height - y // The texture is flipped vertically
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
        gl.readBuffer(gl.COLOR_ATTACHMENT1)
        
        let buf = new Uint8Array(4)
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf)
        
        let idvec = vec3.create()
        idvec[0] = buf[0]
        idvec[1] = buf[1]
        idvec[2] = buf[2]
        let faceid = buf[3]

        if (this.controlbar.isDeleting) {
            this.world.userDeleted(idvec, faceid)
        } else {
            this.world.userAdded(idvec, faceid, this.controlbar.currentColour)
        }

        // Update render pass
        this.cubeRenderPass.resize(
            this.world.size,
            this.world.positions,
            this.world.colours,
            this.world.ids,
        )
    }

    mouseDraggedXPrimary(x, dx) {
        this.camera.dragHorizontalPrimary(dx)
    }

    mouseDraggedYPrimary(y, dy) {
        this.camera.dragVerticalPrimary(dy)
    }

    mouseDraggedXSecondary(x, dx) {
        this.camera.dragHorizontalSecondary(dx)
    }

    mouseDraggedYSecondary(y, dy) {
        this.camera.dragVerticalSecondary(dy)
    }
}
