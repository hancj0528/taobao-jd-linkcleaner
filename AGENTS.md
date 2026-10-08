## 开发约定

- 每次修改后更新版本号
- 修改所有文件后，如果文件类型支持，必须使用全局 Prettier 格式化：
  `prettier --write <file...>`
- 格式化后运行：
  `git diff --check`
- 若无法调用全局 Prettier，必须说明未格式化以及失败原因。
