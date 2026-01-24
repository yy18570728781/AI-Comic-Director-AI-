# ReferenceImageSelector 参考图选择器

一个通用的参考图选择组件，支持三种方式选择参考图。

## 功能特性

### 三种选择方式

1. **自定义上传** - 直接上传图片到 OSS
   - 支持拖拽上传
   - 支持多张上传（可配置最大数量）
   - 自动上传到阿里云 OSS
   - 实时预览

2. **资源库** - 从角色库/场景库/道具库选择
   - 按资源类型筛选（角色/场景/道具）
   - 按范围筛选（全局/当前剧本）
   - 多选模式
   - 显示资源名称

3. **本项目图像** - 从当前项目已生成的图像中选择
   - 显示项目所有已生成图像
   - 多选模式
   - 图片预览

## 使用方法

### 基本用法

```typescript
import ReferenceImageSelector from '@/components/ReferenceImageSelector';

function MyComponent() {
  const [visible, setVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleConfirm = (images: string[]) => {
    setSelectedImages(images);
    setVisible(false);
    console.log('选中的图片:', images);
  };

  return (
    <>
      <Button onClick={() => setVisible(true)}>选择参考图</Button>

      <ReferenceImageSelector
        visible={visible}
        onCancel={() => setVisible(false)}
        onConfirm={handleConfirm}
        maxCount={3}
      />
    </>
  );
}
```

### 在表单中使用

```typescript
import { Form, Button } from 'antd';
import ReferenceImageSelector from '@/components/ReferenceImageSelector';

function CharacterForm() {
  const [form] = Form.useForm();
  const [selectorVisible, setSelectorVisible] = useState(false);

  const handleSelectImages = (images: string[]) => {
    form.setFieldsValue({ referenceImages: images });
    setSelectorVisible(false);
  };

  return (
    <Form form={form}>
      <Form.Item label="参考图" name="referenceImages">
        <Button onClick={() => setSelectorVisible(true)}>
          选择参考图
        </Button>
      </Form.Item>

      <ReferenceImageSelector
        visible={selectorVisible}
        onCancel={() => setSelectorVisible(false)}
        onConfirm={handleSelectImages}
        maxCount={3}
        scriptId={currentScriptId}
      />
    </Form>
  );
}
```

### 在图像生成弹窗中使用

```typescript
import ReferenceImageSelector from '@/components/ReferenceImageSelector';

function ImageGenerateModal({ shot, scriptId }) {
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);

  const handleSelectImages = (images: string[]) => {
    setReferenceImages(images);
    setSelectorVisible(false);
  };

  const handleGenerate = () => {
    // 使用选中的参考图生成图像
    generateImage({
      shotId: shot.id,
      referenceImages,
      // ... 其他参数
    });
  };

  return (
    <Modal>
      <Button onClick={() => setSelectorVisible(true)}>
        选择参考图 ({referenceImages.length})
      </Button>

      <ReferenceImageSelector
        visible={selectorVisible}
        onCancel={() => setSelectorVisible(false)}
        onConfirm={handleSelectImages}
        maxCount={3}
        scriptId={scriptId}
        defaultImages={referenceImages}
      />

      <Button onClick={handleGenerate}>生成图像</Button>
    </Modal>
  );
}
```

## Props

| 参数 | 说明 | 类型 | 默认值 | 必填 |
|------|------|------|--------|------|
| visible | 是否显示弹窗 | boolean | - | 是 |
| onCancel | 取消回调 | () => void | - | 是 |
| onConfirm | 确认回调，返回选中的图片 URL 数组 | (images: string[]) => void | - | 是 |
| maxCount | 最多选择几张图片 | number | 3 | 否 |
| projectId | 当前项目 ID（用于"本项目图像"标签页） | number | - | 否 |
| scriptId | 当前剧本 ID（用于筛选资源库） | number | - | 否 |
| defaultImages | 默认选中的图片 URL 数组 | string[] | [] | 否 |

## 文件限制

- 支持格式：jpg, jpeg, png, webp, gif
- 单张图片最大：10MB
- 最多上传：可配置（默认 3 张）

## 注意事项

1. **OSS 配置**：使用前需要配置阿里云 OSS（参考 `server/OSS_SETUP.md`）

2. **后端 API**：
   - 上传接口：`POST /api/oss/upload`
   - 资源库接口：需要实现角色/场景/道具的查询接口

3. **权限控制**：
   - 资源库会根据 `scriptId` 筛选当前剧本的资源
   - 可以选择查看全局资源或当前剧本资源

4. **性能优化**：
   - 图片列表支持虚拟滚动（大量图片时）
   - 图片懒加载

## TODO

- [ ] 实现"本项目图像"标签页的数据获取
- [ ] 实现"资源库"标签页的数据获取
- [ ] 添加图片预览功能
- [ ] 添加图片搜索功能
- [ ] 添加虚拟滚动（大量图片时）
- [ ] 添加图片懒加载
