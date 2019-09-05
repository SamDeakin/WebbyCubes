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
            new Cube(vec3.fromValues(0, 0, 0), new vec3.fromValues(0.0, 1.0, 0.5)),
        ]
    }

    userTouched(idvec, face) {
        let id = DecodeIDs(idvec)
        // TODO, add or delete cubes
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
