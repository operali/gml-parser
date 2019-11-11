

/**
 * ComManager.create(com, a);
 * ComManager.depend(a, b, ...);
 * ComManager.isDependOf(a, b);
 * ComManager.dependList(a);
 */


class ComManager {
    idCount: number;
    entMap: Map<number, Entity>
    geEnt(id: number): Entity {
        return this.entMap.get(id);
    }

    create(Entity)
}

class Entity {
    id: number
    comList: ICompoent[]
}

interface ICompoent {
    ent: IEntity
}

component implements inter,
    idObject

object
component, list,
