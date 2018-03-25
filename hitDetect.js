// 四叉树类
function QuadTree (rect, maxObjs = 10) {
  this.depth = 0

  // 节点类
  function Node (rect, datas=[]) {
    this.rect = rect
    this.datas = datas
    this.children = null
  }

  this.root = new Node(rect)

  this.clone = function () {
    let cloneTree = new QuadTree(this.rect)
    cloneTree.root = clone(this.root)
    cloneTree.depth = this.depth
    return cloneTree
  }

  function clone (node) {
    let { left, right, top, bottom } = node.rect
    let cloneNode = new Node(new Rect(left, right, top, bottom), node.datas.slice(0))
    if (node.children) {
      let children = node.children
      let cloneChildren = new Array(4)
      for (let i = 0; i < 4; i ++) {
        cloneChildren[i] = clone(children[i])
      }
      cloneNode.children = cloneChildren
    }
    return cloneNode
  }

  this.insert = function (data) {
    insert(this.root, data, 0)
  }

  function insert (node, data, d) {
    // 若有子节点，计算属于哪个象限，然后插入对应子节点
    if (d > this.depth) this.depth = d
    if (node.children) {
      let children = node.children
      let { left, right, top, bottom } = node.rect
      let ax = (left + right) / 2
      let ay = (top + bottom) / 2
      let indexs = getIndex(data.rect, ax, ay)
      if (indexs.size === 0) throw new Error('Object is not in the rect!')
      if (indexs.size === 1) {
        for (let ind of indexs) {
          insert(children[ind], data, d+1)
        }
      } else {
        for (let ind of indexs) {
          let splitData = split(data, ind, ax, ay)
          insert(children[ind], splitData, d+1)
        }
      }
    // 若没有子节点，有data，新建子节点，然后重新将原来的object和新插入的object再插入该node
    } else if (node.datas.length > maxObjs) {
      let children = new Array(4)
      let { left, right, top, bottom } = node.rect
      let ax = (left + right) / 2
      let zx = (top + bottom) / 2
      children[0] = new Node(new Rect(left, ax, top, zx))
      children[1] = new Node(new Rect(ax, right, top, zx))
      children[2] = new Node(new Rect(ax, right, zx, bottom))
      children[3] = new Node(new Rect(left, ax, zx, bottom))
      node.children = children
      let datas = node.datas
      node.datas = []
      for (let data_old of datas) {
        insert(node, data_old, d)
      }
      insert(node, data, d)
    // 若没有子节点和数据，直接将object赋值给数据
    } else {
      node.datas.push(data)
    }
  }

  this.getDatas = function () {
    let dataSet = []
    traversalLeaf(this.root, function (datas) {
      dataSet.push(datas)
    })
    return dataSet
  }

  function traversalLeaf (node, cb) {
    if (node.children) {
      for (let child of node.children) {
        traversalLeaf(child, cb)
      }
    } else if (node.datas.length > 1 ) {
      cb(node.datas)
    }
  }

  function Point (x, y) {
    this.x = x
    this.y = y
  }

  function getPointIndex (point, ax, ay) {
    let { x, y } = point
    if (x > ax) {
      if (y > ay) {
        return 0
      } else {
        return 3
      }
    } else {
      if (y > ay) {
        return 1
      } else {
        return 2
      }
    }
  }

  function getIndex (rect, ax, ay) {
    let { left, right, top, bottom } = rect
    let points = [
      new Point(left, top),
      new Point(left, bottom),
      new Point(right, top),
      new Point(right, bottom)
    ]
    let set = new Set()
    points.forEach(item => {
      set.add(getPointIndex(item, ax, ay))
    })
    return set
  }

  function split (data, index, ax, ay) {
      let { left, right, top, bottom } = data.rect
      let splitRect
      switch (index) {
        case 0:
          splitRect = new Rect(left, Math.max(ax, right), top, Math.max(ay, bottom))
          break
        case 1:
          splitRect = new Rect(Math.min(ax, left), right, top, Math.max(ay, bottom))
          break
        case 2:
          splitRect = new Rect(Math.min(ax, left), right, Math.min(ay, top), bottom)
          break
        case 3:
          splitRect = new Rect(left, Math.max(ax, right), Math.min(ay, top), bottom)
          break
      }
    return { rect: splitRect, obj: data.obj }
  }
}

function rectHitDetect (r1, r2) {
  return (r1.left > r2.right && r1.right < r2.left) && (r1.top > r2.bottom && r1.bottom < r2.top)
}

function createQuadTree () {
  let qtree = new QuadTree(land.rect)
  for (let surroundding of surrounddings) {
    if (!surroundding.model.name.startsWith('grass')) {
      qtree.insert({ obj: surroundding, rect: surroundding.rect })
    }
  }
  return qtree
}

function getHitPairs (dataSet) {
  let pairs = []
  for (let datas of dataSet) {
    for (let i = 0; i < datas.length - 1; i ++) {
      for (let j = i + 1; j < datas.length; j ++) {
        let obj1 = datas[i].obj, obj2 = datas[j].obj
        let a
        if (obj1 instanceof Person && obj2.model.name == 'Icosphere.024') {
          a = 3
        }
        if (obj2 instanceof Person && obj1.model.name == 'Icosphere.024') {
          a = 3
        }
        if ((obj1 instanceof Person && obj2 instanceof Surroundding) || obj2 instanceof Person && obj1 instanceof Surroundding) {
          let uuid1 = obj1.model.uuid, uuid2 = obj2.model.uuid
          if (pairs.findIndex((item) => {
            let u1 = item[0].model.uuid, u2 = item[1].model.uuid
            return (u1 === uuid1 && u2 === uuid2) || (u1 === uuid2 && u2 === uuid1)
          }) === -1) {
            pairs.push([obj1, obj2])
          }
        }
      }
    }
  }
  return pairs
}

function hitDetect (qtree) {
  let cloneTree = qtree.clone()
  cloneTree.insert({ obj: role, rect: role.rect })
  let dataSet = cloneTree.getDatas()
  let hitPairs = getHitPairs(dataSet)
  for (let pairs of hitPairs) {
    let obj1 = pairs[0], obj2 = pairs[1]
    if (rectHitDetect(obj1.rect, obj2.rect)) {
      if (obj1 instanceof Person && obj2 instanceof Surroundding) {
        obj1.retreat()
      }
      if (obj2 instanceof Person && obj1 instanceof Surroundding) {
        obj2.retreat()
      }
    }
  }
}
