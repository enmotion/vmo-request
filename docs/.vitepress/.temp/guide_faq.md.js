import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"常见问题","description":"","frontmatter":{},"headers":[],"relativePath":"guide/faq.md","filePath":"guide/faq.md"}');
const _sfc_main = { name: "guide/faq.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="常见问题" tabindex="-1">常见问题 <a class="header-anchor" href="#常见问题" aria-label="Permalink to &quot;常见问题&quot;">​</a></h1><h2 id="缓存时间为-0-为什么只发送一次" tabindex="-1">缓存时间为 0 为什么只发送一次？ <a class="header-anchor" href="#缓存时间为-0-为什么只发送一次" aria-label="Permalink to &quot;缓存时间为 0 为什么只发送一次？&quot;">​</a></h2><p>0 关闭的是已完成结果的长期缓存，保留等待中的请求合并。分发窗口结束后条目删除；后续请求重新发送。每次都要独立执行，请使用 -1。</p><h2 id="为什么第二次调用仍然失败" tabindex="-1">为什么第二次调用仍然失败？ <a class="header-anchor" href="#为什么第二次调用仍然失败" aria-label="Permalink to &quot;为什么第二次调用仍然失败？&quot;">​</a></h2><p>正 TTL 会缓存普通失败结果。有效期内不会自动刷新。降低 TTL，或使用负值独立执行。取消错误在当前修复中不长期缓存。</p><h2 id="这是状态管理或洋葱中间件框架吗" tabindex="-1">这是状态管理或洋葱中间件框架吗？ <a class="header-anchor" href="#这是状态管理或洋葱中间件框架吗" aria-label="Permalink to &quot;这是状态管理或洋葱中间件框架吗？&quot;">​</a></h2><p>当前公开 API 是请求包装器。内部维护请求状态，但没有状态订阅、<code>use()</code> 或 <code>next()</code> 中间件组合接口。<code>RequestProps.middlConfig</code> 是供应用使用的数据字段。</p><h2 id="可以跨标签页或跨服务器进程合并吗" tabindex="-1">可以跨标签页或跨服务器进程合并吗？ <a class="header-anchor" href="#可以跨标签页或跨服务器进程合并吗" aria-label="Permalink to &quot;可以跨标签页或跨服务器进程合并吗？&quot;">​</a></h2><p>不可以。缓存和并发协调仅属于当前 VmoRequest 实例。没有分布式锁或持久化存储。</p><h2 id="可以手动清空缓存吗" tabindex="-1">可以手动清空缓存吗？ <a class="header-anchor" href="#可以手动清空缓存吗" aria-label="Permalink to &quot;可以手动清空缓存吗？&quot;">​</a></h2><p>当前没有公开的清空接口。需要完全独立的缓存空间时创建新实例；只想绕过缓存时使用负缓存时间。</p><h2 id="结果会深拷贝吗" tabindex="-1">结果会深拷贝吗？ <a class="header-anchor" href="#结果会深拷贝吗" aria-label="Permalink to &quot;结果会深拷贝吗？&quot;">​</a></h2><p>不会。合并者和缓存命中者共享原始结果引用。</p><h2 id="typescript-返回值为什么是-any" tabindex="-1">TypeScript 返回值为什么是 any？ <a class="header-anchor" href="#typescript-返回值为什么是-any" aria-label="Permalink to &quot;TypeScript 返回值为什么是 any？&quot;">​</a></h2><p>为了兼容已有响应拦截器返回业务数据的用法。应用可以在自己的接口层声明返回类型；库目前没有 <code>request&lt;T&gt;()</code> 泛型接口。</p><h2 id="文档和-npm-包的行为为什么可能不同" tabindex="-1">文档和 npm 包的行为为什么可能不同？ <a class="header-anchor" href="#文档和-npm-包的行为为什么可能不同" aria-label="Permalink to &quot;文档和 npm 包的行为为什么可能不同？&quot;">​</a></h2><p>当前站点描述仓库实现，包括尚未发布的可靠性修复。请核对<a href="./upgrade.html">升级说明</a>，不要把文档站上线等同于 npm 新版本发布。</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/faq.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const faq = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  faq as default
};
