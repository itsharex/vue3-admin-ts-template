<template>
    <div
        ref="baseChart"
        class="base-chart"
        :style="{
            width: props.width,
            height: props.height
        }"
    ></div>
</template>
<script lang="ts" setup name="BaseChart">
import echarts from "@/config/echarts/index";
import chinaJSON from "@/config/echarts/map/chinaChange.json";
import eventBus, { EVENT_CHART_RESIZE } from "@/utils/tools/event-bus";
import { debounce } from "lodash-es";

const props = withDefaults(
    defineProps<{
        option: echarts.EChartsCoreOption;
        width?: string | number;
        height?: string | number;
        isMap?: boolean;
        isDark?: boolean;
        id?: string;
    }>(),
    {
        width: "100%",
        height: "100%",
        isMap: false,
        isDark: false,
        id: ""
    }
);

const baseChart = ref(null);
let charts = ref<null | any>(null);

const emits = defineEmits<{
    (e: "init", value: echarts.ECharts): void;
    (e: "click", value: any): void;
}>();

watch(
    [() => props.option, baseChart],
    (v1) => {
        if (v1[0] && v1[1]) {
            nextTick(() => {
                initChart();
            });
        }
    },
    {
        deep: true,
        immediate: true
    }
);

const resizeChart = debounce(() => {
    charts.resize();
}, 150);

function initChart() {
    if (!props.option) {
        return;
    }
    /**
     * 根据 chartsType 判断是当前图表类型是否是地图(map)
     * 注意：该动作必须放在 init 之前执行
     */
    if (props.isMap) {
        //初始化地图
        echarts.registerMap("china", chinaJSON);
    }

    // 基于准备好的dom，初始化echarts实例
    if (!baseChart.value) {
        console.error("base-chart元素不存在");
        return;
    }
    if (charts) {
        charts.dispose?.();
    }
    charts = echarts.init(baseChart.value, props.isDark ? "dark" : "light");
    charts.setOption(props.option);
    charts.on("click", (e: any) => {
        emits("click", e);
    });
    emits("init", charts);

    //ECharts自适应宽度(resize)
    // 监听窗口变化 - 多个图表同时刷新
    window.addEventListener("resize", resizeChart);
}

//监听图表宽高变化，一般由vue-draggable-resizable组件触发
eventBus.on(EVENT_CHART_RESIZE, (id: string) => {
    if (id && id === props.id) {
        //这里取消了防抖，优化体验
        charts.resize();
        // resizeChart();
    }
});

onUnmounted(() => {
    window.removeEventListener("resize", resizeChart);
});
</script>
<style lang="scss" scoped></style>
