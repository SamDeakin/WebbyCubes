"use strict"

class cube {
    constructor(pos, colour) {
        this.pos = pos
        this.colour = colour
    }
}

class world {
    constructor() {
        this.cubes = []
    }

    get packedData() {
        return undefined // TODO
    }
}
