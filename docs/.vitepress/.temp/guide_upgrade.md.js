import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"升级与兼容性","description":"","frontmatter":{},"headers":[],"relativePath":"guide/upgrade.md","filePath":"guide/upgrade.md"}');
const _sfc_main = { name: "guide/upgrade.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="升级与兼容性" tabindex="-1">升级与兼容性 <a class="header-anchor" href="#升级与兼容性" aria-label="Permalink to &quot;升级与兼容性&quot;">​</a></h1><p>本页区分仓库中原来的 0.0.9 实现与当前尚未发布的可靠性修复。<code>package.json</code> 的版本号尚未调整；不要据此认为新修复已经发布到 npm。</p><h2 id="保持不变" tabindex="-1">保持不变 <a class="header-anchor" href="#保持不变" aria-label="Permalink to &quot;保持不变&quot;">​</a></h2><ul><li>导出名、构造函数与 <code>request(config, expiredTime, retry, retryDelay)</code> 的参数顺序。</li><li><code>instance</code>、<code>getDefaultConfig()</code>、<code>setDefaultConfig()</code>，以及宽松的 <code>Promise&lt;any&gt;</code> 返回类型。</li><li>POST 合并、普通错误缓存、首次调用策略、零 TTL 分发窗口。</li><li>默认最多重试 9 次、普通 4xx/5xx 重试、固定延迟与负延迟取绝对值。</li><li>结果共享原始对象引用，TTL 从分发时计时。</li><li>重置配置替换默认值，实例模式重建实例并重置拦截器。</li></ul><h2 id="修复的行为差异" tabindex="-1">修复的行为差异 <a class="header-anchor" href="#修复的行为差异" aria-label="Permalink to &quot;修复的行为差异&quot;">​</a></h2><table tabindex="0"><thead><tr><th>场景</th><th>原 0.0.9 实现</th><th>当前仓库实现</th></tr></thead><tbody><tr><td>负 TTL、非实例模式</td><td>可能丢失默认配置</td><td>使用完整合并配置</td></tr><tr><td>表单、二进制、函数配置</td><td>JSON 序列化可能遗漏信息</td><td>按内容或身份生成键</td></tr><tr><td>直接修改实例默认请求头</td><td>缓存键未反映变化</td><td>实例默认配置参与键</td></tr><tr><td>取消请求</td><td>可能重试或缓存取消错误</td><td>不再重试取消，不长期缓存</td></tr><tr><td>已取消 signal 命中缓存</td><td>可能返回成功缓存</td><td>拒绝为取消结果</td></tr><tr><td>实例配置更新失败</td><td>原配置可能已被覆盖</td><td>保留原配置与实例</td></tr><tr><td>不合法重试次数</td><td>可能形成不受控次数</td><td>约束为有限非负整数</td></tr></tbody></table><p>这些修复确实改变了有问题的行为，不宣称所有执行语义与旧版完全相同。</p><h2 id="已有项目如何升级" tabindex="-1">已有项目如何升级 <a class="header-anchor" href="#已有项目如何升级" aria-label="Permalink to &quot;已有项目如何升级&quot;">​</a></h2><ol><li>在测试环境安装待发布的新版本，保持当前 Axios 版本。</li><li>检查认证头、租户切换、拦截器返回值与 <code>setDefaultConfig()</code> 后的重新注册逻辑。</li><li>检查所有写操作是否需要独立执行，以及是否允许重试。</li><li>验证普通失败缓存、取消结果和缓存命中的业务处理。</li><li>通过应用集成测试后灰度升级。</li></ol><h2 id="验证依据" tabindex="-1">验证依据 <a class="header-anchor" href="#验证依据" aria-label="Permalink to &quot;验证依据&quot;">​</a></h2><p>当前仓库提供新旧源码对照测试、TypeScript 调用兼容性检查与 ESM/CJS 发布产物检查。库入口和核心源码的语句、分支、函数、行覆盖率均达到 100%，并设置同样的检查门槛。</p><div class="language-sh vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">npm</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> run</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> check</span></span></code></pre></div><p>100% 源码覆盖率不等同于覆盖所有应用环境。详细测试结果以运行命令生成的报告为准。文档构建不会改变库的运行时 API。</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/upgrade.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const upgrade = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  upgrade as default
};
