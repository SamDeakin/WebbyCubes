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

    get size() {
        return this.cubes.length
    }

    get positions() {
        return this.cubes.map(x => x.pos)
    }

    get colours() {
        return this.cubes.map(x => x.colour)
    }
}

export {
    Cube,
    World,
}
