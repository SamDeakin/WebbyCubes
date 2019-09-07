export class Camera {
    constructor(startingPos, startingTarget, width, height) {
        this.pos = startingPos
        this.target = startingTarget
        this.distance = 0.0
        this.ascension = 0.0
        this.rotation = 0.0
        this.pan = 0.0

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

        // We specifically transform the ascension and distance at separate points
        // because it feels more natural to use
        mat4.translate(
            out,
            out,
            [0.0, 0.0, this.distance],
        )

        mat4.rotate(
            out,
            out,
            this.pan * Math.PI / 180,
            [1.0, 0.0, 0.0],
        )

        mat4.rotate(
            out,
            out,
            this.rotation * Math.PI / 180,
            [0.0, 0.1, 0.0],
        )

        mat4.translate(
            out,
            out,
            [0.0, this.ascension, 0.0],
        )

        return out
    }

    get perspective() {
        return this.perspectiveMatrix
    }

    dragVerticalPrimary(dy) {
        this.pan += dy * 0.03
        this.pan = Math.min(this.pan, 179.9)
        this.pan = Math.max(this.pan, -179.9)
    }

    dragHorizontalPrimary(dx) {
        this.rotation += (dx * 0.1) % 360.0
    }

    dragVerticalSecondary(dy) {
        this.distance += dy * 0.005
    }

    dragHorizontalSecondary(dx) {
        this.ascension += dx * 0.002
    }
}
