import { sidebar } from "vuepress-theme-hope";

export const sidebarConfig = sidebar({
    // 应该把更精确的路径放置在前边
    "/": [
        {
            text: "Java",
            prefix: "java/",
            collapsable: true,
            children: [
                "the-notes-of-object-clone",
                "what-happens-to-string-intern",
                "the-magic-number-that-hides-under-Threadlocal",
                "the-gaudy-operation-of-initializing-HashMap"
            ],
        },
        {
            text: 'MysQL',
            prefix: "mysql/",
            collapsable: true,
            children: ['about-the-storage-of-char-and-varchar'],
        },
        {
            text: 'Spring',
            prefix: "spring/",
            collapsable: true,
            children: ['how-to-make-operation-executed-after-transaction','the-proxy-mode'],
        },
        {
            text: 'Mybatis',
            prefix: "mybatis/",
            collapsable: true,
            children: ['the-secondary-cache-of-mybatis'],
        },
        {
            text: '设计模式',
            prefix: "design-pattern/",
            collapsable: true,
            children: ["simple-factory-pattern"]
        },
        {
            text: '单元测试',
            prefix: "unit-test/",
            collapsable: true,
            children: ["the-usage-of-junit5"]
        }
    ],
});
