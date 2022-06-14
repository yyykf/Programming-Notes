import { defineUserConfig } from "@vuepress/cli";
import { searchPlugin } from "@vuepress/plugin-search";
import theme from "./theme";

export default defineUserConfig({
    theme,
    // 是否开启默认预加载 js
    shouldPrefetch: (file, type) => false,
    plugins: [
        searchPlugin({
            // 排除首页
            isSearchable: (page) => page.path !== "/",
            maxSuggestions: 10,
            // 禁用热键
            hotKeys: [],
            locales: {
              "/": {
                placeholder: "搜索",
              },
            },
        })
    ]
});
