---
title: "PowerShell 自定义快捷命令：一行函数省掉重复操作"
date: 2026-07-03
draft: false
tags: ["powershell", "效率", "workflow"]
categories: ["工具"]
summary: "在 $PROFILE 里加一个函数，输入 gocb 自动切盘 + 启动程序，不开新窗口、不拖文件。"
---

## 痛点

每天要打开 PowerShell，切到 G: 盘，再运行 `codebuddy -y`。懒得每次都敲两行。

## 方案一：拖文件到终端

最初想法是在桌面上放一个 `.ps1` 脚本，拖进 PowerShell 窗口回车就行：

```powershell
g:
codebuddy -y
```

缺点是每次都要拖，而且 PowerShell 默认禁止运行脚本，得先改执行策略。

## 方案二（最终版）：塞进 `$PROFILE`

定义一个函数，加到 PowerShell 的配置文件里，直接嵌入到现有的终端环境，不需要额外文件、不需要改执行策略、不开新窗口。

### 操作

打开 PowerShell，执行：

```powershell
notepad $PROFILE
```

粘贴以下内容（如果文件不存在就直接创建）：

```powershell
# 自定义快捷命令
function gocb {
    g:
    codebuddy -y
}
```

保存，然后执行 `. $PROFILE` 让配置立即生效。

### 使用

```powershell
# 此后每次开 PowerShell 直接打：
gocb
# 自动切到 G: 盘 → 启动 codebuddy -y
```

### 效果

- 整个操作在**当前窗口**完成，不弹新窗
- 配置文件随 PowerShell 自动加载，无需每次手动执行
- `gocb` 只是一个普通 PowerShell 函数，你可以定义任何其他快捷命令

```powershell
# 比如再加几个
function ll          { Get-ChildItem -Force }
function goproject   { cd G:\projects; code . }
```

`$PROFILE` 是你每天开 PowerShell 都会自动加载的配置文件，花 5 分钟定制它，等于给自己造了一组快捷键。
