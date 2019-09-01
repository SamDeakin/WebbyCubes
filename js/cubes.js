class Cube {
    constructor(pos, colour) {
        this.pos = pos
        this.colour = colour
    }
}

class World {
    constructor() {
        this.cubes = []
    }

    get packedData() {
        return undefined // TODO
    }
}

export {
    Cube,
    World,
}
