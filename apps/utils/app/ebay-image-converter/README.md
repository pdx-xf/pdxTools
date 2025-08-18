# eBay图片链接转换器

这是一个简单的工具，用于将eBay图片链接从webp格式转换为jpg格式，支持HTML img标签和纯链接两种输入格式。

## 功能特性

- 批量转换多个图片链接
- 自动将.webp扩展名替换为.jpg
- 支持HTML img标签和纯链接两种输入格式
- 输出格式为纯链接
- 支持每行一个链接的输入格式
- 一键复制转换结果
- 包含示例数据便于测试

## 使用方法

1. **输入链接**：在输入框中粘贴webp格式的eBay图片链接，每行一个
2. **转换链接**：点击"转换链接"按钮进行批量转换
3. **复制结果**：转换完成后，点击"复制到剪贴板"按钮复制结果

## 转换示例

**输入：**
```
<img src="https://i.ebayimg.com/images/g/kUYAAOSwzfZoO02Q/s-l1600.webp"/>
https://i.ebayimg.com/images/g/gcoAAOSw54BoO06I/s-l1600.webp
```

**输出：**
```
https://i.ebayimg.com/images/g/kUYAAOSwzfZoO02Q/s-l1600.jpg
https://i.ebayimg.com/images/g/gcoAAOSw54BoO06I/s-l1600.jpg
```

## 技术实现

- 使用正则表达式处理HTML img标签和纯链接两种格式
- 自动将.webp扩展名替换为.jpg
- 输出格式统一为纯链接
- 支持批量处理，自动过滤空行
- 响应式设计，适配不同屏幕尺寸

## 适用场景

- 批量下载eBay商品图片
- 图片格式统一处理
- 链接格式标准化
