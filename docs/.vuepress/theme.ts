import { hopeTheme } from "vuepress-theme-hope";
import { navbarConfig } from "./navbar";
import { sidebarConfig } from "./sidebar";

const hostname =
    process.env.HOSTNAME || "https://www.code4j.co/";

export default hopeTheme({
    port: "8080",
    title: "Code4j",
    description: "Code4j",
    logo: "/logo.png",
    hostname,
    //指定 vuepress build 的输出目录
    dest: "./dist",
    author: {
        name: "鱼开饭",
        url: hostname,
    },
    repo: 'https://github.com/yyykf/Programming-Notes',
    docsDir: "docs",
    pure: true,
    navbar: navbarConfig,
    sidebar: sidebarConfig,
    locales: {
        "/": {
            lang: "zh-CN",
            metaLocales: {
                editLink: "在 GitHub 上编辑此页",
                origin: "原创",
                prev: "上一篇",
                next: "下一篇",
            },
        }
    },
    blog: {
        name: "Code4j",
    },
    head: [
        // 百度统计
        [
            "script",
            {},
            `var _hmt = _hmt || [];
            (function() {
              var hm = document.createElement("script");
              hm.src = "https://hm.baidu.com/hm.js?98503eced9a859fd9dba95eeff656c27";
              var s = document.getElementsByTagName("script")[0]; 
              s.parentNode.insertBefore(hm, s);
            })();`
        ]
    ],
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
        comment: {
            provider: "Giscus",
            repo: "yyykf/Programming-Notes",
            repoId: "MDEwOlJlcG9zaXRvcnkzNzk3ODk2Njg=",
            category: "Announcements",
            categoryId: "DIC_kwDOFqMhZM4CPqDu",
            mapping: "title",
            reactionsEnabled: true
        }
        // feed: {
        //     json: true,
        // },
    },
});
