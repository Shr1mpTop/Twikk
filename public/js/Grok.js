

const blackBg = document.querySelector('.black-bg');
const textarea = document.querySelector('.chat-textarea');
const sendBtn = document.querySelector('.send-btn');
const chatContainer = document.querySelector('.chat-input-local');
const images_grok = document.querySelector(".text-center");
let chatArea = null;

textarea.addEventListener('input', () => {
    if (textarea.value.trim().length > 0) {
        sendBtn.classList.add('active');
    } else {
        sendBtn.classList.remove('active');
    }
});
// 控制聊天框的滚动
sendBtn.addEventListener('click', () => {

    sendBtn.classList.remove('active');
    chatContainer.classList.add("fixed-bottom");
    images_grok.style.display = 'none';
    blackBg.style.paddingTop = '20px';
    sendMessage();
});
// 监听键盘事件，按下 Enter 键发送
textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendBtn.classList.remove('active');
        chatContainer.classList.add("fixed-bottom");
        images_grok.style.display = 'none';
        blackBg.style.paddingTop = '20px';
        sendMessage();
    }
});
function initChatArea() {
    // 检查聊天区域是否已存在，避免重复创建
    if (!chatArea) {
        // 创建聊天区域容器
        chatArea = document.createElement('div');
        // 添加基础样式类
        chatArea.classList.add('chat-area');
        // 将聊天区域添加到页面中（放在输入框上方）
        const chatInput = document.querySelector('.chat-input-local');
        if (chatInput && blackBg) {
            blackBg.insertBefore(chatArea, chatInput);
        }
    }
    return chatArea;
}
function createMessage(message, type, isLoading = false) {
    initChatArea(); // 确保聊天区域已初始化
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', type + '-message');

    if (type === 'ai' && isLoading) {
        // 加载状态显示光圈动画
        msgDiv.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';
    } else {
        // 正常显示消息内容
        msgDiv.textContent = message;
    }
    chatArea.appendChild(msgDiv);
    chatArea.scrollTop = chatArea.scrollHeight; // 滚动到底部
    return msgDiv;
}

// 处理发送消息的函数
function sendMessage() {
    // 1. 获取用户输入的消息
    const message = textarea.value.trim();
    if (!message) return;

    // 2. 在前端显示用户消息气泡
    createMessage(message, 'user');

    // 3. 清空输入框
    textarea.value = '';
    const loadingElement = createMessage('', 'ai', true);
    // 4. 使用 fetch API 向后端发送消息
    fetch('/api/chat', {
        method: 'POST',
        // 告诉后端，我们发送的是 JSON 数据
        headers: {
            'Content-Type': 'application/json'
        },
        // 将 JavaScript 变量 (message) 转换为 JSON 字符串，放在请求体中
        body: JSON.stringify({ message: message })
    })
        // 5. 等待后端响应
        .then(response => {
            // 检查响应是否成功
            if (!response.ok) {
                throw new Error('网络请求失败');
            }
            // 解析 JSON 格式的响应体
            return response.json();
        })
        // 6. 处理后端返回的数据 (AI 的回复)
        .then(data => {
            // 在前端显示 AI 的回复
            loadingElement.innerHTML = ''; // 清空加载图标
            loadingElement.textContent = data.reply; // 显示回复文字
            chatArea.scrollTop = chatArea.scrollHeight; // 确保回复可见
        })
        // 7. 捕获并处理任何错误
        .catch(error => {
            console.error('获取AI回复出错:', error);
            loadingElement.innerHTML = '';
            loadingElement.textContent = "AI调用出错,请稍后再试。";
            chatArea.scrollTop = chatArea.scrollHeight; // 滚动到底部
        });
}

// 背景
const STAR_COLOR = '#FFF';
const STAR_SIZE = 3;
const STAR_MIN_SCALE = 0.2;
const OVERFLOW_THRESHOLD = 50;
const STAR_COUNT = (window.innerHeight + window.innerWidth) / 10;

const canvas = document.querySelector('.chatCanvas');
const context = canvas.getContext('2d');
let scale = 1, width, height;
let stars = [];
let pointerX, pointerY;
let velocity = { x: 0, y: 0, tx: 0, ty: 0, z: 0.0009 };
let touchinput = false;
generate();
resize();
step();
window.onresize = resize;
canvas.onmousemove = onMouseMove;
canvas.ontouchmove = onTouchMove;
canvas.ontouchend = onMouseLeave;
canvas.onmouseleave = onMouseLeave;
function generate() {
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: 0,
            y: 0,
            z: STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE)
        });
    }
}
function placeStar(star) {
    star.x = Math.random() * width;
    star.y = Math.random() * height;
}

function recycleStar(star) {
    let direction = 'z';
    let vx = Math.abs(velocity.x);
    let vy = Math.abs(velocity.y);
    if (vx > 1 || vy > 1) {
        let axis;
        if (vx > vy) {
            axis = Math.random() < vx / (vx + vy) ? 'h' : 'z';
        } else {
            axis = Math.random() < vy / (vx + vy) ? 'v' : 'z';
        }
        if (axis === 'h') {
            direction = velocity.x > 0 ? 'l' : 'r';
        } else if (axis === 'v') {
            direction = velocity.y > 0 ? 't' : 'b';
        }
    }
    star.z = STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE);
    if (direction === 'z') {
        star.x = Math.random() * width;
        star.y = Math.random() * height;
    } else if (direction === 'l') {
        star.x = -OVERFLOW_THRESHOLD;
        star.y = height * Math.random();
    } else if (direction === 'r') {
        star.x = width + OVERFLOW_THRESHOLD;
        star.y = height * Math.random();
    } else if (direction === 't') {
        star.x = width * Math.random();
        star.y = -OVERFLOW_THRESHOLD;
    } else if (direction === 'b') {
        star.x = width * Math.random();
        star.y = height + OVERFLOW_THRESHOLD;
    }
}
function resize() {
    scale = window.devicePixelRatio || 1;
    width = window.innerWidth * scale;
    height = window.innerHeight * scale;
    canvas.width = width;
    canvas.height = height;
    stars.forEach(placeStar);
}

function step() {
    context.clearRect(0, 0, width, height);
    update();
    render();
    requestAnimationFrame(step);
}
function update() {
    velocity.tx *= 0.96;
    velocity.ty *= 0.96;
    velocity.x += (velocity.tx - velocity.x) * 0.8;
    velocity.y += (velocity.ty - velocity.y) * 0.8;
    stars.forEach((star) => {
        star.x += velocity.x * star.z;
        star.y += velocity.y * star.z;
        star.x += (star.x - width / 2) * velocity.z * star.z;
        star.y += (star.y - height / 2) * velocity.z * star.z;
        star.z += velocity.z * star.z;
        if (star.x < -OVERFLOW_THRESHOLD || star.x > width + OVERFLOW_THRESHOLD ||
            star.y < -OVERFLOW_THRESHOLD || star.y > height + OVERFLOW_THRESHOLD) {
            recycleStar(star);
        }
    });
}
// 绘制星星
function render() {
    stars.forEach((star) => {
        context.beginPath();
        context.lineCap = 'round';
        context.lineWidth = STAR_SIZE * star.z * scale;
        context.globalAlpha = 0.5 + 0.5 * Math.random();
        context.strokeStyle = STAR_COLOR;
        context.beginPath();
        context.moveTo(star.x, star.y);
        let tailX = velocity.x * 2,
            tailY = velocity.y * 2;
        if (Math.abs(tailX) < 0.1) tailX = 0.5;
        if (Math.abs(tailY) < 0.1) tailY = 0.5;
        context.lineTo(star.x + tailX, star.y + tailY);
        context.stroke();
    });
}
function movePointer(x, y) {
    if (typeof pointerX === 'number' && typeof pointerY === 'number') {
        let ox = x - pointerX,
            oy = y - pointerY;
        velocity.tx = (velocity.tx + (ox / 8 * scale)) * (touchinput ? 1 : -1);
        velocity.ty = (velocity.ty + (oy / 8 * scale)) * (touchinput ? 1 : -1);

    }
    pointerX = x;
    pointerY = y;
}
function onMouseMove(event) {
    touchinput = false;
    movePointer(event.clientX, event.clientY);
}
function onTouchMove(event) {
    touchinput = true;
    movePointer(event.touches[0].clientX, event.touches[0].clientY, true);
    event.preventDefault();
}
function onMouseLeave() {
    pointerX = null;
    pointerY = null;
}
// 结束背景