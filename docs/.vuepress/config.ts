import { defineUserConfig } from "@vuepress/cli";
import { searchPlugin } from "@vuepress/plugin-search";
import theme from "./theme";

export default defineUserConfig({
    head: [
        // 百度统计
        [
            "script", {},
            `var _hmt = _hmt || [];
            (function() {
              var hm = document.createElement("script");
              hm.src = "https://hm.baidu.com/hm.js?98503eced9a859fd9dba95eeff656c27";
              var s = document.getElementsByTagName("script")[0]; 
              s.parentNode.insertBefore(hm, s);
            })();`
        ],
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
