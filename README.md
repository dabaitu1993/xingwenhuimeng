# 星文绘梦网站（xingwenhuimeng）

一个静态的作品集网站，用于展示「星文绘梦」AIGC 相关能力与案例。仓库名已对齐为 `xingwenhuimeng`。

## 在线地址
- GitHub Pages：`https://dabaitu1993.github.io/xingwenhuimeng/`

## 本地预览
- 运行：`python3 -m http.server 44336`
- 预览：`http://localhost:44336/`

## 部署与推送
- GitHub 仓库重命名：在仓库 `Settings` → `Repository name` 改为 `xingwenhuimeng`
- 远程地址：`git remote -v` 应显示 `git@github.com:dabaitu1993/xingwenhuimeng.git`
- 推送：`git push github main`

## 结构
- 根目录包含：`index.html`、`styles.css`、`script.js`、`sw.js`、`assets/`
- 所有资源采用相对路径，适配 GitHub Pages 的仓库路径前缀。

## 维护提示
- 如需强制刷新缓存，提升 `index.html` 中 Service Worker 注册的版本号参数（例如 `sw.js?v=0.1.2`）。