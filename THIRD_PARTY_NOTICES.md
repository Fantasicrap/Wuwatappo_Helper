# 第三方说明

- WuwaTappo 原程序及其内容、角色、配件、表情和界面素材的权利归各自权利人所有。本项目不主张拥有这些素材，也不为它们另行授予许可证。
- 本仓库提交的内容是辅助补丁、测试和打包脚本；构建时从用户提供且摘要匹配的原程序中提取资源。发布的程序包含原程序内容。
- 安装程序由 [Inno Setup](https://jrsoftware.org/) 生成，Inno Setup 的版权归 Jordan Russell、Martijn Laan 等原作者所有。
- 离线 PNG 测试使用 [@napi-rs/canvas](https://github.com/Brooooooklyn/canvas)；它是开发依赖，不随应用执行文件单独分发。

- 手柄采集随发布 EXE 内嵌 [SDL3 3.4.18](https://github.com/libsdl-org/SDL/releases/tag/release-3.4.18) x64 运行库，版权归 Sam Lantinga 等作者所有，按 zlib 许可证分发，完整文本见 [SDL3-LICENSE.txt](licenses/SDL3-LICENSE.txt)。运行时释放原始 DLL，未修改 SDL 二进制。
- 手柄外形为本项目的 SVG 矢量界面，按钮使用设备布局名称，不包含厂商商标图。
- 「爱弥斯」主题的背景图和 EXE 图标来自构建者本机的素材目录，是《鸣潮》同人作品，权利归各自作者和库洛游戏所有。它们不在本仓库内，只在本机构建时写入 EXE。默认背景为 Sanyue Qiushi 的插画，默认图标为粉丝站公开头像，再分发授权均未确认；公开发布前需取得许可或换用有授权的图片。见 [主题说明](docs/主题.md#授权提醒)。

仅供娱乐使用，创作者概不负责。

播放器内置的《远航星的告别》《小小奇迹》《星炬不熄》经授权随本版本分发。最终权利归歌曲作者和库洛游戏公司所有。
