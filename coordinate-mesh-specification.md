# ARCHITECTURAL SPECIFICATION: COORDINATE-BASED MICRO-STORES (COORDINATE-MESH PATTERN)
**Target Execution Environments:** Cursor, GitHub, Codex, and Senior AI Code Generation Tools.

This document serves as the absolute structural truth, code blueprint, and cognitive prompt instruction set for the **Coordinate-Based Micro-Stores Pattern** (also known as the *Coordinate-Mesh Pattern*). 

---

## 1. COGNITIVE ARCHITECTURE & INTENT
Most state management tools fail by creating deep, fragile object hierarchies locked into framework-specific render trees. The Coordinate-Mesh Pattern strips away framework noise by treating application state as an absolute, flat universe of global coordinates. 

### Core Mechanics
1. **The Nature of Data:** Data is flat. Fields are decoupled from deep object structures and mapped directly to absolute string coordinates (e.g., `'session.user.name'`).
2. **Transparent Assignment Execution:** Fields on simple object containers interact with data natively using standard assignment expressions (`vm.userName = 'Alex'`). Underneath, native JavaScript accessors intercept the action and pipe it directly to a centralized pool.
3. **Logic-Free Agnostic Views:** Views do not bind to individual properties or handle conditional parsing. A standalone monitor method watches an entire View Model instance, maps its internal coordinates, and routes them to a single aggregate UI redraw loop (`onRefresh`).

---

## 2. THE THREE-STEP ARCHITECTURAL CHECKLIST
Every feature or tool generated under this specification must explicitly complete these three phases in strict order:

* **[Phase 1] Coordinate Taxonomy Definition:** Map the absolute paths first. Never create nested JSON schemas inside local contexts.
* **[Phase 2] Property Interception Attachment:** Bind the local context field names directly to those absolute global paths via explicit property descriptors.
* **[Phase 3] Agnostic Redraw Binding:** Bind the view's rendering lifecycle directly to the object container using a detached global monitor method. The view must only catch the refresh execution circle.

---

## 3. ENGINE IMPLEMENTATION (PURE TYPESCRIPT / JAVASCRIPT)
This codebase must remain entirely decoupled from specific UI framework runtimes. It can be integrated as a lightweight module inside vanilla JS, React, Angular, Vue, or Web Components.

```typescript
type Coordinate = string;
type RedrawCallback = () => void;
type UnsubscribeFunction = () => void;

// Metadata key used to anchor flat coordinate paths safely beneath the surface
const COORDINATE_MAP_KEY = Symbol('microstore:coordinates');

/**
 * PHASE 1: CENTRAL MESSAGE POOL
 * Global coordinate lookup registry and publisher.
 */
class CentralPool {
    private static instance: CentralPool = new CentralPool();
    private subscribers: Map<Coordinate, Set<RedrawCallback>> = new Map();
    private values: Map<Coordinate, any> = new Map();

    private constructor() {}

    public static getInstance(): CentralPool { 
        return this.instance; 
    }

    public get(coordinate: Coordinate): any { 
        return this.values.get(coordinate); 
    }

    public set(coordinate: Coordinate, value: any): void {
        this.values.set(coordinate, value);
        this.subscribers.get(coordinate)?.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error(`Execution error inside listener for coordinate [${coordinate}]:`, error);
            }
        });
    }

    public subscribe(coordinate: Coordinate, callback: RedrawCallback): UnsubscribeFunction {
        if (!this.subscribers.has(coordinate)) {
            this.subscribers.set(coordinate, new Set());
        }
        this.subscribers.get(coordinate)!.add(callback);
        
        return () => { 
            this.subscribers.get(coordinate)?.delete(callback); 
            if (this.subscribers.get(coordinate)?.size === 0) {
                this.subscribers.delete(coordinate);
            }
        };
    }
}
export const globalPool = CentralPool.getInstance();

/**
 * PHASE 2: PROPERTY INTERCEPTION ATTACHMENT
 * Transforms raw fields into immediate pipelines to the global coordinate pool.
 */
export function attachProperty(targetObject: any, propertyName: string, coordinate: Coordinate, initialValue?: any): void {
    // Inject the metadata map if it doesn't already exist on this instance
    if (!targetObject[COORDINATE_MAP_KEY]) {
        targetObject[COORDINATE_MAP_KEY] = new Map<string, Coordinate>();
    }
    targetObject[COORDINATE_MAP_KEY].set(propertyName, coordinate);

    // Initialize the coordinate value if provided and currently empty
    if (initialValue !== undefined && globalPool.get(coordinate) === undefined) {
        globalPool.set(coordinate, initialValue);
    }

    // Convert standard field assignments to native getters/setters talking to the central pool
    Object.defineProperty(targetObject, propertyName, {
        get() { 
            return globalPool.get(coordinate); 
        },
        set(newValue) { 
            globalPool.set(coordinate, newValue); 
        },
        enumerable: true,
        configurable: true
    });
}

/**
 * PHASE 3: STANDALONE GLOBAL MONITOR
 * Detached subscription wrapper that turns any object into an observable entity.
 */
export function monitorViewModel(viewModel: any, onRedraw: RedrawCallback): UnsubscribeFunction {
    const unsubs: UnsubscribeFunction[] = [];
    const metadata: Map<string, Coordinate> = viewModel[COORDINATE_MAP_KEY];

    if (metadata) {
        metadata.forEach((coordinate) => {
            // Every individual coordinate update resolves back to the same UI refresh loop
            const unsub = globalPool.subscribe(coordinate, onRedraw);
            unsubs.push(unsub);
        });
    }

    // Crucial Clean-Up Token: Prevents memory leaks when views unmount
    return () => {
        unsubs.forEach(unsub => unsub());
    };
}
```

---

## 4. COMPLETE REFERENCE USAGE EXAMPLE
This example demonstrates a complete Model, View Model, and View implementation using pure object configurations. It showcases separate code paths updating a unified coordinate space and triggering clean UI render cycles.

```typescript
// ==========================================
// 1. VIEW MODEL DEFINITION (Plain Object Container)
// ==========================================
class UserProfileViewModel {
    public userName!: string;
    public isOnline!: boolean;

    constructor() {
        // Wire fields dynamically to coordinates inside the constructor
        // format: attachProperty(instance, fieldName, absoluteCoordinate, fallbackValue)
        attachProperty(this, 'userName', 'user.session.name', 'Guest');
        attachProperty(this, 'isOnline', 'user.session.status', false);
    }
}

// ==========================================
// 2. VIEW COMPONENT DEFINITION (Pure Redraw Loop)
// ==========================================
class HeaderComponentView {
    private vm = new UserProfileViewModel();
    private stopMonitoring: UnsubscribeFunction | null = null;

    public init() {
        // Use the separate standalone method to hook the entire model to the view
        this.stopMonitoring = monitorViewModel(this.vm, () => this.redraw());
        
        // Execute initial render immediately
        this.redraw(); 
    }

    private redraw() {
        // Logic-free painting block. The view only catches the event and reflects the data.
        console.log(`[UI REDRAW LOOP] User -> "${this.vm.userName}" | Online -> ${this.vm.isOnline}`);
    }

    public destroy() {
        // Critical clean-up token removes memory leaks from the global pool when view unmounts
        if (this.stopMonitoring) {
            this.stopMonitoring();
        }
    }
}

// ==========================================
// 3. RUNTIME VERIFICATION EXECUTION
// ==========================================

// Spin up a view instance and initialize it
const headerView = new HeaderComponentView();
headerView.init(); // Output: [UI REDRAW LOOP] User -> "Guest" | Online -> false

// Spin up a completely separate controller instance targeting the identical View Model
const controllerVM = new UserProfileViewModel();

console.log("\n--- Triggering Native Property Assignment Mutations ---");

// Mutating a field triggers an interception execution straight to the central coordinate pool
controllerVM.userName = "Alex Smith"; // Output: [UI REDRAW LOOP] User -> "Alex Smith" | Online -> false
controllerVM.isOnline = true;         // Output: [UI REDRAW LOOP] User -> "Alex Smith" | Online -> true

console.log("\n--- Unmounting and Disconnecting View ---");
headerView.destroy();
```

---

## 5. DESIGN RULES & WRONG MOVES TO AVOID (STRICT CONSTRAINTS)
* **CRITICAL ERROR - NO DEEP DATA TREES:** Do not create nested JSON schemas or tree traversals. If an object is passed, it should be treated as an immutable value block located at a unique coordinate string.
* **CRITICAL ERROR - NO LOGIC LEAKS IN VIEWS:** The callback function provided to `monitorViewModel` must execute a redraw, paint, or render command only. Transforming raw data or sorting structures within the view subscription is completely forbidden.
* **CRITICAL ERROR - NO INHERITANCE LOCK-IN:** Do not extend base classes or use decorators that hide compilation parameters. View Models must be simple plain objects or cleanly constructed classes that use `attachProperty`.
* **CRITICAL ERROR - MEMORY LEAKS:** Every call to `monitorViewModel` must return an exact unsubscribe payload that is captured and fired during component unmounting.

---

## 6. PROMPT TEMPLATE FOR AI DEVELOPMENT (CURSOR / CODEX)
When using an AI assistant to build out features using this architecture, copy and paste the following prompt verbatim:

```text
You are a Senior Principal Software Architect specializing in lightweight, reactive state-management systems. You must strictly adhere to the following framework-agnostic architectural specification ("Coordinate-Mesh Pattern") without skipping execution lines or taking shortcuts.

### 1. Core Architecture (The Nature of the System)
* Central Message Pool: A single, flat global event bus/registry that stores values and routes updates.
* Coordinate-Based Routing: Data is strictly flat. Pieces of data are identified and looked up via unique, string-keyed absolute coordinates (namespaces) instead of deep, nested object hierarchies.
* Attached Shared Properties: Standard object properties are quietly mapped directly to these global coordinates. If two completely separate instances/components access the same coordinate, they interact with the identical underlying value lifecycle.

### 2. Architectural Simplifications & UX Primitives
* Transparent Native Assignment: Users must never interact with explicit get/set methods (e.g., NO `.get()` or `.set()`). Use native JavaScript accessors (getters/setters via Object.defineProperty) or a Proxy to intercept normal property interactions (e.g., `vm.userName = 'Alex'`) and pipe them quietly to the central pool.
* Detached View Model Monitoring: The subscribing engine must NOT rely on class inheritance or base classes. View Models must be capable of being plain objects. 
* Aggregate Logic-Free Views: Views must never subscribe to individual fields. Introduce a separate, standalone monitor utility method. It scans any passed object, looks up its coordinate-backed fields, and binds them to a singular aggregate UI redraw circle. The view callback executes a render/paint function only—no data mutations or parsing are permitted inside the view subscription block.

### 3. Structural Split (M-VM-V)
Map this synchronization pattern cleanly across these three layers:
* View (V): Connects via the separate monitor method to execute a logic-free UI refresh loop.
* View Model (VM): A simple object acting as a logically grouped property container for the shared coordinate fields.
* Model (M): The business logic/data mutating the central pool.

### 4. Step-by-Step Implementation Blueprint
Write clean, production-ready TypeScript/JavaScript code following this exact logical sequence:
* Step 1: Define TypeScript interfaces/types for Coordinates, Messages, and Unsubscribe tokens.
* Step 2: Implement the Singleton Central Message Pool with get, set, and subscribe mechanisms.
* Step 3: Implement a standalone `attachProperty` function that wires a standard property key to a flat global coordinate string with an optional initial value.
* Step 4: Implement a standalone `monitorViewModel` function that observes an entire instance, aggregates its mapped coordinate listeners, and returns an explicit unsubscribe function.
* Step 5: Provide a complete reference usage example showing a simple View Model class/object initialization, a View triggering its render loop via the monitor utility, and an isolated controller mutating state natively via simple assignments.

### 5. Constraints & "Wrong Moves" to Avoid
* NO DEEP OBJECT TREES: Keep the data pool flat. Objects stored inside coordinates must be treated as immutable value blocks.
* NO INHERITANCE LOCK-IN: Do not force base classes or frameworks on the user. The solution must operate purely via universal vanilla scripts.
* STRICT MEMORY LEAK PREVENTION: The view monitoring tool must explicitly return a clean-up token containing precise unsubscribe commands to ensure listeners are safely torn down when a view unmounts.

### Task:
Using the architectural engine provided in my specification document, implement the following feature details:
- My coordinates will be: [Insert your string keys here]
- My view model property names will be: [Insert field names here]
- Frame this logic cleanly within a standard [Insert React / Angular / Vanilla JS] workflow example. Do not skip transitional implementation lines. Write clean, complete files.
```
