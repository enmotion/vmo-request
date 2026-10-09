import { resolveComponent, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"","description":"","frontmatter":{"layout":"home","markdownStyles":false,"hero":{"name":"vmo-request","text":"Share execution.<br>Skip duplicate work.","tagline":"An Axios utility for concurrent request deduplication, short-lived caching, and configurable retries. Keep the API you know.","image":{"src":"/logo.svg","alt":"vmo-request"},"actions":[{"theme":"brand","text":"Get started","link":"/en/guide/getting-started"},{"theme":"alt","text":"API reference","link":"/en/api/"}]},"features":[{"title":"Deduplicate concurrent calls","details":"Calls with the same configuration share one execution and its result, even with a cache lifetime of zero."},{"title":"Cache on your terms","details":"Set a TTL in milliseconds for successful or ordinary failed results. A negative value disables caching and deduplication."},{"title":"Control retries","details":"Configure retry counts, a fixed delay, and a global limit. Cancelled requests are not retried."}]},"headers":[],"relativePath":"en/index.md","filePath":"en/index.md"}');
const _sfc_main = { name: "en/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_RequestFlow = resolveComponent("RequestFlow");
  _push(`<div${ssrRenderAttrs(_attrs)}>`);
  _push(ssrRenderComponent(_component_RequestFlow, null, null, _parent));
  _push(`</div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("en/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
