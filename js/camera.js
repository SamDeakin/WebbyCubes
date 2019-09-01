export class Camera {
    constructor(startingPos, startingTarget, width, height) {
        this.pos = startingPos
        this.target = startingTarget
        this.distance = 0.0
        this.ascension = 0.0
        this.rotation = 0.0

        this.generatePerspective(width, height)
    }

    generatePerspective(width, height) {
        this.perspectiveMatrix = mat4.create()
        mat4.perspective(
            this.perspectiveMatrix,
            60.0 * Math.PI / 180.0, // Vertical FOV in radians
            width / height, // Aspect ratio
            0.1, // Near plane
            100.0, // Far plane
        )
    }

    get view() {
        let out = mat4.create()

        // Build out by applying transformations
        // Do this per-frame to avoid building small math errors over time
        mat4.lookAt(
            out, // Data destination
            this.pos, // Position
            this.target, // target
            [0.0, 1.0, 0.0], // Up, always y direction
        )

        mat4.translate(
            out,
            out,
            [0.0, this.ascension, this.distance],
        )

        mat4.rotate(
            out,
            out,
            this.rotation,
            [0.0, 0.1, 0.0],
        )

        return out
    }

    get perspective() {
        return this.perspectiveMatrix
    }

    dragVertical(dy) {
        this.distance += dy * 0.005
        this.ascension += dy * 0.002
    }

    dragHorizontal(dx) {
        this.rotation += dx * 0.003
    }
}
