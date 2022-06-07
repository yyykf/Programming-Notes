import { defineUserConfig } from "@vuepress/cli";
import theme from "./theme";

export default defineUserConfig({
    theme,
    // 是否开启默认预加载 js
    shouldPrefetch: (file, type) => false,
});
