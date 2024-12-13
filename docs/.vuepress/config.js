import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
 
export default defineUserConfig({
    base: '/yechen.github.io/',
    bundler: viteBundler(),
    theme: defaultTheme({
        // 在这里进行配置
        navbar: [
            // NavbarItem
            { text: '首页', link: '/', },
            // NavbarGroup
            {
                text: 'una的博客',
                children: [
                    { text: 'Github', link: '/' },
                    { text: '知乎', link: '/' },
                    { text: '掘金', link: '/' },
                ],
            },
        ],
        sidebar: [
            {
                text: '前言',
                collapsible: false,
                children: [
                    { text: '内容介绍' },
                    { text: '使用指南' }
                ]
            },
            {
                text: 'MYSQL笔记',
                link: '/Algorithm/Divide&Conquer',
                collapsible: false,
                children: [
                    { text: 'MYSQL笔记', link: '/Algorithm/Divide&Conquer' }
                ],
            }
        ]
    }),
 
    lang: 'zh-CN',
    title: 'una的博客',
    description: '这是我的第一个 VuePress 站点',
})