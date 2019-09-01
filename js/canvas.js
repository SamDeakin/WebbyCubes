import { Cube, World } from "./cubes.js"
import { CubeRenderPass } from "./renderpass.js"
import { Camera } from "./camera.js"

const MouseMoveThreshold = 5 // 5px min to count as move instead of click

export default class GLCanvas {
    constructor() {
        this.canvas = document.querySelector("#main")
        this.width = 0
        this.height = 0

        this.camera = new Camera(
            [0, 0, 5],
            [0, 0, 0],
            this.width,
            this.height,
        )

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
            mouse.netdx = 0
            mouse.netdy = 0
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
            if (e.x == mouse.x && e.y == mouse.y) {
                return
            }

            mouse.netdx += Math.abs(e.x - mouse.x)
            mouse.netdy += Math.abs(e.y - mouse.y)
            mouse.dx += e.x - mouse.x
            mouse.dy += e.y - mouse.y

            mouse.x = e.x
            mouse.y = e.y

            // Return if we are under the threshold
            if (mouse.netdx + mouse.netdy < MouseMoveThreshold) {
                return
            }

            mouse.click = false
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

        let perspectiveMatrix = this.camera.perspective
        let viewMatrix = this.camera.view

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        this.gl.clearDepth(1.0); // Clear everything
        this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
        this.gl.depthFunc(this.gl.LEQUAL); // Near things obscure far things

        // Clear the canvas before we start drawing on it.
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.cubeRenderPass.run(now, delta, viewMatrix, perspectiveMatrix)
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
            perspectiveLocation: this.gl.getUniformLocation(this.cubeShaderProgram, 'u_perspective'),
        }
    }

    resetSize() {
        this.width = this.canvas.clientWidth
        this.canvas.width = this.width
        this.height = this.canvas.clientHeight
        this.canvas.height = this.height
        this.gl.viewport(0, 0, this.width, this.height)
        this.camera.generatePerspective(this.width, this.height)
    }

    setupView() {
        if (this.width == this.canvas.clientWidth && this.height == this.canvas.clientHeight) {
            return
        }
        this.resetSize()
    }

    beginRender() {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT)

        this.createPrograms()
        this.setupView()

        this.cubeRenderPass = new CubeRenderPass(
            this.gl,
            this.cubeShaderProgramInfo,
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

    mouseDragged(x, y, dx, dy) {
        this.camera.dragHorizontal(dx)
        this.camera.dragVertical(dy)
    }
}
