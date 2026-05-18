class BSPNode {
  constructor(x, y, width, height) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.left = null
    this.right = null
    this.room = null
  }
}

export class BSPGenerator {
  constructor(mapWidth, mapHeight, minRoomSize = 8, maxDepth = 5) {
    this.mapWidth = mapWidth
    this.mapHeight = mapHeight
    this.minRoomSize = minRoomSize
    this.maxDepth = maxDepth
  }

  generate() {
    const root = new BSPNode(0, 0, this.mapWidth, this.mapHeight)
    this._split(root, 0)
    const rooms = []
    this._collectRooms(root, rooms)
    const corridors = []
    this._buildCorridors(root, corridors)
    return { rooms, corridors }
  }

  _split(node, depth) {
    if (depth >= this.maxDepth) return
    const splitHorizontal = node.width < node.height
    const minSplit = this.minRoomSize * 2 + 2
    if (splitHorizontal && node.height < minSplit) return
    if (!splitHorizontal && node.width < minSplit) return

    if (splitHorizontal) {
      const split = this.minRoomSize + Math.floor(Math.random() * (node.height - minSplit + 1))
      node.left = new BSPNode(node.x, node.y, node.width, split)
      node.right = new BSPNode(node.x, node.y + split, node.width, node.height - split)
    } else {
      const split = this.minRoomSize + Math.floor(Math.random() * (node.width - minSplit + 1))
      node.left = new BSPNode(node.x, node.y, split, node.height)
      node.right = new BSPNode(node.x + split, node.y, node.width - split, node.height)
    }

    this._split(node.left, depth + 1)
    this._split(node.right, depth + 1)
  }

  _collectRooms(node, rooms) {
    if (!node.left && !node.right) {
      const pad = 2
      node.room = {
        x: node.x + pad,
        y: node.y + pad,
        width: node.width - pad * 2,
        height: node.height - pad * 2
      }
      rooms.push(node.room)
      return
    }
    if (node.left) this._collectRooms(node.left, rooms)
    if (node.right) this._collectRooms(node.right, rooms)
  }

  _getCenter(node) {
    if (node.room) {
      return {
        x: Math.floor(node.room.x + node.room.width / 2),
        y: Math.floor(node.room.y + node.room.height / 2)
      }
    }
    const l = node.left ? this._getCenter(node.left) : null
    const r = node.right ? this._getCenter(node.right) : null
    return l || r
  }

  _buildCorridors(node, corridors) {
    if (!node.left || !node.right) return
    const a = this._getCenter(node.left)
    const b = this._getCenter(node.right)
    if (a && b) corridors.push({ from: a, to: b })
    this._buildCorridors(node.left, corridors)
    this._buildCorridors(node.right, corridors)
  }
}
