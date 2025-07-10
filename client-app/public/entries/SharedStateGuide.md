# How to Create a Button That Changes a Variable in a Different Component

This guide shows you **3 different methods** to share state between React components using buttons.

## 🎯 **Method 1: Props (Parent-Child Communication)**

**Best for:** Simple parent-child relationships

```tsx
// Parent Component
const ParentComponent = () => {
  const [sharedValue, setSharedValue] = useState('Initial Value');

  return (
    <div>
      <p>Value: {sharedValue}</p>
      <PndButton onClick={() => setSharedValue('Changed!')} label="Change" />
      <ChildComponent 
        sharedValue={sharedValue} 
        setSharedValue={setSharedValue} 
      />
    </div>
  );
};

// Child Component
const ChildComponent = ({ sharedValue, setSharedValue }) => {
  return (
    <div>
      <p>Child sees: {sharedValue}</p>
      <PndButton onClick={() => setSharedValue('Changed from Child!')} label="Change from Child" />
    </div>
  );
};
```

**✅ Pros:** Simple, direct, no setup required  
**❌ Cons:** Prop drilling for deep nesting  

---

## 🎯 **Method 2: Context API (Global State)**

**Best for:** Sharing state across multiple components without prop drilling

```tsx
// 1. Create Context
const SharedStateContext = createContext();

// 2. Create Provider
const SharedStateProvider = ({ children }) => {
  const [sharedValue, setSharedValue] = useState('Initial Value');
  
  return (
    <SharedStateContext.Provider value={{ sharedValue, setSharedValue }}>
      {children}
    </SharedStateContext.Provider>
  );
};

// 3. Create Hook
const useSharedState = () => {
  const context = useContext(SharedStateContext);
  if (!context) throw new Error('Must be used within Provider');
  return context;
};

// 4. Use in Components
const ComponentA = () => {
  const { sharedValue, setSharedValue } = useSharedState();
  
  return (
    <div>
      <p>Value: {sharedValue}</p>
      <PndButton onClick={() => setSharedValue('Changed from A!')} label="Change" />
    </div>
  );
};

const ComponentB = () => {
  const { sharedValue, setSharedValue } = useSharedState();
  
  return (
    <div>
      <p>Value: {sharedValue}</p>
      <PndButton onClick={() => setSharedValue('Changed from B!')} label="Change" />
    </div>
  );
};
```

**✅ Pros:** No prop drilling, clean API, built into React  
**❌ Cons:** Requires Provider setup, can be overkill for simple cases  

---

## 🎯 **Method 3: Custom Hook + localStorage**

**Best for:** Persistent state that survives page refreshes

```tsx
// 1. Create Custom Hook
const useSharedVariable = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

// 2. Use in Components
const ComponentA = () => {
  const [sharedValue, setSharedValue] = useSharedVariable('my-key', 'Initial');
  
  return (
    <div>
      <p>Value: {sharedValue}</p>
      <PndButton onClick={() => setSharedValue('Changed from A!')} label="Change" />
    </div>
  );
};

const ComponentB = () => {
  const [sharedValue, setSharedValue] = useSharedVariable('my-key', 'Initial');
  
  return (
    <div>
      <p>Value: {sharedValue}</p>
      <PndButton onClick={() => setSharedValue('Changed from B!')} label="Change" />
    </div>
  );
};
```

**✅ Pros:** Persists across refreshes, syncs across tabs, no setup  
**❌ Cons:** Limited to localStorage size, not real-time across tabs  

---

## 🚀 **Quick Start Examples**

### **Simple Button to Change Text**

```tsx
// Using Props
const Parent = () => {
  const [text, setText] = useState('Hello');
  return (
    <div>
      <p>{text}</p>
      <ChildButton setText={setText} />
    </div>
  );
};

const ChildButton = ({ setText }) => (
  <PndButton onClick={() => setText('Changed!')} label="Change Text" />
);
```

### **Button to Toggle Boolean**

```tsx
// Using Context
const useSharedState = () => {
  const [isVisible, setIsVisible] = useState(false);
  return { isVisible, setIsVisible };
};

const ToggleButton = () => {
  const { isVisible, setIsVisible } = useSharedState();
  return (
    <PndButton 
      onClick={() => setIsVisible(!isVisible)} 
      label={isVisible ? 'Hide' : 'Show'} 
    />
  );
};
```

### **Button to Increment Counter**

```tsx
// Using Custom Hook
const CounterButton = () => {
  const [count, setCount] = useSharedNumber('counter', 0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <PndButton onClick={() => setCount(count + 1)} label="Increment" />
    </div>
  );
};
```

---

## 📋 **When to Use Each Method**

| Method | Use When | Complexity | Persistence |
|--------|----------|------------|-------------|
| **Props** | Parent-child only | Low | No |
| **Context** | Multiple components | Medium | No |
| **Custom Hook** | Cross-page/refresh | Low | Yes |

---

## 🎮 **Live Examples**

Check out the live examples in your home page:

1. **Props Example** - Shows parent-child communication
2. **Context Example** - Shows global state sharing
3. **Custom Hook Example** - Shows persistent state

Each example includes buttons that change variables in different components!

---

## 💡 **Pro Tips**

1. **Start with Props** for simple cases
2. **Use Context** when you have many components sharing state
3. **Use Custom Hook** when you need persistence
4. **Combine methods** for complex scenarios
5. **Always clean up** subscriptions and listeners

---

## 🔧 **Advanced: Combining Methods**

```tsx
// Context for UI state + Custom Hook for persistence
const App = () => {
  return (
    <SharedStateProvider>
      <ComponentA /> {/* Uses Context */}
      <ComponentB /> {/* Uses Custom Hook */}
    </SharedStateProvider>
  );
};
```

This gives you the best of both worlds: real-time updates and persistence! 