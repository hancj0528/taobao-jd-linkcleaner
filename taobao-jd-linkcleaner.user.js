// ==UserScript==
// @name         淘宝京东链接简化
// @namespace    https://github.com/hancj0528/taobao-jd-linkcleaner
// @version      1.0
// @homepageURL  https://github.com/hancj0528/taobao-jd-linkcleaner
// @downloadURL  https://raw.githubusercontent.com/hancj0528/taobao-jd-linkcleaner/main/taobao-jd-linkcleaner.user.js
// @updateURL    https://raw.githubusercontent.com/hancj0528/taobao-jd-linkcleaner/main/taobao-jd-linkcleaner.user.js
// @description  复制并跳转到简洁商品链接，淘宝和天猫保留 skuId，去除推广和跟踪参数。
// @match        https://*.taobao.com/*
// @match        https://*.tmall.com/*
// @match        https://*.jd.com/*
// @match        http://*.taobao.com/*
// @match        http://*.tmall.com/*
// @match        http://*.jd.com/*
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
    "use strict";

    function cleanProductUrl(input) {
        let url;
        try {
            url = new URL(input);
        } catch {
            return null;
        }
        if (!["http:", "https:"].includes(url.protocol)) return null;
        const host = url.hostname.toLowerCase();
        const positiveId = (value) =>
            /^[1-9]\d*$/.test(value || "") ? value : null;
        if (
            host === "taobao.com" ||
            host.endsWith(".taobao.com") ||
            host === "tmall.com" ||
            host.endsWith(".tmall.com")
        ) {
            // 只处理商品详情页，避免把店铺或搜索页的 id 误认成商品。
            const mobileDetail =
                host === "h5.m.taobao.com" &&
                url.pathname === "/awp/core/detail.htm";
            if (
                !mobileDetail &&
                !/\/(?:item\.htm|i\d+\.htm)\/?$/.test(url.pathname)
            )
                return null;
            const pathId = url.pathname.match(/\/i(\d+)\.htm/);
            const id =
                positiveId(url.searchParams.get("id")) ||
                positiveId(pathId?.[1]);
            if (!id) return null;
            const base =
                host === "tmall.com" || host.endsWith(".tmall.com")
                    ? "https://detail.tmall.com/item.htm"
                    : "https://item.taobao.com/item.htm";
            const skuId = url.searchParams.get("skuId");
            const params = new URLSearchParams({ id });
            if (skuId) params.set("skuId", skuId);
            return `${base}?${params}`;
        }
        if (host === "jd.com" || host.endsWith(".jd.com")) {
            const pathId = url.pathname.match(
                /^\/(?:product\/)?([1-9]\d*)\.html\/?$/,
            );
            const isDetail =
                /^(?:item|item\.m|item\.jd\.hk)\.jd\.com$/.test(host) ||
                host === "item.jd.hk" ||
                (host === "m.jd.com" && url.pathname.startsWith("/product/"));
            if (isDetail && pathId)
                return `https://item.jd.com/${pathId[1]}.html`;
        }
        return null;
    }

    const host = document.createElement("div");
    host.style.cssText =
        "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);text-align:center;z-index:2147483647;";
    const root = host.attachShadow({ mode: "closed" });
    root.innerHTML = `<style>
        button{border:0;border-radius:24px;background:#ff5800;color:white;padding:12px 18px;
        font:14px/1.4 system-ui,sans-serif;cursor:pointer;box-shadow:0 3px 14px #0003}
        button:hover{background:#df4900}button:focus-visible{outline:3px solid #1677ff;outline-offset:3px}
        p{display:none;max-width:300px;padding:10px 12px;margin:0 0 10px;border-radius:8px;
        background:#222;color:#fff;font:13px/1.5 system-ui,sans-serif;overflow-wrap:anywhere}
        </style><p role="status" aria-live="polite"></p><button type="button">复制简化链接</button>`;
    document.documentElement.appendChild(host);
    const status = root.querySelector("p");
    let timer;
    function notify(message) {
        clearTimeout(timer);
        status.textContent = message;
        status.style.display = "block";
        timer = setTimeout(() => {
            status.style.display = "none";
        }, 4500);
    }
    function copy() {
        const link = cleanProductUrl(location.href);
        if (!link) {
            notify(
                "请先打开淘宝、天猫或京东商品详情页；短链接请等待跳转完成。",
            );
            return;
        }
        try {
            GM_setClipboard(link, "text", () => {
                notify(`已复制：${link}`);
                if (location.href !== link) location.assign(link);
            });
        } catch {
            notify("复制失败，请检查篡改猴的剪贴板权限。");
        }
    }
    root.querySelector("button").addEventListener("click", copy);
    GM_registerMenuCommand("简化、复制并跳转", copy);
})();
