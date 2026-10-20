import * as THREE from 'three';

export function disposeObject3D(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  root.traverse((object) => {
    const renderable = object as THREE.Mesh;
    if (renderable.geometry) geometries.add(renderable.geometry);
    if (Array.isArray(renderable.material)) {
      renderable.material.forEach((material) => materials.add(material));
    } else if (renderable.material) {
      materials.add(renderable.material);
    }
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => {
    Object.values(material).forEach((value) => {
      if (value instanceof THREE.Texture) textures.add(value);
    });
    material.dispose();
  });
  textures.forEach((texture) => texture.dispose());
}