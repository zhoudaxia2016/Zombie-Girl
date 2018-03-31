// 节点类
function Node (rect, datas=[]) {
  this.rect = rect
  this.datas = datas
  this.children = null
}

// 四叉树类
function QuadTree (rect, maxObjs = 10) {
  this.root = new Node(rect)
  this.depth = 0
  this.maxObjs =  maxObjs

  this.getDatas = function () {
    let dataSet = []
    this.traversalLeaf(function (datas) {
      dataSet.push(datas)
    }, this.root)
    return dataSet
  }
}

// 检索某个数据
QuadTree.prototype.retrieve = function (data, cb, node) {
  if (node) {
    if (node.children) {
      let children = node.children
      let { left, right, top, bottom } = node.rect
      let ax = (left + right) / 2
      let ay = (top + bottom) / 2
      let indexs
      if (data.rect) {
        indexs = this.getIndex(data.rect, ax, ay)
      } else {
        indexs = new Set([new Point(data.x, data.z).getIndex(ax, ay)])
      }
      if (indexs.size === 0) throw new Error('Object is not in the rect!')
      if (indexs.size === 1) {
        for (let ind of indexs) {
          this.retrieve(data, cb, children[ind])
        }
      } else {
        for (let ind of indexs) {
          let splitData = this.split(data, ind, ax, ay)
          this.retrieve(splitData, cb, children[ind])
        }
      }
    } else {
      cb(node.datas)
    }
  } else {
    this.retrieve(data, cb, this.root)
  }
}

// 遍历叶子节点
QuadTree.prototype.traversalLeaf = function (cb, node) {
  if (node) {
    if (node.children) {
      for (let child of node.children) {
        this.traversalLeaf(cb, child)
      }
    } else if (node.datas.length > 1 ) {
      cb(node.datas)
    }
  } else {
    traversalLeaf(cb, this.root)
  }
}

// 插入数据
QuadTree.prototype.insert = function (data, node) {
  if (node) {
    // 若有子节点，计算属于哪个象限，然后插入对应子节点
    if (node.children) {
      let children = node.children
      let { left, right, top, bottom } = node.rect
      let ax = (left + right) / 2
      let ay = (top + bottom) / 2
      let indexs
      // data有无rect属性可以判断它是有体积的还是只是一个点
      if (data.rect) {
        indexs = this.getIndex(data.rect, ax, ay)
      } else {
        indexs = new Set([new Point(data.x, data.z).getIndex(ax, ay)])
      }
      if (indexs.size === 0) throw new Error('Object is not in the rect!')
      if (indexs.size === 1) {
        for (let ind of indexs) {
          this.insert(data, children[ind])
        }
      } else {
        for (let ind of indexs) {
          let splitData = this.split(data, ind, ax, ay)
          this.insert(splitData, children[ind])
        }
      }
    // 若没有子节点，有data，新建子节点，然后重新将原来的object和新插入的object再插入该node
    } else if (node.datas.length > this.maxObjs) {
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
        this.insert(data_old, node)
      }
      this.insert(data, node)
    // 若没有子节点和数据，直接将object赋值给数据
    } else {
      node.datas.push(data)
    }
  } else {
    this.insert(data, this.root)
  }
}

// 点类
function Point (x, y) {
  this.x = x
  this.y = y
}

// 获取点所在象限
Point.prototype.getIndex = function (ax, ay) {
  let { x, y } = this
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

// 获取数据所在象限
QuadTree.prototype.getIndex = function (rect, ax, ay) {
  let { left, right, top, bottom } = rect
  let points = [
    new Point(left, top),
    new Point(left, bottom),
    new Point(right, top),
    new Point(right, bottom)
  ]
  let set = new Set()
  points.forEach(item => {
    set.add(item.getIndex(ax, ay))
  })
  return set
}

// 切分数据
QuadTree.prototype.split = function (data, index, ax, ay) {
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


// 克隆节点(无参数即克隆整颗树)
QuadTree.prototype.clone = function (node) {
  if (node) {
    let { left, right, top, bottom } = node.rect
    let cloneNode = new Node(new Rect(left, right, top, bottom), node.datas.slice(0))
    if (node.children) {
      let children = node.children
      let cloneChildren = new Array(4)
      for (let i = 0; i < 4; i ++) {
        cloneChildren[i] = this.clone(children[i])
      }
      cloneNode.children = cloneChildren
    }
    return cloneNode
  } else {
    let cloneTree = new QuadTree(this.rect)
    cloneTree.root = this.clone(this.root)
    cloneTree.depth = this.depth
    return cloneTree
  }
}

function rectHitDetect (r1, r2) {
  return (r1.left > r2.right && r1.right < r2.left) && (r1.top > r2.bottom && r1.bottom < r2.top)
}

function createQuadTree () {
  let qtree = new QuadTree(land.rect)
  for (let surroundding of surrounddings) {
    if (!surroundding.model.name.startsWith(SURROUNDDING_NAME.GRASS)) {
      qtree.insert({ obj: surroundding, rect: surroundding.rect })
    }
  }
  return qtree
}

function typeCheck (o1, o2, type1, type2) {
  if (o1 instanceof type1) {
    return o2 instanceof type2 ? 1 : 0
  } else if (o2 instanceof type1) {
    return o1 instanceof type2 ? 2 : 0
  }
  return 0
}

function HitPairs () {
  this.pairs = []
  this.types = {
    [HIT_TYPES.CHAR_SURR]: [Character, Surroundding],
    [HIT_TYPES.ZOMB_SURR]: [Zombie, Surroundding],
    [HIT_TYPES.BULL_SURR]: [Bullet, Surroundding],
    [HIT_TYPES.BULL_ZOMB]: [Bullet, Zombie],
    [HIT_TYPES.PERS_ZOMB]: [Person, Zombie],
  }
}

HitPairs.prototype.push = function (obj1, obj2) {
  let types = this.types
  for (let type in types) {
    let a = typeCheck(obj1, obj2, ...types[type])
    if (a !== 0 && this.notInclude(obj1, obj2)) {
      let pair = a === 1 ? [obj1, obj2] : [obj2, obj1]
      pair.type = type
      this.pairs.push(pair)
      return true
    }
  }
  return false
}

HitPairs.prototype.notInclude = function (obj1, obj2) {
  let uuid1 = obj1.model.uuid, uuid2 = obj2.model.uuid
  return this.pairs.findIndex((item) => {
    let u1 = item[0].model.uuid, u2 = item[1].model.uuid
    return (u1 === uuid1 && u2 === uuid2) || (u1 === uuid2 && u2 === uuid1)
  }) === -1
}

function getHitPairs (dataSet) {
  let pairs = new HitPairs()
  for (let datas of dataSet) {
    for (let i = 0; i < datas.length - 1; i ++) {
      for (let j = i + 1; j < datas.length; j ++) {
        let obj1 = datas[i].obj, obj2 = datas[j].obj
        pairs.push(obj1, obj2)
      }
    }
  }
  return pairs
}

function hitDetect (qtree) {
  let cloneTree = qtree.clone()
  cloneTree.insert({ obj: role, rect: role.rect })
  for (let zombie of zombies) {
    cloneTree.insert({ obj: zombie, rect: zombie.rect })
  }
  for (let bullet of bullets) {
    let { x, z } = bullet.model.position
    cloneTree.insert({ obj: bullet, x, z })
  }
  let dataSet = cloneTree.getDatas()
  let hitPairs = getHitPairs(dataSet)
  for (let pair of hitPairs.pairs) {
    let obj1 = pair[0], obj2 = pair[1]
    switch (pair.type) {
      case HIT_TYPES.CHAR_SURR:
      case HIT_TYPES.ZOMB_SURR:
      case HIT_TYPES.PERS_ZOMB:
        if (rectHitDetect(obj1.rect, obj2.rect)) {
          obj1.handleHit()
        }
        break
      case HIT_TYPES.BULL_SURR:
      case HIT_TYPES.BULL_ZOMB:
        let { x, y, z } = obj1.model.position
        let { left, right, top, bottom } = obj2.rect
        let { max, min } = getRange(obj2.model, 'y')
        if (right < x && x < left && min < y && y < max && bottom < z && z < top) {
          obj1.handleHit(obj2)
        }
        break
    }
  }
}
