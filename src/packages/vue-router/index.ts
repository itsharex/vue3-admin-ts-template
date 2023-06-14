import env from "@/utils/tools/env";
import { createRouter, createWebHistory } from "vue-router";
import routes from "./routes";
import piniaRoutes from "@/config/pinia/routes";
import { RouteConfig } from "types";
import global from "@/config/pinia/global";

const router = createRouter({
    history: createWebHistory(),
    routes
});

let timer = 0;
let start = 0;

/**
 * 递归处理路由
 */
const initRoute = (): void => {
    const keepAliveName: string[] = [];
    const setRoutes = (tmpRoutes: RouteConfig[]) => {
        let cloneData: RouteConfig[] = [];
        tmpRoutes.sort((a, b) => (b.meta?.sort || 1) - (a.meta?.sort || 1));
        // tmpRoutes = tmpRoutes.filter((item) => !item.meta?.hidden);
        cloneData = [...tmpRoutes];
        for (const key in tmpRoutes) {
            if (tmpRoutes[key].meta?.keepAliveName) {
                keepAliveName.push(tmpRoutes[key].meta?.keepAliveName as string);
            }
            if (tmpRoutes[key].children?.length) {
                cloneData[key].children = setRoutes(tmpRoutes[key].children || []);
            }
        }
        return cloneData;
    };
    const res = setRoutes(routes[0].children as unknown as RouteConfig[]);
    piniaRoutes().SET_ROUTES(res);
    global().keepaliveList = keepAliveName;
};

//路由前置守卫
router.beforeEach(async (to, from, next) => {
    if (!piniaRoutes().routes.length) {
        initRoute();
    }
    // console.log("路由前置守卫：", to, from);
    document.title = <string>to.meta?.title || "";
    start = new Date().getTime();
    /** 资源没有加载完成的时候，给loading，为防止资源已加载完毕，加上延迟避免闪屏 */
    timer = window.setTimeout(() => {
        if (env.dev()) {
            console.warn(`执行路由定时器：${timer}`);
        }
        if (timer && env.dev()) {
            document.getElementById("index-loading")?.setAttribute("style", "display:auto");
        }
    }, 500);
    //正常跳转
    next();
});

router.afterEach((to) => {
    if (env.dev()) {
        console.warn(`路由耗时：${new Date().getTime() - start}，定时器：${timer}`);
    }
    if (timer) {
        if (env.dev()) {
            console.warn(`清除路由定时器：${timer}`);
        }
        clearTimeout(timer);
        timer = 0;
    }
    document.getElementById("index-loading")?.setAttribute("style", "display:none");
    piniaRoutes().CREATE_NAVTAG(to);
});

export default router;
