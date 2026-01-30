# EmailInput 组件

## 功能特点

### 🎯 **统一组件**
- 登录、注册、重置密码三个页面使用同一个EmailInput组件
- 保证UI一致性和功能统一性

### 🔄 **全局状态同步**
- 使用Zustand全局状态管理邮箱后缀
- 任何一个组件选择后缀，其他组件立即同步
- 自动持久化到localStorage

### 📧 **邮箱后缀**
支持15个常用邮箱后缀：
- @qq.com (默认)
- @163.com
- @126.com
- @gmail.com
- @sina.com
- @sohu.com
- @139.com
- @189.cn
- @yeah.net
- @foxmail.com
- @hotmail.com
- @outlook.com
- @aliyun.com
- @vip.sina.com
- @vip.163.com

### 🔍 **搜索功能**
- 支持在下拉框中搜索邮箱后缀
- 输入关键字快速筛选

## 技术实现

### 📦 **全局状态管理**
```typescript
// useEmailStore.ts
export const useEmailStore = create<EmailState>()(
  persist(
    (set) => ({
      emailSuffix: getCachedEmailSuffix(),
      setEmailSuffix: (suffix: string) => {
        setCachedEmailSuffix(suffix);
        set({ emailSuffix: suffix });
      },
    }),
    { name: 'email-store' }
  )
);
```

### 🎯 **组件使用**
```typescript
// EmailInput组件
const { emailSuffix, setEmailSuffix } = useEmailStore();

// 选择后缀时，自动同步到所有组件
const handleSuffixChange = (suffix: string) => {
  setEmailSuffix(suffix); // 全局状态更新
  const fullEmail = combineEmail(emailPrefix, suffix);
  onChange?.(fullEmail);
};
```

## 同步机制

### ✨ **简洁高效**
- **Zustand状态管理**：轻量级全局状态，自动响应式更新
- **自动持久化**：Zustand persist中间件自动保存到localStorage
- **即时同步**：状态变化时，所有使用该状态的组件自动重新渲染

### 🔄 **同步流程**
1. **用户选择后缀** → 调用 `setEmailSuffix(suffix)`
2. **更新全局状态** → Zustand自动通知所有订阅组件
3. **持久化存储** → 自动保存到localStorage
4. **组件重新渲染** → 所有EmailInput组件显示新后缀

## 用户体验

- ✅ **实时同步**：在任何页面选择后缀，其他页面立即更新
- ✅ **记忆功能**：记住用户偏好的邮箱后缀
- ✅ **快速输入**：60%前缀 + 40%后缀的布局设计
- ✅ **搜索支持**：支持后缀搜索筛选
- ✅ **一致性**：三个页面使用相同的组件和缓存
- ✅ **无缝切换**：Tab切换时保持邮箱后缀选择