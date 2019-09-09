export class Camera {
    constructor(startingPos, startingAscension, startingRotation, width, height, simrate) {
        this.pos = startingPos
        this.distance = 0.0
        this.ascension = startingAscension
        this.rotation = startingRotation
        this.pan = 0.0

        this.generatePerspective(width, height)

        // Movement params
        this.ddistance = 0.0
        this.dascension = 0.0
        this.drotation = 0.0
        this.dpan = 0.0

        this.dragging = false
        this.simrate = simrate
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
        // Note that initial target values other than 0 have unexpected results
        // on the following transforms. Setting the other transform values
        // results in a more predictable sequence.
        mat4.lookAt(
            out, // Data destination
            this.pos, // Position
            [0.0, 0.0, 0.0], // target
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

    dragVerticalPrimary(dy, now, delta) {
        let pan = dy * 0.03
        this.dopan(pan)

        this.lastAction = now

        this.dpan = pan * this.simrate / delta
    }

    dopan(pan) {
        this.pan += pan
        this.pan = Math.min(this.pan, 89.9)
        this.pan = Math.max(this.pan, -89.9)
    }

    dragHorizontalPrimary(dx, now, delta) {
        let rotation = dx * 0.1
        this.dorotate(rotation)

        this.lastAction = now

        // Translate to simrate
        this.drotation = rotation * this.simrate / delta
    }

    dorotate(rotation) {
        this.rotation += rotation
        this.rotation %= 360.0
    }

    dragVerticalSecondary(dy, now, delta) {
        let distance = dy * 0.005
        this.doslide(distance)

        this.lastAction = now

        this.ddistance = distance * this.simrate / delta
    }

    doslide(distance) {
        this.distance += distance
        this.distance = Math.min(this.distance, this.pos[2] - 0.5)
    }

    dragHorizontalSecondary(dx, now, delta) {
        let ascension = dx * 0.002
        this.doclimb(ascension)

        this.lastAction = now

        this.dascension = ascension * this.simrate / delta
    }

    doclimb(ascension) {
        this.ascension += ascension
    }

    update(delta) {
        if (this.dragging)
            return

        this.ddistance = this.ddistance * 0.95
        this.dascension = this.dascension * 0.95
        this.drotation = this.drotation * 0.95
        this.dpan = this.dpan * 0.95

        // Fall to 0 if below a threshold
        if (Math.abs(this.ddistance) < 0.005)
            this.ddistance = 0
        else
            this.doslide(this.ddistance)

        if (Math.abs(this.dascension) < 0.002)
            this.dascension = 0
        else
            this.doclimb(this.dascension)

        if (Math.abs(this.drotation) < 0.1)
            this.drotation = 0
        else
            this.dorotate(this.drotation)

        if (Math.abs(this.dpan) < 0.03)
            this.dpan = 0
        else
            this.dopan(this.dpan)
    }

    dragStart(now) {
        this.ddistance = 0
        this.dascension = 0
        this.drotation = 0
        this.dpan = 0

        this.lastAction = now

        this.dragging = true
    }

    dragEnd(now, delta) {
        if (!this.dragging)
            return

        if (delta > this.simrate * 2) {
            // The user has stopped moving the mouse for a long time
            // before releasing the button, signalling they do not want more
            // movement.
            this.ddistance = 0
            this.dascension = 0
            this.drotation = 0
            this.dpan = 0
        }

        this.dragging = false
    }
}
