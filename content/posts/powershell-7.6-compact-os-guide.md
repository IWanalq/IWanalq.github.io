---
title: "安装 PowerShell 7.6 LTS + Compact OS 释放 C 盘空间"
date: 2026-07-09
draft: false
tags: ["PowerShell", "Windows", "CompactOS", "C盘清理", ".NET 10"]
categories: ["折腾笔记"]
summary: "安装最新 PowerShell 7.6 LTS（基于 .NET 10），再用微软官方 Compact OS 命令一键释放 3-8G C 盘空间，安全无副作用。"
---

## 安装 PowerShell 7.6 LTS

PowerShell 7.6 是微软最新 LTS 长期支持版本，全面基于 **.NET 10** 构建。和 Windows 自带的 Windows PowerShell 5.1 是两回事——7.6 是独立安装、跨平台、持续开发的，而 5.1 已经停止功能更新，只发安全补丁。

### 新功能亮点

- **Tab 自动补全大幅优化**：跨 Provider 路径补全、属性值补全、模块短名称补全
- **核心模块升级**：PSReadLine、PSResourceGet、ThreadJob
- **命令增强**：`Get-Clipboard -Delimiter`、`Get-Command -ExcludeModule`、`Start-Process -Wait` 效率提升
- **引擎优化**：`PSForEach()` / `PSWhere()` 原生别名、Unix `NO_COLOR` 支持
- **实验特性转正**：PSFeedbackProvider、PSNativeWindowsTildeExpansion、PSRedirectToVariable 等

### 安装方法

以管理员身份打开 PowerShell 或 Windows 终端，执行：

```powershell
winget source update
winget install --id Microsoft.PowerShell --source winget
```

装完后在开始菜单搜索 **PowerShell 7** 即可启动，和系统自带的 Windows PowerShell 5.1 共存，互不影响。

查看版本：

```powershell
$PSVersionTable.PSVersion
```

---

## Compact OS：微软官方 C 盘瘦身方案

小容量固态（256G 甚至 128G）用户几乎都遇到过 C 盘飘红的困境。临时文件清了、虚拟内存搬了、休眠关了，Windows 文件夹还是几十 G。

微软官方提供了一套系统级压缩方案：**Compact OS**，专门为小容量设备设计。

### 和普通 NTFS 压缩的区别

| | NTFS 压缩 | Compact OS |
|--|-----------|------------|
| 压缩对象 | 所有文件 | 只压 Windows 系统文件 |
| 性能影响 | 机械硬盘大幅掉速 | 固态几乎无感知 |
| 更新兼容 | 可能导致更新失败 | 系统原生支持更新 |
| 恢复 | 需要手动解压 | 一条命令恢复 |

### 操作步骤

1. 以管理员身份打开命令提示符（Win+R → cmd → Ctrl+Shift+Enter）

2. 查询当前状态：
```
Compact /CompactOS:Query
```

3. 开启压缩：
```
Compact /CompactOS:Always
```

等待 3-10 分钟（视硬盘速度而定），完成后会显示压缩结果。

**我的实际效果**（256G SSD）：
```
已完成对 OS 二进制文件的压缩。

已压缩 19452 个目录中的 42357 个文件。
总共 7,729,894,159 字节的数据保存在 4,358,674,253 字节中。
压缩率为 1.8 到 1。
```

释放了约 **3.4GB** 空间。

### 恢复方法

```powershell
Compact /CompactOS:Never
```

完全可逆，没有任何后遗症。

### 适用场景

**推荐**：256G 及以下小容量固态、平板、迷你主机
**不推荐**：机械硬盘（性能下降明显）、追求极致性能的游戏主机、C 盘空间充足的设备

> 这是所有 C 盘瘦身操作里，风险最低、收益最实在的系统级方案之一。不用删系统文件、不用改注册表，官方原生支持，可进可退。

---

## 参考

- [PowerShell 官方 FAQ](https://aka.ms/PSWindows)
- [系统极客：PowerShell 7.6 LTS 发布](https://www.sysgeek.cn/powershell-7-6-lts-ga-with-install-upgrade-guide/)
- [公众号：C 盘爆红清无可清？微软官方系统压缩技术](https://mp.weixin.qq.com/s/nXRpkDkYQmcLkXjAvmaRKA)
