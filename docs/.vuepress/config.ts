import { defineUserConfig } from "@vuepress/cli";
import { searchPlugin } from "@vuepress/plugin-search";
import theme from "./theme";

export default defineUserConfig({
    head: [
        // Umami tracking
        [
          'script',
          {
            async: true,
            defer: true,
            'data-website-id': '41664a06-4383-4a06-bc87-2e39d03c6661',
            src: 'https://umami.code4j.site/script.js'
          }
        ],
        ['meta', { name: 'baidu_union_verify', content: 'cc3e1bb0f4ab939209d6aaf9f9bdcdcd'}]
    ],
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
