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
                "the-gaudy-operation-of-initializing-HashMap",
                "use-integer-as-monitor-of-synchronized",
                "how-to-release-native-memory",
                "filechannel-and-mappedbytebuffer",
            ],
        },
        {
            text: 'MySQL',
            prefix: "mysql/",
            collapsable: true,
            children: [
                'about-the-storage-of-char-and-varchar',
                'the-difference-between-in-and-exists-for-sub-query',
                'explain-output-format'
            ],
        },
        {
            text: 'Spring',
            prefix: "spring/",
            collapsable: true,
            children: [
                'how-to-make-operation-executed-after-transaction',
                'the-proxy-mode',
                'the-difference-between-ThreadPoolExecutor-and-ThreadPoolTaskExecutor',
            ],
        },
        {
            text: 'Mybatis',
            prefix: "mybatis/",
            collapsable: true,
            children: [
                'the-secondary-cache-of-mybatis',
                'usage-of-enumeration-in-mybatis'
            ],
        },
        {
            text: 'JVM',
            prefix: "jvm/",
            collapsable: true,
            children: [
                'java-and-thread',
                'the-troubleshooting-tools-of-jvm',
            ],
        },
        {
            text: 'Dubbo',
            prefix: "dubbo/",
            collapsable: true,
            children: [
                'all-of-load-balance-strategies-in-dubbo',
                'the-service-provider-interface-mechanism-of-dubbo',
                'the-rpc-details-in-dubbo',
            ],
        },
        {
            text: '设计模式',
            prefix: "design-pattern/",
            collapsable: true,
            children: [
                'simple-factory-pattern',
                'template-pattern'
            ]
        },
        {
            text: '杂七杂八',
            prefix: "misc/",
            collapsable: true,
            children: [
                'how-to-design-a-thread-safe-queue',
                'the-tutorial-of-class-diagram-of-mermaid',
                'how-to-deploy-vuepress-by-github-actions',
            ]
        },
        {
            text: '单元测试',
            prefix: "unit-test/",
            collapsable: true,
            children: ["the-usage-of-junit5"]
        }
    ],
});
