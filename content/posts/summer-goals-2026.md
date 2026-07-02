---
title: "2026 暑期目标"
date: 2026-07-02
draft: false
tags: ["goals", "acp", "agent", "kafka"]
categories: ["规划"]
summary: "这个暑假集中攻克三个方向：ACP 协议、Kafka 与 Agent 2 UI。"
---

这个暑假的精力集中投入三个方向。

## Kafka

消息队列与流处理平台的学习与实践。Kafka 是分布式系统中解耦、削峰、异步通信的核心组件，也是 Agent 系统间事件驱动架构的基础设施。

关键里程碑：
- 理解 Kafka 核心概念：Topic、Partition、Consumer Group、Offset
- 掌握生产与消费模式、消息可靠性与 Exactly-Once 语义
- 在 Agent 系统中以 Kafka 作为事件总线进行集成实践

## ACP（Agent Communication Protocol）

Agent 间的通信协议研究与实践。目标是深入理解 Agent 间消息传递、任务编排的标准协议，并在项目中落地应用。

关键里程碑：
- 理解 ACP 核心规范与消息模型
- 实现一个简单的 ACP 兼容中间层
- 与现有 Agent 系统集成验证

## Agent 2 UI

下一代 Agent 用户界面。从当前的 CLI / 基础 Web 界面 进化到更直观、更高效的交互形态。

关键方向：
- 交互范式重构：状态可视化、流式响应展示
- 多模态输入输出支持
- 实时性与协作体验优化

---

三个方向互相支撑——Kafka 作为事件总线提供基础设施层的解耦能力，ACP 解决 Agent 间的"神经连接"，Agent 2 UI 解决人与 Agent 的交互界面。暑期结束时目标是有可演示的阶段性成果。
