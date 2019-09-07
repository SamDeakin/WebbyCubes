// Encodes a number into an x,y,z uint8 triplet
function EncodeIDs(idnum) {
    let buf = vec3.create()
    buf[0] = idnum & 255
    buf[1] = (idnum >> 8) & 255
    buf[2] = (idnum >> 16) & 255
    return buf
}

// decodes an x,y,z uint8 triplet into an id number
function DecodeIDs(vector) {
    return vector[0] + (vector[1] << 8) + (vector[2] << 16)
}

class Cube {
    constructor(pos, colour) {
        this.pos = pos
        this.colour = colour
    }
}

class World {
    constructor() {
        this.cubes = [
            new Cube(vec3.fromValues(0, 0, 0), new vec3.fromValues(0.0, 0.0, 0.0)),
            new Cube(vec3.fromValues(0, 2, 0), new vec3.fromValues(1.0, 1.0, 1.0)),
            new Cube(vec3.fromValues(0, -2, 0), new vec3.fromValues(1.0, 1.0, 1.0)),
            new Cube(vec3.fromValues(1, 0, 0), new vec3.fromValues(0.0, 1.0, 0.5)),
            new Cube(vec3.fromValues(2, 0, 0), new vec3.fromValues(0.0, 1.0, 0.5)),
            new Cube(vec3.fromValues(2, 1, 0), new vec3.fromValues(0.0, 1.0, 0.5)),
            new Cube(vec3.fromValues(2, 2, 0), new vec3.fromValues(0.0, 1.0, 0.5)),
            // new Cube(vec3.fromValues(2, -1, 0), new vec3.fromValues(0.0, 1.0, 0.5)),
            new Cube(vec3.fromValues(2, -2, 0), new vec3.fromValues(0.0, 1.0, 0.5)),
            new Cube(vec3.fromValues(-1, 0, 0), new vec3.fromValues(0.5, 1.0, 0.0)),
            new Cube(vec3.fromValues(-2, 0, 0), new vec3.fromValues(0.5, 1.0, 0.0)),
            new Cube(vec3.fromValues(-2, 1, 0), new vec3.fromValues(0.5, 1.0, 0.0)),
            new Cube(vec3.fromValues(-2, 2, 0), new vec3.fromValues(0.5, 1.0, 0.0)),
            // new Cube(vec3.fromValues(-2, -1, 0), new vec3.fromValues(0.5, 1.0, 0.0)),
            new Cube(vec3.fromValues(-2, -2, 0), new vec3.fromValues(0.5, 1.0, 0.0)),
            new Cube(vec3.fromValues(0, 0, 1), new vec3.fromValues(0.0, 0.5, 1.0)),
            new Cube(vec3.fromValues(0, 0, 2), new vec3.fromValues(0.0, 0.5, 1.0)),
            new Cube(vec3.fromValues(0, 1, 2), new vec3.fromValues(0.0, 0.5, 1.0)),
            new Cube(vec3.fromValues(0, 2, 2), new vec3.fromValues(0.0, 0.5, 1.0)),
            // new Cube(vec3.fromValues(0, -1, 2), new vec3.fromValues(0.0, 0.5, 1.0)),
            new Cube(vec3.fromValues(0, -2, 2), new vec3.fromValues(0.0, 0.5, 1.0)),
            new Cube(vec3.fromValues(0, 0, -1), new vec3.fromValues(1.0, 0.0, 0.5)),
            new Cube(vec3.fromValues(0, 0, -2), new vec3.fromValues(1.0, 0.0, 0.5)),
            new Cube(vec3.fromValues(0, 1, -2), new vec3.fromValues(1.0, 0.0, 0.5)),
            new Cube(vec3.fromValues(0, 2, -2), new vec3.fromValues(1.0, 0.0, 0.5)),
            // new Cube(vec3.fromValues(0, -1, -2), new vec3.fromValues(1.0, 0.0, 0.5)),
            new Cube(vec3.fromValues(0, -2, -2), new vec3.fromValues(1.0, 0.0, 0.5)),
        ]
    }

    userAdded(idvec, face, colour) {
        let id = DecodeIDs(idvec)
        
        if (face == 255)
            return // Special not-drawn number (also the same as the colour alpha clear value)

        // Determine the cube position
        let touchedPos = this.cubes[id].pos
        let newPos = [0, 0, 0]
        newPos[0] += touchedPos[0]
        newPos[1] += touchedPos[1]
        newPos[2] += touchedPos[2]

        // Add face contribution
        switch(face) {
        case 1: // front
            newPos[2] += 1
            break
        case 2: // back
            newPos[2] -= 1
            break
        case 3: // top
            newPos[1] += 1
            break
        case 4: // bottom
            newPos[1] -= 1
            break
        case 5: // right
            newPos[0] += 1
            break
        case 6: // left
            newPos[0] -= 1
            break
        }

        this.cubes.push(new Cube(
            vec3.fromValues(newPos[0], newPos[1], newPos[2]),
            vec3.fromValues(colour[0], colour[1], colour[2]),
        ))
    }

    userDeleted(idvec) {
        let id = DecodeIDs(idvec)

        this.cubes.splice(id, 1)
    }

    get size() {
        return this.cubes.length
    }

    get positions() {
        return this.cubes.map(x => x.pos)
    }

    get colours() {
        return this.cubes.map(x => x.colour)
    }

    get ids() {
        let buf = new Array()
        for (let i = 0; i < this.size; i++) {
            buf.push(EncodeIDs(i))
        }
        return buf
    }
}

export {
    Cube,
    World,
}
