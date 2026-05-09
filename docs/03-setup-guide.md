# 搭建指南

> 本文档将在实际搭建过程中逐步完善

## 前置准备

### 1. VPS 购买

- [ ] 注册搬瓦工账号
- [ ] 选择 CN2 GIA 套餐
- [ ] 选择洛杉矶 DC6/DC9 机房
- [ ] 完成支付

### 2. 工具准备

**Windows**：

- SSH 客户端（Windows Terminal / PuTTY）
- 文本编辑器（VS Code / Notepad++）

**macOS/Linux**：

- 自带 SSH 客户端
- 文本编辑器（VS Code / vim）

### 3. 信息记录

购买后记录以下信息：

```
VPS IP: _______________
SSH 端口: _______________
Root 密码: _______________
```

---

## 第一步：连接 VPS

### SSH 连接

```bash
ssh root@your-vps-ip -p port
```

首次连接会提示确认指纹，输入 `yes`。

### 更新系统

```bash
# Debian/Ubuntu
apt update && apt upgrade -y

# CentOS
yum update -y
```

---

## 第二步：安装代理服务

### 方案选择

推荐使用 **Xray** + **VLESS/XTLS** 协议：

- 性能优秀
- 支持多用户
- 配置灵活

### 安装方式

本仓库当前不维护一键安装脚本。实际安装应以 Xray 官方脚本和当前系统环境为准，执行前先确认脚本来源、系统版本和防火墙策略。

---

## 第三步：配置服务

### 单用户配置

配置模板应放在 `configs/` 并使用占位符，不在正文中维护可能过期的完整配置。

### 多用户配置

详见：[多用户配置](04-multi-user.md)

---

## 第四步：客户端配置

### Windows

推荐客户端：

- v2rayN
- Clash for Windows

### macOS

推荐客户端：

- ClashX
- V2RayX

### iOS

推荐客户端：

- Shadowrocket
- Quantumult X

### Android

推荐客户端：

- v2rayNG
- Clash for Android

---

## 第五步：测试验证

### 1. 连接测试

```bash
# 测试连接
curl -I https://www.google.com
```

### 2. IP 检测

访问：https://ip.sb/

确认显示的是 VPS IP。

### 3. 速度测试

访问：https://fast.com/

测试下载速度。

### 4. Claude 访问测试

- 访问 https://claude.ai/
- 尝试登录
- 检查是否正常

### 5. IP 纯净度检测

访问：https://scamalytics.com/

确认 Fraud Score < 30。

---

## 常见问题

### 无法连接

1. 检查防火墙设置
2. 检查端口是否正确
3. 检查 VPS 是否正常运行

### 速度慢

1. 尝试更换协议
2. 检查本地网络
3. 尝试更换机房

### IP 被污染

1. 检查是否有滥用行为
2. 联系 VPS 提供商更换 IP
3. 考虑更换 VPS

详见：[常见问题](06-troubleshooting.md)

---

## 安全建议

### 1. 修改 SSH 端口

```bash
# 编辑 SSH 配置
nano /etc/ssh/sshd_config

# 修改端口（例如改为 2222）
Port 2222

# 重启 SSH 服务
systemctl restart sshd
```

### 2. 禁用密码登录

```bash
# 配置 SSH 密钥登录后
# 编辑 SSH 配置
nano /etc/ssh/sshd_config

# 禁用密码登录
PasswordAuthentication no

# 重启 SSH 服务
systemctl restart sshd
```

### 3. 配置防火墙

根据实际系统开放服务端口，并确认 SSH 端口不被误锁。防火墙命令随发行版变化，不在本文硬编码。

---

## 下一步

- [ ] 完成基础搭建
- [ ] 配置多用户（如需要）
- [ ] 设置流量监控
- [ ] 定期检查 IP 纯净度

---

## 搭建日志

实际搭建过程记录在：[搭建日志](../notes/build-log.md)
