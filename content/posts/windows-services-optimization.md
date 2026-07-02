---
title: "Windows 服务精简：禁用不必要的后台服务"
date: 2026-07-02
draft: false
tags: ["windows", "优化", "服务"]
categories: ["折腾笔记"]
summary: "大陆个人用户视角的 Windows 服务优化记录：Firefox 浏览器、火绒安全、Everything 搜索环境下的系统精简。"
---

## 背景

最近在折腾 Windows 服务优化。我的使用场景很简单：

- **日常**：微信 + Firefox/Chrome 浏览器 + Bing 搜索
- **安全**：火绒代替 Windows Defender
- **搜索**：Everything 代替 Windows Search
- **偶尔**：WPS（办公）、Steam（月活）、MuMu 模拟器（季度活）、ToDesk（远程）
- **硬件**：华硕笔记本（需要 Armoury Crate 控制键盘/风扇/灯效）
- **其他**：SakuraFrp（内网穿透）、Wallpaper Engine（壁纸）

微软的商店、更新、Xbox、OneDrive 同步等全套生态我基本不用，完全可以关掉。

## 优化目标

在不影响日常使用的前提下，禁掉所有不必要的 Windows 服务，减少后台开销和磁盘写入。

## 服务分类处理

### 1. Windows Defender → 火绒接管

装了火绒后，Defender 全家桶都可以关：

| 服务 | 说明 |
|------|------|
| `mpssvc` | Windows Defender Firewall |
| `WinDefend` | Microsoft Defender 防病毒 |
| `Sense` | Defender 高级威胁防护 |
| `SecurityHealthService` | Windows 安全中心服务 |
| `wscsvc` | 安全中心 |
| `webthreatdefsvc` | Web 威胁防御服务 |

### 2. Windows 更新 & 商店

| 服务 | 说明 |
|------|------|
| `wuauserv` | Windows Update |
| `UsoSvc` | 更新 Orchestrator |
| `WaaSMedicSvc` | 更新修复 |
| `DoSvc` | 传递优化（P2P 更新分发）|
| `BITS` | 后台智能传输 |
| `InstallService` | Microsoft Store 安装服务 |
| `AppXSvc` | AppX 部署服务 |
| `ClipSVC` | 客户端许可证服务 |

### 3. 遥测与推送

| 服务 | 说明 |
|------|------|
| `DiagTrack` | 连接的用户体验和遥测（关键的数据收集服务）|
| `WerSvc` | Windows 错误报告 |
| `WpnService` | Windows 推送通知系统 |
| `dmwappushservice` | 设备管理 WAP 推送路由 |

### 4. Microsoft 账号同步 & Xbox

禁用了一大批与微软账号、联系人同步、Xbox 相关的服务：

- `OneSyncSvc` / `CDPUserSvc` / `UnistoreSvc` / `UserDataSvc` — 账号同步相关
- `XblAuthManager` / `XboxNetApiSvc` / `XboxGipSvc` / `XblGameSave` — Xbox 全套

### 5. 其他系统功能

| 服务 | 说明 |
|------|------|
| `WSearch` | Windows Search（有 Everything 了）|
| `SysMain` | Superfetch（SSD 不需要）|
| `MapsBroker` | 下载地图管理器 |
| `lfsvc` | 地理位置服务 |
| `NaturalAuthentication` | Windows Hello 生物识别 |

### 6. 保留运行的服务

这些是我明确需要的，保持自动启动：

- **火绒**（HipsDaemon）— 安全防护
- **ASUS 系列**（ArmouryCrate / ASUSOptimization 等）— 键盘、风扇、灯效控制
- **Everything** — 文件搜索
- **SakuraFrp** — 内网穿透
- **Wallpaper Engine** — 桌面壁纸
- **NVIDIA Display Container** — 显卡驱动
- **Realtek/Dolby Audio** — 声卡驱动

### 7. 改为按需启动

以下服务不用时完全不占资源，用到时自动拉起：

- Steam Client Service
- MuMuRemoteService
- ToDesk Service
- WPS Office Cloud Service

## 工具脚本

我写了一个 PowerShell 脚本一键执行上述所有操作：

```powershell
# 禁用服务（需要管理员权限）
function Disable-Svc {
    param($Name, $Display)
    $svc = Get-Service -Name $Name -ErrorAction SilentlyContinue
    if (-not $svc) { return }
    Stop-Service -Name $Name -Force -ErrorAction SilentlyContinue
    Set-Service -Name $Name -StartupType Disabled -ErrorAction Stop
    Write-Host "✓ $Name ($Display)" -ForegroundColor Green
}
```

脚本运行前会自动备份当前服务状态到桌面 CSV 文件，方便恢复。

## 注意事项

1. **管理员权限**：修改服务需要以管理员身份运行 PowerShell
2. **分步测试**：建议不要一次性禁用所有服务，先关掉确定不需要的，观察一段时间再继续
3. **火绒前提**：禁用 Defender 的前提是已经安装了替代安全软件（火绒/智量/卡巴斯基等）
4. **SSD 优化**：SysMain（Superfetch）在 SSD 上收益极低，关掉可以减少后台读写

## 效果

优化后系统空闲状态下的后台进程数明显减少，任务管理器里清爽多了。磁盘和 CPU 的偶发高占用也基本消失。日常使用（微信、浏览器、写代码）没有感觉到任何功能缺失。

## 附：备份与恢复

```powershell
# 恢复服务状态
$backup = Get-ChildItem "$env:USERPROFILE\Desktop\services_backup_*.csv" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Import-Csv $backup.FullName | ForEach-Object {
    Set-Service -Name $_.Name -StartupType $_.StartType -ErrorAction SilentlyContinue
}
```

---

*注：本文是 2026-07-02 的实际折腾记录，不同 Windows 版本的服务列表可能有差异。*
