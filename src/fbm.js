import { noise3d } from './noise.js';

export var fbm3d = ({
  octaves = 8,
  period = 16,
  lacunarity = 2,
  gain = 0.5,
} = {}) => {
  return (x, y, z) => {
    var frequency = 1 / period;
    var amplitude = gain;

    var sum = 0;
    for (var i = 0; i < octaves; i++) {
      sum += amplitude * noise3d(x * frequency, y * frequency, z * frequency);

      frequency *= lacunarity;
      amplitude *= gain;
    }

    return sum;
  };
};
