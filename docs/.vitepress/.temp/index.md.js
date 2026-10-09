import { resolveComponent, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"","description":"","frontmatter":{"layout":"home","markdownStyles":false,"hero":{"name":"vmo-request","text":"让重复请求<br>共用一次执行。","tagline":"基于 Axios 的请求工具。用熟悉的调用方式，管理并发合并、短期缓存与失败重试。","image":{"src":"/logo.svg","alt":"vmo-request"},"actions":[{"theme":"brand","text":"快速开始","link":"/guide/getting-started"},{"theme":"alt","text":"查看 API","link":"/api/"}]},"features":[{"title":"合并并发请求","details":"相同配置的调用共用一次请求执行，结果统一分发。缓存时间为 0 时也能合并。"},{"title":"按需缓存结果","details":"用毫秒设置 TTL，缓存成功或普通失败结果。负值关闭缓存与合并。"},{"title":"可控的失败重试","details":"设置重试次数、固定延迟与全局上限。取消请求不会继续重试。"}]},"headers":[],"relativePath":"index.md","filePath":"index.md"}');
const _sfc_main = { name: "index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_RequestFlow = resolveComponent("RequestFlow");
  _push(`<div${ssrRenderAttrs(_attrs)}>`);
  _push(ssrRenderComponent(_component_RequestFlow, null, null, _parent));
  _push(`</div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
