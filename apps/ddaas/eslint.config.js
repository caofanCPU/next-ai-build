import nextConfig from "eslint-config-next";
import unusedImports from "eslint-plugin-unused-imports";

const config = [
  ...nextConfig,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    ignores: [
      ".source/source.config.mjs",
      // 其他文件或模式
    ],
    rules: {
      // 关闭原生规则，启用 unused-imports 插件
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default config;