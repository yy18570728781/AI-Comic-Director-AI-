import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  message,
  Modal,
  Form,
  InputNumber,
  Select,
  Switch,
  Divider,
  Card,
  Tabs,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  getPlatforms,
  getModels,
  createModel,
  updateModel,
  deleteModel,
  toggleModels,
} from "@/api/model";
import type { ColumnsType } from "antd/es/table";
import type {
  AiModel,
  Platform,
  CreateModelRequest,
  ModelConfig,
  PricingTier,
} from "@/api/model";

const { TextArea } = Input;
const { TabPane } = Tabs;

export default function ModelManagement() {
  const [models, setModels] = useState<AiModel[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState<string>();
  const [platformFilter, setPlatformFilter] = useState<string>();
  const [enabledFilter, setEnabledFilter] = useState<string>();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingModel, setEditingModel] = useState<AiModel | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [form] = Form.useForm();

  const fetchPlatforms = async () => {
    try {
      const response = await getPlatforms();
      if (response.success) {
        setPlatforms(response.data);
      }
    } catch (error) {
      console.error("获取平台列表失败:", error);
    }
  };

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await getModels({
        type: typeFilter as any,
        platform: platformFilter,
        enabled:
          enabledFilter === "true"
            ? true
            : enabledFilter === "false"
              ? false
              : undefined,
        page,
        pageSize,
      });
      if (response.success) {
        setModels(response.data.items || []);
        setTotal(response.data.total || 0);
      } else {
        message.error("获取模型列表失败");
      }
    } catch (error) {
      console.error("获取模型列表失败:", error);
      message.error("获取模型列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  useEffect(() => {
    fetchModels();
  }, [page, pageSize, typeFilter, platformFilter, enabledFilter]);

  const handleCreate = () => {
    setEditingModel(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: AiModel) => {
    setEditingModel(record);
    form.setFieldsValue({
      ...record,
      pricingTiers:
        record.pricingTiers?.map((tier) => ({
          ...tier,
          multiplier: tier.multiplier || 2, // 确保倍率有默认值
        })) || [],
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);

      const modelData: CreateModelRequest = {
        id: values.id,
        name: values.name,
        description: values.description,
        type: values.type,
        platform: values.platform,
        enabled: values.enabled ?? true,
        priority: values.priority ?? 0,
        config: values.config || {},
      };

      // 根据类型添加定价信息
      if (values.type === "image") {
        modelData.costPerImage = values.costPerImage;
        modelData.creditsPerImage = values.creditsPerImage;
      } else if (values.type === "video") {
        const { billingMode } = values.config || {};
        if (billingMode === "per_video") {
          // 按次计费
          modelData.costPerVideo = values.costPerVideo;
          modelData.creditsPerVideo = values.creditsPerVideo;
        } else {
          // 按秒计费
          modelData.pricingTiers = values.pricingTiers;
        }
      }

      const response = editingModel
        ? await updateModel(editingModel.id, modelData)
        : await createModel(modelData);

      if (response.success) {
        message.success(editingModel ? "更新成功" : "创建成功");
        setModalVisible(false);
        form.resetFields();
        fetchModels();
      } else {
        message.error(
          response.message || (editingModel ? "更新失败" : "创建失败"),
        );
      }
    } catch (error: any) {
      console.error("提交失败:", error);
      if (error.errorFields) return;
      message.error("提交失败");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "删除后无法恢复，确定要删除这个模型吗？",
      onOk: async () => {
        try {
          const response = await deleteModel(id);
          if (response.success) {
            message.success("删除成功");
            fetchModels();
          } else {
            message.error(response.message || "删除失败");
          }
        } catch (error) {
          console.error("删除失败:", error);
          message.error("删除失败");
        }
      },
    });
  };

  const handleBatchToggle = async (enabled: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning("请先选择要操作的模型");
      return;
    }

    try {
      const response = await toggleModels(selectedRowKeys, enabled);
      if (response.success) {
        message.success(response.message);
        setSelectedRowKeys([]);
        fetchModels();
      } else {
        message.error(response.message || "操作失败");
      }
    } catch (error) {
      console.error("批量操作失败:", error);
      message.error("操作失败");
    }
  };

  const columns: ColumnsType<AiModel> = [
    {
      title: "ID",
      dataIndex: "id",
      width: 200,
      fixed: "left",
    },
    {
      title: "名称",
      dataIndex: "name",
      width: 150,
    },
    {
      title: "类型",
      dataIndex: "type",
      width: 100,
      render: (type: "image" | "video" | "text") => {
        const colorMap: Record<string, string> = {
          image: "blue",
          video: "purple",
          text: "green",
        };
        const textMap: Record<string, string> = {
          image: "图像",
          video: "视频",
          text: "文本",
        };
        return <Tag color={colorMap[type]}>{textMap[type]}</Tag>;
      },
    },
    {
      title: "平台",
      dataIndex: "platform",
      width: 150,
      render: (platform: string) => {
        const platformMap: Record<string, string> = platforms.reduce(
          (acc, p) => ({ ...acc, [p.id]: p.name }),
          {},
        );
        return platformMap[platform] || platform;
      },
    },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 100,
      render: (enabled) =>
        enabled ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            启用
          </Tag>
        ) : (
          <Tag color="default" icon={<CloseCircleOutlined />}>
            禁用
          </Tag>
        ),
    },
    {
      title: "优先级",
      dataIndex: "priority",
      width: 100,
      sorter: (a, b) => a.priority - b.priority,
    },
    {
      title: "定价",
      key: "pricing",
      width: 200,
      render: (_, record) => {
        if (record.type === "image") {
          const cost =
            typeof record.costPerImage === "string"
              ? parseFloat(record.costPerImage)
              : record.costPerImage;
          return (
            <div>
              <div>成本: ¥{cost?.toFixed(4) ?? 0}</div>
              <div>积分: {record.creditsPerImage ?? 0}</div>
            </div>
          );
        } else if (record.type === "video") {
          const { billingMode } = record.config || {};
          if (billingMode === "per_video") {
            // 按次计费
            const cost =
              typeof record.costPerVideo === "string"
                ? parseFloat(record.costPerVideo)
                : record.costPerVideo;
            return (
              <div>
                <div>按次: ¥{cost?.toFixed(2) ?? 0}</div>
                <div>积分: {record.creditsPerVideo ?? 0}</div>
              </div>
            );
          } else if (record.pricingTiers?.length) {
            // 按秒计费
            return (
              <div>
                {record.pricingTiers.map((tier) => (
                  <div key={tier.resolution}>
                    {tier.resolution}: {tier.creditsPerSecond}积分/秒
                  </div>
                ))}
              </div>
            );
          }
        }
        return "-";
      },
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      width: 180,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const modelType = Form.useWatch("type", form);

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="类型"
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 120 }}
              allowClear
            >
              <Select.Option value="image">图像</Select.Option>
              <Select.Option value="video">视频</Select.Option>
              <Select.Option value="text">文本</Select.Option>
            </Select>
            <Select
              placeholder="平台"
              value={platformFilter}
              onChange={setPlatformFilter}
              style={{ width: 180 }}
              allowClear
            >
              {platforms.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder="状态"
              value={enabledFilter}
              onChange={setEnabledFilter}
              style={{ width: 120 }}
              allowClear
            >
              <Select.Option value="true">启用</Select.Option>
              <Select.Option value="false">禁用</Select.Option>
            </Select>
            <Button
              type="default"
              onClick={() => {
                setTypeFilter(undefined);
                setPlatformFilter(undefined);
                setEnabledFilter(undefined);
              }}
            >
              重置
            </Button>
          </Space>
          <div style={{ float: "right" }}>
            <Space>
              {selectedRowKeys.length > 0 && (
                <>
                  <Button onClick={() => handleBatchToggle(true)}>
                    批量启用
                  </Button>
                  <Button onClick={() => handleBatchToggle(false)}>
                    批量禁用
                  </Button>
                </>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                新建模型
              </Button>
            </Space>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={models}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
          scroll={{ x: 1500 }}
        />
      </Card>

      <Modal
        title={editingModel ? "编辑模型" : "新建模型"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={modalLoading}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Tabs defaultActiveKey="basic">
            <TabPane tab="基本信息" key="basic">
              <Form.Item
                label="模型ID"
                name="id"
                rules={[{ required: true, message: "请输入模型ID" }]}
                extra="唯一标识符，如 'doubao-seedream-4-5-251128'"
              >
                <Input placeholder="请输入模型ID" disabled={!!editingModel} />
              </Form.Item>

              <Form.Item
                label="模型名称"
                name="name"
                rules={[{ required: true, message: "请输入模型名称" }]}
              >
                <Input placeholder="请输入模型名称" />
              </Form.Item>

              <Form.Item label="描述" name="description">
                <TextArea placeholder="请输入模型描述" rows={3} />
              </Form.Item>

              <Form.Item
                label="类型"
                name="type"
                rules={[{ required: true, message: "请选择模型类型" }]}
              >
                <Select placeholder="请选择模型类型" disabled={!!editingModel}>
                  <Select.Option value="image">图像</Select.Option>
                  <Select.Option value="video">视频</Select.Option>
                  <Select.Option value="text">文本</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="平台"
                name="platform"
                rules={[{ required: true, message: "请选择平台" }]}
              >
                <Select placeholder="请选择平台" disabled={!!editingModel}>
                  {platforms.map((p) => (
                    <Select.Option key={p.id} value={p.id}>
                      {p.name} - {p.description}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="启用"
                name="enabled"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>

              <Form.Item label="优先级" name="priority" initialValue={0}>
                <InputNumber
                  placeholder="数值越大优先级越高"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </TabPane>

            <TabPane tab="定价配置" key="pricing">
              {modelType === "image" && (
                <>
                  <Form.Item
                    label="每张成本（元）"
                    name="costPerImage"
                    rules={[{ required: true, message: "请输入成本" }]}
                  >
                    <InputNumber
                      placeholder="请输入每张图片成本"
                      style={{ width: "100%" }}
                      min={0}
                      step={0.0001}
                      precision={4}
                    />
                  </Form.Item>

                  <Form.Item
                    label="每张积分"
                    name="creditsPerImage"
                    rules={[{ required: true, message: "请输入积分" }]}
                  >
                    <InputNumber
                      placeholder="请输入每张图片消耗积分"
                      style={{ width: "100%" }}
                      min={0}
                    />
                  </Form.Item>
                </>
              )}

              {modelType === "video" && (
                <>
                  <Form.Item
                    label="计费方式"
                    name={["config", "billingMode"]}
                    initialValue="per_second"
                  >
                    <Select>
                      <Select.Option value="per_second">按秒计费</Select.Option>
                      <Select.Option value="per_video">
                        按次计费（固定时长）
                      </Select.Option>
                    </Select>
                  </Form.Item>

                  <VideoPricingForm />
                </>
              )}
            </TabPane>

            <TabPane tab="功能配置" key="config">
              {modelType === "image" && <ImageConfigForm />}
              {modelType === "video" && <VideoConfigForm />}
            </TabPane>
          </Tabs>
        </Form>
      </Modal>
    </div>
  );
}

// 图像模型配置表单
function ImageConfigForm() {
  return (
    <>
      <Form.Item label="支持的尺寸" name={["config", "sizes"]}>
        <Select mode="tags" placeholder="如 1024x1024, 1920x1920" />
      </Form.Item>

      <Form.Item label="质量选项" name={["config", "qualities"]}>
        <Select mode="tags" placeholder="如 standard, hd" />
      </Form.Item>

      <Form.Item label="风格选项" name={["config", "styles"]}>
        <Select mode="tags" placeholder="如 默认, 3D卡通, 动画" />
      </Form.Item>

      <Form.Item label="画面比例" name={["config", "aspectRatios"]}>
        <Select mode="tags" placeholder="如 1:1, 16:9, 9:16" />
      </Form.Item>

      <Form.Item
        label="支持图生图"
        name={["config", "supportImageToImage"]}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        label="支持多图融合"
        name={["config", "supportMultiImageFusion"]}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        label="支持随机种子"
        name={["config", "supportSeed"]}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        label="支持负面提示词"
        name={["config", "supportNegativePrompt"]}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
    </>
  );
}

// 视频模型配置表单
function VideoConfigForm() {
  return (
    <>
      <Form.Item label="支持的模式" name={["config", "supportedModes"]}>
        <Select mode="tags" placeholder="如 text_to_video, image_to_video" />
      </Form.Item>

      <Form.Item label="最大时长（秒）" name={["config", "maxDuration"]}>
        <InputNumber placeholder="最大时长" style={{ width: "100%" }} min={1} />
      </Form.Item>

      <Form.Item label="最小时长（秒）" name={["config", "minDuration"]}>
        <InputNumber placeholder="最小时长" style={{ width: "100%" }} min={1} />
      </Form.Item>

      <Form.Item label="最大参考图数量" name={["config", "maxImages"]}>
        <InputNumber
          placeholder="ref2v 模式用"
          style={{ width: "100%" }}
          min={1}
        />
      </Form.Item>

      <Form.Item label="分辨率选项" name={["config", "resolutions"]}>
        <Select mode="tags" placeholder="如 720p, 1080p" />
      </Form.Item>

      <Form.Item
        label="支持镜头运动"
        name={["config", "supportCameraMovement"]}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        label="支持水印控制"
        name={["config", "supportWatermark"]}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        label="支持音画同步"
        name={["config", "supportGenerateAudio"]}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
    </>
  );
}

// 视频定价表单组件
function VideoPricingForm() {
  const form = Form.useFormInstance();
  const billingMode = Form.useWatch(["config", "billingMode"], form);
  const [calcVisible, setCalcVisible] = useState(false);
  const [calcTokens, setCalcTokens] = useState<number>();
  const [calcTokenPrice, setCalcTokenPrice] = useState<number>();
  const [calcResult, setCalcResult] = useState<{
    cost5s: number;
    creditsPerSecond: number;
  }>();

  const handleCalculate = () => {
    if (!calcTokens || !calcTokenPrice) return;

    // 假设 5 秒视频消耗的 tokens（根据火山文档的参考值）
    const cost5s = (calcTokens * calcTokenPrice) / 1000;
    const creditsPerSecond = Math.ceil((cost5s * 10) / 5); // 转换为每秒积分

    setCalcResult({ cost5s, creditsPerSecond });
  };

  // 计算积分的统一函数（保留1位小数，提高精度）
  const calculateCredits = (cost1s: number, multiplier: number) => {
    // 积分 = 成本 × 10 × 倍率，四舍五入保留1位小数
    return Math.round(cost1s * 10 * multiplier * 10) / 10;
  };

  // 处理1秒成本变化，自动计算5秒成本和积分
  const handleCost1sChange = (value: number | null, name: number) => {
    if (value === null) return;
    const tiers = form.getFieldValue("pricingTiers") || [];
    const multiplier = tiers[name]?.multiplier;
    tiers[name] = {
      ...tiers[name],
      cost1s: value,
      cost5s: Math.ceil(value * 5 * 100) / 100, // 向上取整到分
      creditsPerSecond: calculateCredits(value, multiplier),
    };
    form.setFieldValue("pricingTiers", tiers);
  };

  // 处理5秒成本变化，自动计算1秒成本和积分
  const handleCost5sChange = (value: number | null, name: number) => {
    if (value === null) return;
    const tiers = form.getFieldValue("pricingTiers") || [];
    const multiplier = tiers[name]?.multiplier;
    const cost1s = Math.ceil((value / 5) * 100) / 100; // 向上取整到分
    tiers[name] = {
      ...tiers[name],
      cost5s: value,
      cost1s: cost1s,
      creditsPerSecond: calculateCredits(cost1s, multiplier),
    };
    form.setFieldValue("pricingTiers", tiers);
  };

  // 应用计算结果到表单
  const applyCalcResult = (name: number) => {
    if (!calcResult) return;
    const tiers = form.getFieldValue("pricingTiers") || [];
    const multiplier = tiers[name]?.multiplier || 2;
    const cost1s = calcResult.cost5s / 5;
    tiers[name] = {
      ...tiers[name],
      cost5s: calcResult.cost5s,
      cost1s: Math.ceil(cost1s * 100) / 100,
      multiplier,
      creditsPerSecond: calculateCredits(cost1s, multiplier),
    };
    form.setFieldValue("pricingTiers", tiers);
  };

  // 处理倍率变化，自动重新计算积分（按秒计费）
  const handleMultiplierChange = (value: number | null, name: number) => {
    if (value === null) return;
    const tiers = form.getFieldValue("pricingTiers") || [];
    const cost1s = tiers[name]?.cost1s || 0;
    tiers[name] = {
      ...tiers[name],
      multiplier: value,
      creditsPerSecond: calculateCredits(cost1s, value),
    };
    form.setFieldValue("pricingTiers", tiers);
  };

  // 处理每次成本变化，自动计算积分
  const handleCostPerVideoChange = (value: number | null) => {
    if (value === null) return;
    const multiplier = form.getFieldValue("multiplier") || 2;
    const creditsPerVideo = Math.round(value * 10 * multiplier);
    form.setFieldValue("creditsPerVideo", creditsPerVideo);
  };

  // 处理倍率变化，自动重新计算积分（按次计费）
  const handleVideoMultiplierChange = (value: number | null) => {
    if (value === null) return;
    const costPerVideo = form.getFieldValue("costPerVideo") || 0;
    const creditsPerVideo = Math.round(costPerVideo * 10 * value);
    form.setFieldValue("multiplier", value);
    form.setFieldValue("creditsPerVideo", creditsPerVideo);
  };

  // 处理固定时长变化
  // const handleFixedDurationChange = (value: number | null) => {
  //   if (value === null) return;
  //   // 这里可以添加时长变化时的逻辑，比如重新计算成本等
  //   console.log("固定时长变化:", value);
  // };

  return (
    <>
      {billingMode === "per_second" && (
        <>
          <Divider>按秒计费配置</Divider>
          <Form.List name="pricingTiers">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} size="small" style={{ marginBottom: 16 }}>
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Space style={{ width: "100%" }} align="baseline">
                        <Form.Item
                          {...restField}
                          label="分辨率"
                          name={[name, "resolution"]}
                          rules={[{ required: true, message: "请输入分辨率" }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="如 720p" style={{ width: 120 }} />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          label="1秒成本（元）"
                          name={[name, "cost1s"]}
                          rules={[{ required: true, message: "请输入1秒成本" }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            placeholder="1秒视频成本"
                            style={{ width: 110 }}
                            min={0}
                            step={0.01}
                            precision={2}
                            onChange={(value) =>
                              handleCost1sChange(value, name)
                            }
                          />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          label="5秒成本（元）"
                          name={[name, "cost5s"]}
                          rules={[{ required: true, message: "请输入5秒成本" }]}
                          style={{ marginBottom: 0 }}
                          extra={
                            <Button
                              type="link"
                              size="small"
                              onClick={() => setCalcVisible(!calcVisible)}
                              style={{ padding: 0 }}
                            >
                              {calcVisible ? "隐藏" : "显示"}计算器
                            </Button>
                          }
                        >
                          <InputNumber
                            placeholder="5秒视频成本"
                            style={{ width: 110 }}
                            min={0}
                            step={0.01}
                            precision={2}
                            onChange={(value) =>
                              handleCost5sChange(value, name)
                            }
                          />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          label="倍率"
                          name={[name, "multiplier"]}
                          style={{ marginBottom: 0 }}
                          extra="积分倍率：1.0表示无加价，2.0表示加价100%"
                        >
                          <InputNumber
                            placeholder="积分倍率"
                            style={{ width: 80 }}
                            min={0.1}
                            step={0.1}
                            precision={1}
                            onChange={(value) =>
                              handleMultiplierChange(value, name)
                            }
                          />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          label="每秒积分"
                          name={[name, "creditsPerSecond"]}
                          rules={[{ required: true, message: "请输入积分" }]}
                          style={{ marginBottom: 0 }}
                          extra="计算公式：1秒成本 × 10 × 倍率（1元=10积分）"
                        >
                          <InputNumber
                            placeholder="自动计算"
                            style={{ width: 110 }}
                            min={0}
                            precision={1}
                            readOnly
                            addonAfter="积分"
                          />
                        </Form.Item>

                        <Button type="link" danger onClick={() => remove(name)}>
                          删除
                        </Button>
                      </Space>

                      {calcVisible && (
                        <Card size="small" style={{ background: "#f5f5f5" }}>
                          <Space direction="vertical" style={{ width: "100%" }}>
                            <div
                              style={{ fontWeight: "bold", marginBottom: 8 }}
                            >
                              价格计算器
                            </div>
                            <Space>
                              <InputNumber
                                placeholder="Tokens 消耗"
                                value={calcTokens}
                                onChange={(v) => setCalcTokens(v ?? undefined)}
                                style={{ width: 150 }}
                                addonAfter="tokens"
                              />
                              <InputNumber
                                placeholder="Token 单价"
                                value={calcTokenPrice}
                                onChange={(v) =>
                                  setCalcTokenPrice(v ?? undefined)
                                }
                                style={{ width: 150 }}
                                addonAfter="元/千tokens"
                                step={0.001}
                                precision={3}
                              />
                              <Button type="primary" onClick={handleCalculate}>
                                计算
                              </Button>
                            </Space>
                            {calcResult && (
                              <div
                                style={{
                                  marginTop: 8,
                                  padding: 8,
                                  background: "#fff",
                                  borderRadius: 4,
                                }}
                              >
                                <div>
                                  5秒成本: ¥{calcResult.cost5s.toFixed(2)}
                                </div>
                                <div>
                                  每秒积分: {calcResult.creditsPerSecond}
                                </div>
                                <Button
                                  size="small"
                                  type="link"
                                  onClick={() => applyCalcResult(name)}
                                >
                                  应用到表单
                                </Button>
                              </div>
                            )}
                          </Space>
                        </Card>
                      )}
                    </Space>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ multiplier: 2 })}
                  block
                >
                  添加定价层级
                </Button>
              </>
            )}
          </Form.List>
        </>
      )}

      {billingMode === "per_video" && (
        <>
          <Divider>按次计费配置（固定时长）</Divider>
          <Form.Item
            label="固定时长（秒）"
            name={["config", "fixedDuration"]}
            rules={[{ required: true, message: "请输入固定时长" }]}
            extra="如 Grok Video 3 固定 5 秒"
          >
            <InputNumber
              placeholder="固定时长"
              style={{ width: "100%" }}
              min={4}
            />
          </Form.Item>

          <Form.Item
            label="每次成本（元）"
            name="costPerVideo"
            rules={[{ required: true, message: "请输入成本" }]}
          >
            <InputNumber
              placeholder="每次生成成本"
              style={{ width: "100%" }}
              min={0}
              step={0.01}
              precision={2}
              onChange={handleCostPerVideoChange}
            />
          </Form.Item>

          <Form.Item
            label="倍率"
            name="multiplier"
            initialValue={2}
            extra="积分倍率：1.0表示无加价，2.0表示加价100%"
          >
            <InputNumber
              placeholder="积分倍率"
              style={{ width: "100%" }}
              min={0.1}
              step={0.1}
              precision={1}
              onChange={handleVideoMultiplierChange}
            />
          </Form.Item>

          <Form.Item
            label="每次积分"
            name="creditsPerVideo"
            rules={[{ required: true, message: "请输入积分" }]}
            extra="计算公式：每次成本 × 10 × 倍率（1元=10积分）"
          >
            <InputNumber
              placeholder="每次生成消耗积分"
              style={{ width: "100%" }}
              min={0}
              readOnly
              addonAfter="积分"
            />
          </Form.Item>
        </>
      )}
    </>
  );
}
