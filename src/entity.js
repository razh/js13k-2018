export var component_create = options => {
  return {
    parent: undefined,
    update() {},
    ...options,
  };
};

export var entity_add = (entity, ...components) => {
  components.map(component => {
    if (entity_has(entity, component)) {
      return;
    }

    component.parent = entity;
    entity.components.push(component);
  });

  return entity;
};

export var entity_has = (entity, component) => {
  return entity.components.includes(component);
};

export var entity_find = (entity, predicate) => {
  return entity.components.find(predicate);
};

export var entity_filter = (entity, predicate) => {
  return entity.components.filter(predicate);
};

export var entity_remove = (entity, ...components) => {
  components.map(component => {
    var index = entity.components.indexOf(component);

    if (index >= 0) {
      entity.components
        .splice(index, 1)
        .map(component => (component.parent = undefined));
    }
  });
};

export var entity_update = (entity, ...args) => {
  entity.components.map(component => component.update(component, ...args));
};
