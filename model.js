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

if (location.protocol !== 'file:') {
  let domain = 'https://zhoudaxia2016.github.io/'
  let project_name = 'threejs-game/'
  for (let model of models) {
    model.url = domain + project_name + model.url.slice(2)
  }
}
