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
    // hostname: "https://www.code4j.co/",
    hostname,
    //指定 vuepress build 的输出目录
    dest: "./dist",
    author: {
        name: "鱼开饭",
        url: hostname,
    },
    repo: 'https://github.com/yyykf/Programming-Notes',
    docsDir: "docs",
    // iconPrefix: "iconfont icon-",
    // pure: true,
    navbar: navbarConfig,
    sidebar: sidebarConfig,
    locales: {
        "/": {
            lang: "zh-CN"
        }
    },
    // 自动生成侧边栏
    // sidebar: "structure",
    blog: {
        name: "Code4j",
    },

    // pageInfo: ["Author", "Category", "Tag", "Date", "Original", "Word"],
    // footer:
    // '<a href="https://beian.miit.gov.cn/" target="_blank">鄂ICP备2020015769号-1</a>',
    // displayFooter: true,
    plugins: {
        blog: true,
        mdEnhance: {
            tasklist: true,
            mermaid: true,
            demo: true,
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
