export var frag = `
#extension GL_OES_standard_derivatives : enable

precision highp float;
precision highp int;

#define RECIPROCAL_PI 0.31830988618
#define saturate(a) clamp(a, 0.0, 1.0)

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;

struct IncidentLight {
  vec3 color;
  vec3 direction;
};

struct ReflectedLight {
  vec3 directDiffuse;
  vec3 directSpecular;
  vec3 indirectDiffuse;
  vec3 indirectSpecular;
};

struct GeometricContext {
  vec3 position;
  vec3 normal;
  vec3 viewDir;
};

varying vec3 vColor;

uniform vec3 fogColor;
varying float fogDepth;
uniform float fogNear;
uniform float fogFar;

vec3 BRDF_Diffuse_Lambert(const in vec3 diffuseColor) {
  return RECIPROCAL_PI * diffuseColor;
}

vec3 F_Schlick(const in vec3 specularColor, const in float dotLH) {
  float fresnel = exp2((-5.55473 * dotLH - 6.98316) * dotLH);
  return (1.0 - specularColor) * fresnel + specularColor;
}

float G_BlinnPhong_Implicit() {
  return 0.25;
}

float D_BlinnPhong(const in float shininess, const in float dotNH) {
  return RECIPROCAL_PI * (shininess * 0.5 + 1.0) * pow(dotNH, shininess);
}

vec3 BRDF_Specular_BlinnPhong(const in IncidentLight incidentLight, const in GeometricContext geometry, const in vec3 specularColor, const in float shininess) {
  vec3 halfDir = normalize(incidentLight.direction + geometry.viewDir);
  float dotNH = saturate(dot(geometry.normal, halfDir));
  float dotLH = saturate(dot(incidentLight.direction, halfDir));
  vec3 F = F_Schlick(specularColor, dotLH);
  float G = G_BlinnPhong_Implicit();
  float D = D_BlinnPhong(shininess, dotNH);
  return F * (G * D);
}

uniform vec3 ambientLightColor;
vec3 getAmbientLightIrradiance(const in vec3 ambientLightColor) {
  vec3 irradiance = ambientLightColor;
  return irradiance;
}

struct DirectionalLight {
  vec3 direction;
  vec3 color;
};

uniform DirectionalLight directionalLights[NUM_DIR_LIGHTS];

void getDirectionalDirectLightIrradiance(const in DirectionalLight directionalLight, const in GeometricContext geometry, out IncidentLight directLight) {
  directLight.color = directionalLight.color;
  directLight.direction = directionalLight.direction;
}

varying vec3 vViewPosition;

struct BlinnPhongMaterial {
  vec3 diffuseColor;
  vec3 specularColor;
  float specularShininess;
};

void RE_Direct_BlinnPhong(const in IncidentLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight) {
  float dotNL = saturate(dot(geometry.normal, directLight.direction));
  vec3 irradiance = dotNL * directLight.color;
  reflectedLight.directDiffuse += irradiance * BRDF_Diffuse_Lambert(material.diffuseColor);
  reflectedLight.directSpecular += irradiance * BRDF_Specular_BlinnPhong(directLight, geometry, material.specularColor, material.specularShininess);
}

void RE_IndirectDiffuse_BlinnPhong(const in vec3 irradiance, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight) {
  reflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert(material.diffuseColor);
}

void main() {
  vec3 diffuseColor = diffuse;
  ReflectedLight reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));

  diffuseColor *= vColor;

  vec3 fdx = dFdx(vViewPosition);
  vec3 fdy = dFdy(vViewPosition);
  vec3 normal = normalize(cross(fdx, fdy));

  BlinnPhongMaterial material;
  material.diffuseColor = diffuseColor;
  material.specularColor = specular;
  material.specularShininess = shininess;

  GeometricContext geometry;
  geometry.position = -vViewPosition;
  geometry.normal = normal;
  geometry.viewDir = normalize(vViewPosition);
  IncidentLight directLight;

  DirectionalLight directionalLight;
  for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
    directionalLight = directionalLights[i];
    getDirectionalDirectLightIrradiance(directionalLight, geometry, directLight);
    RE_Direct_BlinnPhong(directLight, geometry, material, reflectedLight);
  }

  vec3 irradiance = getAmbientLightIrradiance(ambientLightColor);
  RE_IndirectDiffuse_BlinnPhong(irradiance, geometry, material, reflectedLight);

  vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + emissive;

  float fogFactor = smoothstep(fogNear, fogFar, fogDepth);
  gl_FragColor = vec4(mix(outgoingLight, fogColor, fogFactor), 1.0);
}
`.trim();
