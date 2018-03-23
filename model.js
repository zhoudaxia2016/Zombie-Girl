function Model (name, url) {
  this.name = name
  this.url = url
}

let models = {
  boy: new Model('boy', './model/boy.json'),
  land: new Model('Plane', './model/land.json')
}

let nature_group = {
  grasses: {
    name: 'grass',
    objs: []
  },
  trees: {
    name: 'Cylinder',
    objs: []
  },
  rocks: {
    name: 'Icosphere',
    objs: []
  },
  pines: {
    name: 'pine',
    objs: []
  }
}
