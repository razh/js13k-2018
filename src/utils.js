export var compose = (...fns) =>
  fns.reduceRight((f, g) => (...args) => f(g(...args)));

export var rearg = fn => (...args) => value => fn(value, ...args);

export var remove = (array, element) => {
  var index = array.indexOf(element);
  if (index >= 0) {
    array.splice(index, 1);
  }
};
