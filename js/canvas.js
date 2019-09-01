import { cube, world } from "./cubes.js"
import { cubeRenderPass } from "./renderpass.js"

const MouseMoveThreshold = 5 // 5px min to count as move instead of click

export default class glCanvas {
    constructor() {
        this.canvas = document.querySelector("#main")
        this.width = 0
        this.height = 0

        let _this = this
        let mouse = {
            x: 0,
            y: 0,
            dx: 0,
            dy: 0,
            held: false,
            click: false,
        }
        this.canvas.addEventListener('mousedown', (e) => {
            // Set up tracking so we can filter mouseup and mousemove into drag and click
            mouse.held = true
            mouse.click = true
            mouse.x = e.x
            mouse.y = e.y
            mouse.dx = 0
            mouse.dy = 0
        }, false)
        this.canvas.addEventListener('mouseup', (e) => {
            mouse.held = false
            if (mouse.click) {
                _this.mouseClicked(mouse.x, mouse.y)
            }
        }, false)
        this.canvas.addEventListener('mousemove', (e) => {
            if (!mouse.held) {
                return
            }

            // Skip this event if the mouse didn't actually move
            if (e.x == mouse.x && e.y == mouse.y) {
                return
            }

            mouse.dx += Math.abs(e.x - mouse.x)
            mouse.dy += Math.abs(e.y - mouse.y)
            mouse.x = e.x
            mouse.y = e.y

            // Return if we are under the threshold
            if (mouse.click && mouse.dx + mouse.dy < MouseMoveThreshold) {
                return
            }

            _this.mouseDragged(mouse.x, mouse.y, mouse.dx, mouse.dy)
            mouse.dx = 0
            mouse.dy = 0
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

    /// Event handling functions
    mouseClicked(x, y) {
        console.log("click", x, y)
    }

    mouseDragged(x, y, dx, dy) {
        console.log("move", x, y, dx, dy)
    }
}
