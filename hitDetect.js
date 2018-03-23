function groundHitDetect (obj, land) {
  let adjust = 0.01
  let pos = obj.position
  let ray = new THREE.Raycaster(pos, new THREE.Vector3(0, -1, 0))
  let hitResults = ray.intersectObjects([land])
  if (hitResults.length > 0) {
    let res = hitResults[0]
    if (res.distance < -0.01) {
      return new THREE.Vector3(0, adjust, 0)
    } else if (res.distance > 0.01) {
      return new THREE.Vector3(0, -adjust, 0)
    } else {
      return new THREE.Vector3(0, 0, 0)
    }
  } else {
    return new THREE.Vector3(0, adjust, 0)
  }
}

// aabb
function Rect (left, right, top, bottom) {
  this.left = left
  this.right = right
  this.top = top
  this.bottom = bottom
}

// Create bounding box
function bbox (obj) {
  let geometry = new THREE.BoxHelper(obj).geometry
  geometry.computeBoundingBox()
  let box = geometry.boundingBox
  return new Rect(box.max.x, box.min.x, box.max.z, box.min.z)
}

// 游戏物体类
function Obj (rect, obj) {
  this.rect = rect
  this.obj = obj
}

// 四叉树类
function QuadTree (rect, maxObjs = 10) {
  depth = 0

  this.depth = function () { return depth }

  // 节点类
  function Node (rect, data=[]) {
    this.rect = rect
    this.data = data
    this.children = null
  }

  let root = new Node(rect)

  this.insert = function (obj) {
    insert(root, obj, 0)
  }

  function insert (node, obj, d) {
    // 若有子节点，计算属于哪个象限，然后插入对应子节点
    if (d > depth) depth = d
    if (node.children) {
      let children = node.children
      let { left, right, top, bottom } = node.rect
      let ax = (left + right) / 2
      let ay = (top + bottom) / 2
      let indexs = getIndex(obj.rect, ax, ay)
      if (indexs.size === 0) throw new Error('Object is not in the area!')
      if (indexs.size === 1) {
        for (let ind of indexs) {
          insert(children[ind], obj, d+1)
        }
      } else {
        for (let ind of indexs) {
          let splitObj = split(obj, ind, ax, ay)
          insert(children[ind], splitObj, d+1)
        }
      }
    // 若没有子节点，有data，新建子节点，然后重新将原来的object和新插入的object再插入该node
    } else if (node.data.length > maxObjs) {
      let children = new Array(4)
      let { left, right, top, bottom } = node.rect
      let ax = (left + right) / 2
      let zx = (top + bottom) / 2
      children[0] = new Node(new Rect(left, ax, top, zx))
      children[1] = new Node(new Rect(ax, right, top, zx))
      children[2] = new Node(new Rect(ax, right, zx, bottom))
      children[3] = new Node(new Rect(left, ax, zx, bottom))
      node.children = children
      let data = node.data
      node.data = []
      for (let obj_old of data) {
        insert(node, obj_old, d)
      }
      insert(node, obj, d)
    // 若没有子节点和数据，直接将object赋值给数据
    } else {
      node.data.push(obj)
    }
  }

  this.retrieve = function (obj) {
    let adjacent_blocks = []
    retrieve(root, obj, adjacent_blocks)
    for (let i = 0, l = adjacent_blocks.length; i < l; i++) {
      let { data, part } = adjacent_blocks[i]
      let rect = part.rect
      for (let o of data) {
        if (rectHitDetect(o.rect, rect)) {
          return true
        }
      }
    }
    return false
  }

  function retrieve (node, obj, ab) {
    if (node.children) {
      let children = node.children
      let { left, right, top, bottom } = node.rect
      let ax = (left + right) / 2
      let ay = (top + bottom) / 2
      let indexs = getIndex(obj.rect, ax, ay)
      if (indexs.size === 0) throw new Error('Object is not in the area!')
      if (indexs.size === 1) {
        for (let ind of indexs) {
          retrieve(children[ind], obj, ab)
        }
      } else {
        for (let ind of indexs) {
          let splitObj = split(obj, ind, ax, ay)
          retrieve(children[ind], splitObj, ab)
        }
      }
    } else if (node.data.length > 0) {
      ab.push({ data: node.data, part: obj })
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

  function split (obj, index, ax, ay) {
      let { left, right, top, bottom } = obj.rect
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
    return new Obj(splitRect, obj.obj)
  }
  this.console = function () {
    console.log(root)
  }
}

// 初始化物体
function initialObj () {
  let objs = {}
  let boy = models.boy.obj
  objs.person = new Obj(bbox(boy), boy)
  let nature_objs = []
  for (let k in nature_group) {
    // 草太小，不需要碰撞检测
    if (k === 'grasses') continue
    let natures = nature_group[k].objs
    natures.forEach(item => {
      nature_objs.push(new Obj(bbox(item), item))
    })
  }
  objs.natures = nature_objs
  return objs
}

function rectHitDetect (r1, r2) {
  return (r1.left > r2.right && r1.right < r2.left) && (r1.top > r2.bottom && r1.bottom < r2.top)
}

function fall () {
  for (let value of Object.values(nature_group)) {
    for (let obj of value.objs) {
      let pos = obj.position.clone()
      let ray = new THREE.Raycaster(pos, new THREE.Vector3(0, -1, 0))
      let geometry = new THREE.BoxHelper(obj).geometry
      geometry.computeBoundingBox()
      let box = geometry.boundingBox
      pos.y = box.min.y
      let hitResults = ray.intersectObjects([models.land.obj])
      if (hitResults.length > 0) {
        let v = new THREE.Vector3(0, -hitResults[0].distance, 0)
        obj.position.add(v)
      }
    }
  }
}

