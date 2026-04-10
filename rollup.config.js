import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/irrigation-timer-card.ts",
  output: {
    file: "dist/irrigation-timer-card.js",
    format: "es",
  },
  plugins: [resolve(), typescript(), terser()],
};
