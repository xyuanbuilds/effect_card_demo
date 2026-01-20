import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import postcssNesting from "postcss-nesting";
import postcssPxToViewport from "postcss-px-to-viewport";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      localsConvention: "camelCase",
      scopeBehaviour: "local",
      generateScopedName: "[name]__[local]___[hash:base64:5]",
    },
    postcss: {
      plugins: [
        postcssNesting(),
        postcssPxToViewport({
          viewportWidth: 750, // Adjust based on your design's viewport width
          selectorBlackList: [".ignore", ".hairlines"],
          minPixelValue: 1,
          mediaQuery: false,
        }),
      ],
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
