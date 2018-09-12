export var clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

export var lerp = (x, y, t) => {
  return (1 - t) * x + t * y;
};

export var randFloatSpread = range => {
  return range * (0.5 - Math.random());
};
