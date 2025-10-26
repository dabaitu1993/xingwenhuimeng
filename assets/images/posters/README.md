# 微电影封面放置说明

请将微电影封面图片按以下文件名放入本目录（`assets/images/posters/`）。页面已在 `index.html` 中为每条微电影设置了 `data-poster`，当图片存在时会自动作为封面显示；若缺失，将使用通用占位图 `assets/images/video-placeholder.svg`。

推荐文件名（可自行改为同义名，我可随时调整）：

1. 字节Seedance4.0官方宣传片 → seedance-4.0.jpg
2. 天九先导片 → tianjiu.jpg
3. 仙侠类小说经典片段改编 → xianxia.jpg
4. 都市超能力类小说 → urban-superpower.jpg
5. 儿童系列动画 → children-series.jpg

命名建议：
- 用短横线连接英文或拼音，全部小写，例如 `seedance-4.0.jpg`。
- 若使用中文文件名也可，例如 `天九先导片.jpg`、`仙侠.jpg`，我可以快速把页面指向对应中文名。
- 封面尺寸建议：横版视频优选 16:9（如 1920×1080），文件大小尽量控制在 300KB～800KB。

替换/新增封面流程：
- 将图片拖入本目录，文件名与上表一致即可生效；
- 若使用不同文件名，请告知我，我会同步修改 `index.html` 中对应 `data-poster`；
- 新增微电影时，直接在对应 `<video>` 标签添加 `data-poster="assets/images/posters/你的文件名.jpg"`。

我已为以下五条微电影完成封面字段关联（见 `index.html` 的 `data-poster`）：
- seedance-4.0.jpg
- tianjiu.jpg
- xianxia.jpg
- urban-superpower.jpg
- children-series.jpg

如需批量改为中文文件名或你已有图片名，请发给我列表，我会统一更新。