document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');

    const brushSizeInput = document.getElementById('brushSize');
    const brushSizeDisplay = document.getElementById('brushSizeDisplay');
    const colorPicker = document.getElementById('colorPicker');
    const toolBtns = document.querySelectorAll('.tool-btn');
    const presetColors = document.querySelector('.preset-colors');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const clearCanvasBtn = document.getElementById('clearCanvasBtn');
    const imageUploader = document.getElementById('imageUploader');
    const downloadBtn = document.getElementById('downloadBtn');
    const fileNameInput = document.getElementById('fileNameInput');
    const saveStatus = document.getElementById('saveStatus');
    const zoomDisplay = document.getElementById('zoomDisplay');
    const coordsDisplay = document.getElementById('coordsDisplay');
    const resetViewBtn = document.getElementById('resetViewBtn');


    let currentTool = 'brush';
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let brushColor = colorPicker.value;
    let brushSize = parseInt(brushSizeInput.value);

    // 历史记录栈
    let history = [];
    let historyPointer = -1;
    const MAX_HISTORY_STEPS = 50; // 最大历史记录步数

    // Canvas 变换状态
    let scale = 1;
    let panX = 0;
    let panY = 0;

    // --- 初始化 Canvas ---
    function resizeCanvas() {
        // 保存当前画板内容
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // 设置 Canvas 尺寸为父容器的宽高
        const canvasArea = canvas.parentElement;
        canvas.width = canvasArea.clientWidth;
        canvas.height = canvasArea.clientHeight;

        // 恢复画板内容
        ctx.putImageData(imageData, 0, 0);
        
        // 应用当前的变换状态（缩放和平移）
        applyCanvasTransform();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // 首次加载时设置大小

    // 初始保存一次空白状态
    saveState();

    // --- 画板变换 (缩放和平移) ---
    function applyCanvasTransform() {
        ctx.setTransform(scale, 0, 0, scale, panX, panY);
    }

    // 更新显示
    function updateTransformDisplay() {
        zoomDisplay.textContent = `${Math.round(scale * 100)}%`;
    }

    // 重置视图
    resetViewBtn.addEventListener('click', () => {
        scale = 1;
        panX = 0;
        panY = 0;
        applyCanvasTransform();
        updateTransformDisplay();
    });

    // 缩放 (鼠标滚轮)
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const scaleAmount = 1.1; // 每次缩放因子
        const mouseX = e.clientX - canvas.getBoundingClientRect().left;
        const mouseY = e.clientY - canvas.getBoundingClientRect().top;

        if (e.deltaY < 0) { // 向上滚 (放大)
            scale *= scaleAmount;
        } else { // 向下滚 (缩小)
            scale /= scaleAmount;
        }

        // 保持鼠标在同一位置进行缩放
        panX = mouseX - (mouseX - panX) * (scale / (e.deltaY < 0 ? scale / scaleAmount : scale * scaleAmount));
        panY = mouseY - (mouseY - panY) * (scale / (e.deltaY < 0 ? scale / scaleAmount : scale * scaleAmount));

        applyCanvasTransform();
        updateTransformDisplay();
    });

    // 平移 (拖拽画板)
    let isPanning = false;
    let startPanX, startPanY;

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 1 || e.button === 0 && currentTool === 'pan') { // 中键或指定工具
            isPanning = true;
            startPanX = e.clientX - panX;
            startPanY = e.clientY - panY;
            canvas.style.cursor = 'grabbing';
        } else if (e.button === 0) { // 左键
            isDrawing = true;
            [lastX, lastY] = getTransformedCoords(e.clientX, e.clientY);
            // 对于直线、矩形等工具，还需要记录起点用于实时预览
            // e.g., startDrawX = lastX, startDrawY = lastY;
            
            // 如果是文本工具，在点击时触发输入
/**
 * 🎨 个人风格高级画板核心逻辑
 * 包含：绘图、坐标变换（缩放/平移）、撤销重做、本地保存、取色、填充等
 */

const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const container = document.querySelector('.canvas-area');

// 状态变量
let isDrawing = false;
let currentTool = 'brush';
let scale = 1, panX = 0, panY = 0;
let history = [], step = -1;
let startX, startY; // 用于图形起点
let snapshot; // 绘图时的画布快照

// 初始化
window.onload = () => {
    resizeCanvas();
    loadLocalData(); // 加载上次自动保存的数据
    setupEventListeners();
};

function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    if(step === -1) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveState(); 
    } else {
        restoreState(step);
    }
}

// --- 坐标转换：将屏幕坐标转换为 Canvas 内部坐标 ---
function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: (clientX - rect.left - panX) / scale,
        y: (clientY - rect.top - panY) / scale
    };
}

// --- 绘图核心 ---
function setupEventListeners() {
    const startEvent = (e) => {
        if (e.button === 1) return; // 中键平移逻辑略
        isDrawing = true;
        const coords = getCoords(e);
        startX = coords.x;
        startY = coords.y;
        
        // 记录快照用于绘制预览（如直线、矩形）
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        ctx.beginPath();
        ctx.lineWidth = document.getElementById('brushSize').value;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = document.getElementById('colorPicker').value;
        
        if (currentTool === 'brush' || currentTool === 'eraser') {
            if (currentTool === 'eraser') ctx.strokeStyle = '#ffffff';
            ctx.moveTo(startX, startY);
        }
    };

    const moveEvent = (e) => {
        if (!isDrawing) return;
        const coords = getCoords(e);
        
        // 更新底部坐标显示
        document.getElementById('coordsDisplay').innerText = `(${Math.round(coords.x)}, ${Math.round(coords.y)})`;

        if (currentTool === 'brush' || currentTool === 'eraser') {
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
        } else if (['line', 'rect', 'circle'].includes(currentTool)) {
            // 图形实时预览：先恢复快照再画新线
            ctx.putImageData(snapshot, 0, 0);
            drawShape(coords.x, coords.y);
        }
    };

    const endEvent = () => {
        if (!isDrawing) return;
        isDrawing = false;
        saveState(); // 松开鼠标保存历史
    };

    canvas.addEventListener('mousedown', startEvent);
    canvas.addEventListener('mousemove', moveEvent);
    window.addEventListener('mouseup', endEvent);
    
    // 移动端支持
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startEvent(e); });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); moveEvent(e); });
    canvas.addEventListener('touchend', endEvent);
}

function drawShape(endX, endY) {
    ctx.beginPath();
    if (currentTool === 'line') {
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
    } else if (currentTool === 'rect') {
        ctx.strokeRect(startX, startY, endX - startX, endY - startY);
    } else if (currentTool === 'circle') {
        let radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
    }
    ctx.stroke();
}

// --- 撤销/重做系统 ---
function saveState() {
    step++;
    if (step < history.length) history.length = step; // 如果在撤销状态下新画，删除之后的记录
    history.push(canvas.toDataURL());
    if (history.length > 20) { history.shift(); step--; } // 限制内存占用
    autoSaveLocal();
}

function undo() {
    if (step > 0) {
        step--;
        restoreState(step);
    }
}

function redo() {
    if (step < history.length - 1) {
        step++;
        restoreState(step);
    }
}

function restoreState(index) {
    let img = new Image();
    img.src = history[index];
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
}

// --- 本地保存与导出 ---
function autoSaveLocal() {
    localStorage.setItem('myBoardData', canvas.toDataURL());
    document.getElementById('saveStatus').innerText = "已自动保存 " + new Date().toLocaleTimeString();
}

function loadLocalData() {
    const saved = localStorage.getItem('myBoardData');
    if (saved) {
        let img = new Image();
        img.src = saved;
        img.onload = () => ctx.drawImage(img, 0, 0);
    }
}

// 导出高清图
document.getElementById('downloadBtn').onclick = () => {
    const link = document.createElement('a');
    const name = document.getElementById('fileNameInput').value || `Board_${new Date().getTime()}`;
    link.download = `${name}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
};

// --- 快捷键定义 ---
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') undo();
        if (e.key === 'y') redo();
    }
    // 工具快捷键
    if (e.key === 'b') setTool('brush');
    if (e.key === 'e') setTool('eraser');
    if (e.key === 'r') setTool('rect');
});

function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
}
/*优化画笔*/
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const container = document.querySelector('.canvas-area');

// 配置与状态
let state = {
    isDrawing: false,
    currentTool: 'brush', // 默认画笔
    color: '#000000',     // 默认黑色
    size: 5,              // 默认5px
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    history: [],
    step: -1
};

// 触摸手势相关
let lastTouchDist = 0;
let isPanning = false;

window.onload = () => {
    initCanvas();
    bindEvents();
    setActiveTool('brush'); // 默认选中画笔
    loadLocal(); // 加载缓存
};

function initCanvas() {
    // 设置画布大小为容器大小
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // 初始化背景为白色
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    saveState(); 
}

// 坐标转换函数 (处理缩放和平移后的点击位置)
function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    return {
        x: (clientX - rect.left - state.offsetX) / state.scale,
        y: (clientY - rect.top - state.offsetY) / state.scale
    };
}

function bindEvents() {
    // 工具切换按钮
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.onclick = () => setActiveTool(btn.dataset.tool);
    });

    // 颜色与粗细
    document.getElementById('colorPicker').onchange = (e) => state.color = e.target.value;
    document.getElementById('brushSize').oninput = (e) => {
        state.size = e.target.value;
        document.getElementById('brushSizeDisplay').innerText = state.size + 'px';
    };

    // 鼠标/触摸开始
    const startDraw = (e) => {
        if (e.touches && e.touches.length > 1) {
            isPanning = true; // 双指操作进入缩放/移动模式
            lastTouchDist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            return;
        }

        state.isDrawing = true;
        const pos = getPointerPos(e);
        state.startX = pos.x;
        state.startY = pos.y;
        
        // 记录当前画布快照（用于画形状时预览）
        state.snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.strokeStyle = state.color;
        ctx.lineWidth = state.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (state.currentTool === 'brush') {
            ctx.moveTo(pos.x, pos.y);
        } else if (state.currentTool === 'eraser') {
            ctx.strokeStyle = '#ffffff'; // 橡皮擦即白笔
            ctx.moveTo(pos.x, pos.y);
        } else if (state.currentTool === 'colorPicker') {
            pickColor(pos.x, pos.y);
        }
    };

    // 鼠标/触摸移动
    const moveDraw = (e) => {
        const pos = getPointerPos(e);
        document.getElementById('coordsDisplay').innerText = `(${Math.round(pos.x)}, ${Math.round(pos.y)})`;

        // 处理双指缩放
        if (e.touches && e.touches.length > 1 && isPanning) {
            let dist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            let zoom = dist / lastTouchDist;
            state.scale *= zoom;
            lastTouchDist = dist;
            applyTransform();
            return;
        }

        if (!state.isDrawing) return;

        if (state.currentTool === 'brush' || state.currentTool === 'eraser') {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        } else if (['line', 'rect', 'circle', 'diamond'].includes(state.currentTool)) {
            ctx.putImageData(state.snapshot, 0, 0); // 先恢复
            drawShape(pos.x, pos.y);
        }
    };

    const stopDraw = () => {
        if (state.isDrawing) {
            state.isDrawing = false;
            saveState();
        }
        isPanning = false;
    };

    // 监听事件
    canvas.addEventListener('mousedown', startDraw);
    window.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', stopDraw);

    canvas.addEventListener('touchstart', startDraw, {passive: false});
    canvas.addEventListener('touchmove', moveDraw, {passive: false});
    canvas.addEventListener('touchend', stopDraw);

    // 功能按钮
    document.getElementById('clearCanvasBtn').onclick = clearCanvas;
    document.getElementById('undoBtn').onclick = undo;
    document.getElementById('resetViewBtn').onclick = resetView;
}

// 绘制图形逻辑
function drawShape(x, y) {
    ctx.beginPath();
    ctx.strokeStyle = state.color;
    if (state.currentTool === 'line') {
        ctx.moveTo(state.startX, state.startY);
        ctx.lineTo(x, y);
    } else if (state.currentTool === 'rect') {
        ctx.strokeRect(state.startX, state.startY, x - state.startX, y - state.startY);
    } else if (state.currentTool === 'circle') {
        let r = Math.sqrt(Math.pow(x - state.startX, 2) + Math.pow(y - state.startY, 2));
        ctx.arc(state.startX, state.startY, r, 0, Math.PI * 2);
    }
    ctx.stroke();
}

// 取色器
function pickColor(x, y) {
    const pixel = ctx.getImageData(x * state.scale + state.offsetX, y * state.scale + state.offsetY, 1, 1).data;
    const hex = "#" + ("000000" + ((pixel[0] << 16) | (pixel[1] << 8) | pixel[2]).toString(16)).slice(-6);
    state.color = hex;
    document.getElementById('colorPicker').value = hex;
}

// 辅助功能
function setActiveTool(tool) {
    state.currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tool === tool);
    });
}

function applyTransform() {
    canvas.style.transform = `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.scale})`;
    document.getElementById('zoomDisplay').innerText = Math.round(state.scale * 100) + '%';
}

function resetView() {
    state.scale = 1;
    state.offsetX = 0;
    state.offsetY = 0;
    applyTransform();
}

function clearCanvas() {
    if(confirm("确定要清空画板吗？")) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveState();
    }
}

// 历史记录
function saveState() {
    state.step++;
    if (state.step < state.history.length) state.history.length = state.step;
    state.history.push(canvas.toDataURL());
    localStorage.setItem('savedDrawing', canvas.toDataURL());
}

function undo() {
    if (state.step > 0) {
        state.step--;
        let img = new Image();
        img.src = state.history[state.step];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    }
}

function loadLocal() {
    const saved = localStorage.getItem('savedDrawing');
    if (saved) {
        let img = new Image();
        img.src = saved;
        img.onload = () => ctx.drawImage(img, 0, 0);
    }
}


