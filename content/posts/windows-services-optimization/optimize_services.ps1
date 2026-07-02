# Windows 服务优化 - 禁用不必要的服务
# 适合场景：大陆个人用户，用火绒代替Defender，用Everything代替搜索
# 日常：微信 + Chrome + Bing，偶尔 WPS/Steam/MuMu/ToDesk
# 请以管理员身份运行

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Windows 服务优化脚本                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 先备份当前服务状态
$backupPath = "$env:USERPROFILE\Desktop\services_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv"
Write-Host "[备份] 当前服务状态 → $backupPath" -ForegroundColor Yellow
Get-Service | Select-Object Name, DisplayName, Status, StartType | Export-Csv $backupPath -NoTypeInformation

# ------- 禁用辅助函数 -------
$stopped = 0; $failed = 0
function Disable-Svc {
    param($Name, $Display)
    $svc = Get-Service -Name $Name -ErrorAction SilentlyContinue
    if (-not $svc) { return }
    
    try {
        Stop-Service -Name $Name -Force -ErrorAction SilentlyContinue
        Set-Service -Name $Name -StartupType Disabled -ErrorAction Stop
        Write-Host "  ✓ $Name ($Display)" -ForegroundColor Green
        $script:stopped++
    } catch {
        Write-Host "  ✗ $Name ($Display) - $_" -ForegroundColor Red
        $script:failed++
    }
}

# ------- 1. Windows Defender / 安全中心（火禄已接管） -------
Write-Host "`n[1/6] Windows Defender + 安全中心（火禄代替）" -ForegroundColor Yellow
Disable-Svc "mpssvc"           "Windows Defender Firewall"
Disable-Svc "wscsvc"           "安全中心"
Disable-Svc "WinDefend"        "Microsoft Defender 防病毒"
Disable-Svc "Sense"            "Defender 高级威胁防护"
Disable-Svc "SecurityHealthService" "Windows 安全中心服务"
Disable-Svc "webthreatdefsvc"  "Web 威胁防御服务"
Disable-Svc "webthreatdefusersvc_2efd2a" "Web 威胁防御用户服务"

# ------- 2. Windows 更新 + 商店 -------
Write-Host "`n[2/6] Windows 更新 + 商店" -ForegroundColor Yellow
Disable-Svc "wuauserv"         "Windows 更新"
Disable-Svc "UsoSvc"           "更新 Orchestrator"
Disable-Svc "WaaSMedicSvc"     "WaaSMedic 更新修复"
Disable-Svc "DoSvc"            "传递优化（更新P2P）"
Disable-Svc "BITS"             "后台智能传输（更新下载）"
Disable-Svc "wisvc"            "Windows 预览体验成员"
Disable-Svc "InstallService"   "Microsoft Store 安装服务"
Disable-Svc "AppXSvc"          "AppX 部署服务（商店）"
Disable-Svc "ClipSVC"          "客户端许可证服务（商店）"
Disable-Svc "LicenseManager"   "Windows 许可证管理器"

# ------- 3. 遥测 + 错误报告 + 推送 -------
Write-Host "`n[3/6] 遥测 / 错误报告 / 推送通知" -ForegroundColor Yellow
Disable-Svc "DiagTrack"        "连接的用户体验和遥测"
Disable-Svc "WerSvc"           "Windows 错误报告"
Disable-Svc "dmwappushservice" "设备管理 WAP 推送"
Disable-Svc "WpnService"       "Windows 推送通知系统"
Disable-Svc "WpnUserService_2efd2a" "Windows 推送通知用户"
Disable-Svc "PhoneSvc"         "Phone Service"
Disable-Svc "WalletService"    "WalletService"

# ------- 4. Microsoft 账号同步 + Xbox -------
Write-Host "`n[4/6] Microsoft 账号 / 同步 / Xbox / 地图" -ForegroundColor Yellow
Disable-Svc "OneSyncSvc_2efd2a"      "同步主机"
Disable-Svc "UnistoreSvc_2efd2a"     "User Data Storage"
Disable-Svc "UserDataSvc_2efd2a"     "User Data Access"
Disable-Svc "PimIndexMaintenanceSvc_2efd2a" "Contact Data"
Disable-Svc "CDPUserSvc_2efd2a"      "连接设备平台用户"
Disable-Svc "MessagingService_2efd2a" "MessagingService"
Disable-Svc "AarSvc_2efd2a"          "Agent Activation Runtime"
Disable-Svc "ConsentUxUserSvc_2efd2a" "ConsentUX"
Disable-Svc "CredentialEnrollmentManagerUserSvc_2efd2a" "Credential Enrollment"
Disable-Svc "UdkUserSvc_2efd2a"      "Udk 用户服务"
Disable-Svc "DeviceAssociationBrokerSvc_2efd2a" "DeviceAssociation"
Disable-Svc "DevicePickerUserSvc_2efd2a" "DevicePicker"
Disable-Svc "DevicesFlowUserSvc_2efd2a" "DevicesFlow"
Disable-Svc "BcastDVRUserService_2efd2a" "GameDVR 广播"
Disable-Svc "CaptureService_2efd2a"  "CaptureService"
Disable-Svc "CloudBackupRestoreSvc_2efd2a" "云备份还原"
Disable-Svc "NPSMSvc_2efd2a"         "Now Playing Session"
Disable-Svc "AndrowsSvr"             "AndrowsSvr"
Disable-Svc "XblAuthManager"         "Xbox 身份验证"
Disable-Svc "XboxNetApiSvc"          "Xbox 网络"
Disable-Svc "XboxGipSvc"             "Xbox 配件"
Disable-Svc "XblGameSave"            "Xbox 游戏存档"
Disable-Svc "MapsBroker"             "下载地图管理器"
Disable-Svc "lfsvc"                  "地理位置服务"

# ------- 5. 其他不必要的系统功能 -------
Write-Host "`n[5/6] 其他系统功能" -ForegroundColor Yellow
Disable-Svc "WSearch"           "Windows Search（用 Everything）"
Disable-Svc "SysMain"           "SysMain (Superfetch, SSD 不需要)"
Disable-Svc "NaturalAuthentication" "Windows Hello 自然身份验证"
Disable-Svc "WMPNetworkSvc"     "Windows Media Player 网络共享"
Disable-Svc "StiSvc"            "Windows Image Acquisition（扫描仪）"
Disable-Svc "SharedAccess"      "Internet 连接共享"
Disable-Svc "icssvc"            "移动热点"
Disable-Svc "PrintScanBrokerService" "Print Scan Broker"
Disable-Svc "PrintWorkflowUserSvc_2efd2a" "Print Workflow"

# ------- 6. 保留按需的服务（设为手动） -------
Write-Host "`n[6/6] 保留的服务设为手动（按需启动）" -ForegroundColor Yellow
Set-Service -Name "Steam Client Service" -StartupType Manual -ErrorAction SilentlyContinue
Write-Host "  ○ Steam Client Service → Manual" -ForegroundColor Gray
Set-Service -Name "MuMuRemoteService" -StartupType Manual -ErrorAction SilentlyContinue
Write-Host "  ○ MuMuRemoteService → Manual" -ForegroundColor Gray
Set-Service -Name "ToDesk_Service" -StartupType Manual -ErrorAction SilentlyContinue
Write-Host "  ○ ToDesk_Service → Manual" -ForegroundColor Gray
Set-Service -Name "wpscloudsvr" -StartupType Manual -ErrorAction SilentlyContinue
Write-Host "  ○ WPS Office Cloud → Manual" -ForegroundColor Gray

# ------- 总结 -------
Write-Host "`n═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  操作完成" -ForegroundColor Green
Write-Host "  成功禁用: $stopped  失败: $failed" -ForegroundColor Green
Write-Host "  备份文件: $backupPath" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "保留的运行中服务:" -ForegroundColor Yellow
Write-Host "  火绒 (HipsDaemon) - 安全防护" 
Write-Host "  ASUS 系列 - 键盘/风扇/灯效"
Write-Host "  Everything - 文件搜索"
Write-Host "  SakuraFrp - 内网穿透"
Write-Host "  Wallpaper Engine - 壁纸"
Write-Host "  NVIDIA Display - 显卡驱动"
Write-Host "  音频 (Realtek/Dolby) - 声卡驱动"
Write-Host ""
Write-Host "如需恢复，请运行:" -ForegroundColor Gray
Write-Host "  Import-Csv '$backupPath' | ForEach-Object { Set-Service -Name `$_.Name -StartupType `$_.StartType }"
