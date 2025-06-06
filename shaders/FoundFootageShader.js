// FoundFootageShader.js
export const FoundFootageShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    varying vec2 vUv;

    // Simple random noise
    float rand(vec2 co){
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      // Grain/noise
      float noise = rand(vUv * time) * 0.08 - 0.04;
      color.rgb += noise;

      // Scanlines
      float scanline = sin(vUv.y * 800.0) * 0.04;
      color.rgb -= scanline;

      // Vignette
      float dist = distance(vUv, vec2(0.5, 0.5));
      color.rgb *= smoothstep(0.8, 0.5, dist);

      gl_FragColor = color;
    }
  `
};