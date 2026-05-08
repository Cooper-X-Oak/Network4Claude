# 多用户配置

## 使用场景

- 2-3 人共享 VPS
- 独立管理每个用户
- 监控各用户流量
- 方便添加/删除用户

---

## 配置方案

### 使用 Xray 多用户功能

Xray 支持为每个用户分配独立的 UUID，便于管理和监控。

---

## 配置步骤

### 1. 生成 UUID

为每个用户生成独立的 UUID：

```bash
# 方法一：使用 uuidgen
uuidgen

# 方法二：使用 Xray 工具
xray uuid
```

记录每个用户的 UUID：
```
用户 1: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
用户 2: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
用户 3: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 2. 修改配置文件

编辑 Xray 配置文件：

```json
{
  "inbounds": [
    {
      "port": 443,
      "protocol": "vless",
      "settings": {
        "clients": [
          {
            "id": "用户1的UUID",
            "email": "user1@example.com"
          },
          {
            "id": "用户2的UUID",
            "email": "user2@example.com"
          },
          {
            "id": "用户3的UUID",
            "email": "user3@example.com"
          }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "tcp",
        "security": "tls",
        "tlsSettings": {
          "certificates": [
            {
              "certificateFile": "/path/to/cert.crt",
              "keyFile": "/path/to/cert.key"
            }
          ]
        }
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom"
    }
  ]
}
```

### 3. 重启服务

```bash
systemctl restart xray
```

---

## 客户端配置

### 为每个用户生成配置

**用户 1 配置**：
```
服务器地址: your-vps-ip
端口: 443
UUID: 用户1的UUID
协议: VLESS
传输: TCP
安全: TLS
```

**用户 2 配置**：
```
服务器地址: your-vps-ip
端口: 443
UUID: 用户2的UUID
协议: VLESS
传输: TCP
安全: TLS
```

### 配置文件模板

详见：[用户配置模板](../configs/user-template.json)

---

## 流量监控

### 查看各用户流量

```bash
# 使用 Xray 日志
tail -f /var/log/xray/access.log | grep "user1@example.com"
```

### 设置流量限制（可选）

```bash
# 待补充：流量限制脚本
```

---

## 用户管理

### 添加新用户

1. 生成新的 UUID
2. 编辑配置文件，添加新用户
3. 重启 Xray 服务
4. 生成客户端配置

**快速添加脚本**：
```bash
# 待补充：自动化脚本
bash add-user.sh username
```

### 删除用户

1. 编辑配置文件，删除用户条目
2. 重启 Xray 服务

### 暂停用户

1. 注释掉用户配置
2. 重启 Xray 服务

---

## 使用规范

### 制定使用规则

建议与共享用户约定：

**✅ 允许的使用**：
- 日常浏览网页
- 观看视频（YouTube、Netflix 等）
- 使用 AI 工具（Claude、ChatGPT 等）
- 开发测试
- 学术研究

**❌ 禁止的使用**：
- 批量注册账号
- 爬虫、刷量
- BT 下载（会被投诉）
- 发送垃圾邮件
- 任何违法行为

### 使用规范模板

```markdown
# VPS 使用规范

## 目的
保护 IP 纯净度，确保所有人稳定使用。

## 允许
- 日常浏览、视频、AI 工具、开发

## 禁止
- 批量注册、爬虫、BT 下载、垃圾邮件

## 后果
一人违规可能导致 IP 被污染，影响所有人使用。

## 流量
- 总流量：500GB/月
- 建议每人：< 150GB/月
- 超出请提前沟通

## 联系
有问题请及时沟通。
```

---

## 成本分摊

### 费用计算

**总成本**：$50/年（约 350 元/年）

**2 人分摊**：
- 每人：175 元/年
- 每人：15 元/月

**3 人分摊**：
- 每人：117 元/年
- 每人：10 元/月

### 支付方式

建议：
- 一人先垫付
- 其他人按月/季度/年转账
- 或使用微信/支付宝 AA

---

## 监控与维护

### 定期检查

**每周**：
- 检查服务是否正常
- 查看流量使用情况

**每月**：
- 检查 IP 纯净度
- 检查总流量是否接近限额

**每季度**：
- 检查 VPS 账单
- 续费提醒

### 问题处理

**服务中断**：
1. 检查 VPS 是否正常
2. 检查配置是否正确
3. 联系 VPS 提供商

**流量超限**：
1. 检查各用户流量
2. 沟通调整使用习惯
3. 考虑升级套餐

**IP 被污染**：
1. 检查是否有滥用行为
2. 联系 VPS 提供商更换 IP
3. 重新检测纯净度

---

## 下一步

- [ ] 完成多用户配置
- [ ] 分发客户端配置
- [ ] 制定使用规范
- [ ] 设置流量监控

详见：[流量监控](05-monitoring.md)
