---
title: "安装 PowerShell 7.6 LTS + Compact OS 释放 C 盘空间"
date: 2026-07-09
draft: false
tags: ["PowerShell", "Windows", "CompactOS", "C盘清理", ".NET 10"]
categories: ["折腾笔记"]
summary: "安装最新 PowerShell 7.6 LTS（基于 .NET 10），再用 Compact OS 一键释放 3-8G C 盘空间。"
---

## 安装 PowerShell 7.6 LTS

PowerShell 7.6 基于 .NET 10，跨平台、持续开发。Windows 自带的 5.1 已停止功能更新。

### 新功能

- Tab 自动补全优化
- PSReadLine、PSResourceGet、ThreadJob 升级
- Get-Clipboard -Delimiter 等命令增强

### 安装

winget install --id Microsoft.PowerShell --source winget

## Compact OS

微软官方 C 盘瘦身方案。

Compact /CompactOS:Always

我的 256G SSD 释放约 3.4GB。

Compact /CompactOS:Never 可恢复。
