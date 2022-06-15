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
    docsBranch: "master",
    pure: true,
    navbar: navbarConfig,
    sidebar: sidebarConfig,
    locales: {
        "/": {
            routeLocales: {
                "404msg": ["页面丢失了～"]
            },
            metaLocales: {
                editLink: "在 GitHub 上编辑此页",
                origin: "原创",
                prev: "上一篇",
                next: "下一篇",
                contributors: "贡献者",
                lastUpdated: "上次更新时间",
                toc: "目录",
            },
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
