import { Cube, World } from "./cubes.js"
import { CubeRenderPass, QuadRenderPass } from "./renderpass.js"
import { Camera } from "./camera.js"

const MouseMoveThreshold = 5 // 5px min to count as move instead of click
const MouseComboMoveThreshold = 0.7 // If >x% of movement is in x or y axis then lock to just that type of dragging

export default class GLCanvas {
    constructor() {
        this.canvas = document.querySelector("#main")
        this.width = 0
        this.height = 0

        this.camera = new Camera(
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
        }, false)
        this.canvas.addEventListener('mouseup', (e) => {
            mouse.held = false
            if (mouse.click) {
                _this.mouseClicked(mouse.x, mouse.y)
            }
        }, false)
        this.canvas.addEventListener('mouseleave', (e) => {
            mouse.held = false
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

            if (mouse.draggingX)
                _this.mouseDraggedX(mouse.x, mouse.dx)
            if (mouse.draggingY)
                _this.mouseDraggedY(mouse.y, mouse.dy)

            mouse.dx = 0
            mouse.dy = 0
        }, false)

        // Set up touch events for mobile
        this.canvas.addEventListener("touchstart", (e) => {
            var touch = e.touches[0]
            var mouseEvent = new MouseEvent("mousedown", {
                clientX: touch.clientX,
                clientY: touch.clientY,
            })
            _this.canvas.dispatchEvent(mouseEvent)
        }, false)
        this.canvas.addEventListener("touchend", function (e) {
            var mouseEvent = new MouseEvent("mouseup", {})
            _this.canvas.dispatchEvent(mouseEvent)
        }, false)
        this.canvas.addEventListener("touchmove", function (e) {
            var touch = e.touches[0]
            var mouseEvent = new MouseEvent("mousemove", {
                clientX: touch.clientX,
                clientY: touch.clientY,
            })
            _this.canvas.dispatchEvent(mouseEvent)
        }, false)

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

        let perspectiveMatrix = this.camera.perspective
        let viewMatrix = this.camera.view

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.gl.framebuffer)

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0) // Clear to black, fully opaque
        this.gl.clearDepth(1.0) // Clear everything
        this.gl.enable(this.gl.DEPTH_TEST) // Enable depth testing
        this.gl.depthFunc(this.gl.LEQUAL) // Near things obscure far things

        // Clear the canvas before we start drawing on it.
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

        this.cubeRenderPass.run(now, delta, viewMatrix, perspectiveMatrix)

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)

        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

        // Render texture to screen
        this.quadRenderPass.run(now, delta, viewMatrix, perspectiveMatrix)
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
            vertexLocation: 4, // this.gl.getAttribLocation(this.cubeShaderProgram, 'a_position'),
            worldLocation: 0, // this.gl.getAttribLocation(this.cubeShaderProgram, 'a_world'),
            modelLocation: this.gl.getUniformLocation(this.cubeShaderProgram, 'u_model'),
            viewLocation: this.gl.getUniformLocation(this.cubeShaderProgram, 'u_view'),
            perspectiveLocation: this.gl.getUniformLocation(this.cubeShaderProgram, 'u_perspective'),
        }

        this.quadVS = this.gl.createShader(this.gl.VERTEX_SHADER)
        this.gl.shaderSource(this.quadVS, this.quadVSsource)
        this.gl.compileShader(this.quadVS)

        if (!this.gl.getShaderParameter(this.quadVS, this.gl.COMPILE_STATUS)) {
            console.log('Failed to compile shader quadVS: ' + this.gl.getShaderInfoLog(this.quadVS))
            this.gl.deleteShader(this.quadVS)
        }

        this.quadFS = this.gl.createShader(this.gl.FRAGMENT_SHADER)
        this.gl.shaderSource(this.quadFS, this.quadFSsource)
        this.gl.compileShader(this.quadFS)

        if (!this.gl.getShaderParameter(this.quadFS, this.gl.COMPILE_STATUS)) {
            console.log('Failed to compile shader quadFS: ' + this.gl.getShaderInfoLog(this.quadFS))
            this.gl.deleteShader(this.quadFS)
        }

        this.quadShaderProgram = this.gl.createProgram()
        this.gl.attachShader(this.quadShaderProgram, this.quadVS)
        this.gl.attachShader(this.quadShaderProgram, this.quadFS)
        this.gl.linkProgram(this.quadShaderProgram)

        if (!this.gl.getProgramParameter(this.quadShaderProgram, this.gl.LINK_STATUS)) {
            console.log('Failed to link quadShaderProgram: ' + this.gl.getProgramInfoLog(this.quadShaderProgram))
            this.gl.deleteProgram(this.quadShaderProgram)
        }

        this.quadShaderProgramInfo = {
            program: this.quadShaderProgram,
            vertexLocation: 0, // this.gl.getAttribLocation(this.quadShaderProgram, 'a_position'),
            uvLocation: 1, // this.gl.getAttribLocation(this.quadShaderProgram, 'a_uv'),
        }
    }

    createFramebuffer() {
        this.framebuffer = this.gl.createFramebuffer()
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer)

        // Create colour attachment
        this.frameColourTexture = this.gl.createTexture()
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.frameColourTexture)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT0,
            this.gl.TEXTURE_2D,
            this.frameColourTexture,
            0, // No mipmapping (this isn't supported and must be 0 anyways)
        )

        // Create depth attachment
        this.frameDepthBuffer = this.gl.createRenderbuffer()
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.frameDepthBuffer)
        this.gl.framebufferRenderbuffer(
            this.gl.FRAMEBUFFER,
            this.gl.DEPTH_ATTACHMENT,
            this.gl.RENDERBUFFER,
            this.frameDepthBuffer,
        )

        // Create id sampling attachment
        this.frameIDTexture = this.gl.createTexture()
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.frameIDTexture)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT1,
            this.gl.TEXTURE_2D,
            this.frameIDTexture,
            0, // No mipmapping (this isn't supported and must be 0 anyways)
        )
    }

    resetSize() {
        this.width = this.canvas.clientWidth
        this.canvas.width = this.width
        this.height = this.canvas.clientHeight
        this.canvas.height = this.height
        this.gl.viewport(0, 0, this.width, this.height)
        this.camera.generatePerspective(this.width, this.height)

        // Resize render buffers and storage
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.frameIDTexture)
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            this.width,
            this.height,
            0,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            new Uint8Array(this.width * this.height * 4), // We have to fill 4 components per texel still
            0,
        )
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.frameDepthBuffer)
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT24, this.width, this.height)
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.frameIDTexture)
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0, // LOD 0
            this.gl.R16UI, // The texel format
            this.width,
            this.height,
            0, // Only borders of 0 width are supported
            this.gl.RED_INTEGER, // Internal format and texel format are the same
            this.gl.UNSIGNED_SHORT, // Internal texel format
            new Uint16Array(this.width * this.height * 2), // Slow, but 0-fill it. I guess the packing is bad so we need x2
            0, // Offset in the array
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

        this.cubeRenderPass = new CubeRenderPass(
            this.gl,
            this.cubeShaderProgramInfo,
        )

        this.quadRenderPass = new QuadRenderPass(
            this.gl,
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
        // Intentionally empty for now
    }

    mouseDraggedX(x, dx) {
        this.camera.dragHorizontal(dx)
    }

    mouseDraggedY(y, dy) {
        this.camera.dragVertical(dy)
    }
}
