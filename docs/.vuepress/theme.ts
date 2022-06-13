import { hopeTheme } from "vuepress-theme-hope";
import { navbarConfig } from "./navbar";
import { sidebarConfig } from "./sidebar";

const hostname =
    process.env.HOSTNAME || "https://www.code4j.co/";

export default hopeTheme({
    port: "8080",
    title: "Code4j",
    description: "Code4j",
    // logo: "/logo.png",
    hostname,
    //指定 vuepress build 的输出目录
    dest: "./dist",
    author: {
        name: "鱼开饭",
        url: hostname,
    },
    repo: 'https://github.com/yyykf/Programming-Notes',
    docsDir: "docs",
    navbar: navbarConfig,
    sidebar: sidebarConfig,
    locales: {
        "/": {
            lang: "zh-CN"
        }
    },
    blog: {
        name: "Code4j",
    },

    footer: '<a href="https://beian.miit.gov.cn/" target="_blank">粤ICP备2021154025号</a>',
    displayFooter: true,
    plugins: {
        blog: true,
        mdEnhance: {
            // 启用 mermaid
            mermaid: true,
            // 启用代码演示
            demo: true,
            // 启用自定义对齐
            align: true,
            // 启用自定义容器
            container: true,
        },
        // feed: {
        //     json: true,
        // },
        // search: {
        //     // https://v2.vuepress.vuejs.org/zh/reference/plugin/search.html
        //     // 排除首页
        //     isSearchable: (page) => page.path !== '/',
        //     maxSuggestions: 10,
        //     hotKeys: ["s", "/"],
        //     // 用于在页面的搜索索引中添加额外字段
        //     getExtraFields: () => [],
        //     locales: {
        //       "/": {
        //         placeholder: "搜索",
        //       },
        //     },
        //   },

    },
});
