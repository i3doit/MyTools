<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Typing Practice Game</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background-color: #e8f5e9;
            font-family: 'Arial', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            touch-action: manipulation;
        }

        .container {
            max-width: 800px;
            width: 100%;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        #gameCanvas {
            border: 2px solid #4CAF50;
            border-radius: 8px;
            background: #000;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin: 15px 0;
        }
        .stat-box {
            background: #333;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
        }
				input[type="range"] {
            width: 200px;
            margin: 10px;
        }
				.stage-indicator {
            position: absolute;
            top: 20px;
            left: 20px;
            font-size: 24px;
            color: #4CAF50;
        }
        .controls {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin: 10px 0;
            flex-wrap: wrap;
        }

        button {
            padding: 8px 16px;
            cursor: pointer;
            background-color: #4CAF50;
            border: none;
            color: white;
            border-radius: 4px;
            min-width: 100px;
        }

        canvas {
            background-color: rgba(255, 255, 255, 0.8);
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            width: 100%;
            height: 400px;
            touch-action: none;
        }

        .score-container {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin: 10px 0;
        }

        .score-box {
            padding: 8px 16px;
            background-color: #fff;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .negative {
            background-color: #ffcdd2;
        }

        .feedback-boxes {
            display: flex;
            gap: 20px;
            margin-top: 20px;
            width: 100%;
            height: 120px;
        }

        .feedback-box {
            flex: 1;
            height: 100%;
            padding: 10px;
            border-radius: 4px;
            overflow-y: auto;
            font-size: 14px;
            line-height: 1.5;
        }

        #correctBox {
            background-color: #c8e6c9;
            color: #2e7d32;
        }

        #errorBox {
            background-color: #ffcdd2;
            color: #c62828;
        }

        .toast {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 10px 20px;
            border-radius: 4px;
            display: none;
            z-index: 1000;
        }

        #virtualInput {
            position: fixed;
            top: -100px;
            width: 1px;
            height: 1px;
            opacity: 0;
        }
    </style>
</head>
<body>
        <div class="stats">
            <div class="stat-box">倒计时: <span id="timer">60</span>s</div>
            <div class="stat-box">当前得分: <span id="currentScore">0</span></div>
            <div class="stat-box">历史总数: <span id="totalCorrect">0</span></div>
        </div>
        <div class="stage-indicator">阶段 <span id="stage">1</span></div>
        <canvas id="gameCanvas"></canvas>
    <div class="container">
        <div class="header">
            <h1>Typing Practice Game</h1>
            <div class="score-container">
                <div class="score-box">🏆 Current: <span id="currentScore">0</span></div>
                <div class="score-box">🎖️ Best: <span id="bestScore">0</span></div>
            </div>
            <div class="controls">
                <button id="startBtn">Start Game</button>
                <button id="pauseBtn" disabled>Pause</button>
                <button id="resetBtn">Reset</button>
            </div>
            <div>
                <label>Speed Level: <span id="speedValue">5</span></label>
                <input type="range" id="speedControl" min="1" max="10" value="5">
            </div>
        </div>


        <canvas id="gameCanvas"></canvas>
        <input type="text" id="virtualInput" 
               inputmode="text" 
               autocapitalize="none" 
               autocomplete="off" 
               autocorrect="off" 
               spellcheck="false"
               maxlength="1">

        <div class="feedback-boxes">
            <div id="correctBox" class="feedback-box"></div>
            <div id="errorBox" class="feedback-box"></div>
        </div>

        <div id="toast" class="toast"></div>
    </div>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const virtualInput = document.getElementById('virtualInput');
        let letters = [];
        let score = 0;
        let bestScore = localStorage.getItem('bestScore') || 0;
        let animationId = null;
        let isPlaying = false;
        let isPaused = false;
        let canGenerate = true;
        const GENERATION_HEIGHT = 300; // 画布3/4处触发新字母生成
				let countdown = 60;
        let lettersPerDrop = 1;
        let stageTarget = 30;
	      let stage = 1;
        let totalCorrect = 0;

        // 初始化Canvas尺寸
        function initCanvas() {
            canvas.width = Math.min(window.innerWidth * 0.9, 800);
            canvas.height = 400;
        }
        initCanvas();
        window.addEventListener('resize', initCanvas);

        // 速度控制（优化速度曲线）
        const speedControl = document.getElementById('speedControl');
        speedControl.addEventListener('input', () => {
            document.getElementById('speedValue').textContent = speedControl.value;
        });
        const getSpeed = () => {
            const level = parseInt(speedControl.value);
            return 0.5 + (level * 0.2); // 1级:0.7px/frame，10级:2.5px/frame
        };

        // 字母对象
        class Letter {
            constructor() {
                this.x = Math.random() * (canvas.width - 50);
                this.y = 0;
                this.char = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
                this.speed = getSpeed();
                this.hasTriggered = false;
							   // this.speed = 1 + (stage * 0.3);
                this.active = true;
            }
        }

        // 游戏主循环
        function gameLoop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (!isPaused) {
                // 生成新字母逻辑
                //if (letters.length === 0 || 
                   // (letters[letters.length-1].y > GENERATION_HEIGHT && canGenerate)) {
                    //letters.push(new Letter());
                    //canGenerate = false;
              //  }
		            // 生成新字母
		            if(letters.filter(l => l.active).length < lettersPerDrop) {
		                letters.push(new Letter());
										canGenerate = false;
		            }

                // 更新字母位置
                letters.forEach((letter, index) => {
                if(letter.active) {
										letter.y += letter.speed;
                    ctx.fillStyle = letter.color;
                    ctx.font = '24px Arial';
                    ctx.fillText(letter.char, letter.x, letter.y);

                    // 到达底部处理
                    if (letter.y > canvas.height) {
                        letters.splice(index, 1);
                        updateScore(-2);
                        addToBox('errorBox', letter.char);
                        showToast(`Missed: -2`, 'error');
                        canGenerate = true;
                    }
									}
                });
            }
            
            if (isPlaying) {
                animationId = requestAnimationFrame(gameLoop);
            }
        }

				// 倒计时控制
        function startTimer() {
            const timerInterval = setInterval(() => {
                if(isPlaying && !document.hidden) {
                    countdown--;
                    document.getElementById('timer').textContent = countdown;

                    if(countdown <= 0) {
                        clearInterval(timerInterval);
                        checkStageUpgrade();
                    }
                }
            }, 1000);
        }
        // 阶段升级检测
        function checkStageUpgrade() {
            if(totalCorrect >= stageTarget) {
                stage++;
                lettersPerDrop++;
                stageTarget = stage * 30;
                score += 30; // 阶段升级奖励
                
                // 更新显示
                document.getElementById('stage').textContent = stage;
                document.getElementById('currentScore').textContent = score;
                
                // 重置倒计时
                countdown = 60;
                document.getElementById('timer').textContent = countdown;
                startTimer();
                
                // 清空现有字母
                letters = [];
            } else {
                alert(`挑战失败！最终得分：${score}`);
                resetGame();
            }
        }

				function resetGame() {
            isPlaying = false;
            stage = 1;
            score = 0;
            totalCorrect = 0;
            lettersPerDrop = 1;
            stageTarget = 30;
            countdown = 60;
            letters = [];
            document.getElementById('stage').textContent = stage;
            document.getElementById('currentScore').textContent = score;
            document.getElementById('totalCorrect').textContent = totalCorrect;
            document.getElementById('timer').textContent = countdown;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // 得分更新
        function updateScore(value) {
            score += value;
            if(value > 0) totalCorrect += value;
            document.getElementById('currentScore').textContent = score;
						document.getElementById('totalCorrect').textContent = totalCorrect;
            const currentScoreBox = document.getElementById('currentScore').parentElement;
            currentScoreBox.classList.toggle('negative', score < 0);
            
            if (score > bestScore) {
                bestScore = score;
                localStorage.setItem('bestScore', bestScore);
                document.getElementById('bestScore').textContent = bestScore;
            }
        }

        // 输入处理
        document.getElementById('virtualInput').addEventListener('input', function(e) {
            const inputChar = this.value.toUpperCase();
            if(!inputChar) return;

            const hitLetter = letters.find(letter => 
                letter.active && 
                letter.char === inputChar &&
                letter.y < canvas.height - 20
            );

            if(hitLetter) {
                hitLetter.active = false;
                updateScore(10);
                setTimeout(() => {
                    letters.splice(letters.indexOf(hitLetter), 1);
                }, 100);
            } else {
                updateScore(-3);
            }
            this.value = '';
        });

        // 游戏控制
        document.addEventListener('click', () => {
            if(!isPlaying) {
                isPlaying = true;
                virtualInput.focus();
                gameLoop();
                startTimer();
            }
        });

        // 添加内容到反馈框
        function addToBox(boxId, content) {
            const box = document.getElementById(boxId);
            box.innerHTML += `${content} `;
            box.scrollTop = box.scrollHeight;
        }

        // Toast提示
        function showToast(message, type) {
            const toast = document.getElementById('toast');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            toast.style.display = 'block';
            setTimeout(() => toast.style.display = 'none', 1000);
        }

        // 输入处理
        function handleInput(e) {
            if (!isPlaying || isPaused) return;
            
            const char = e.target.value.toUpperCase();
            if (!char) return;

            const index = letters.findIndex(letter => letter.char === char);
            
            if (index !== -1) {
                letters.splice(index, 1);
                updateScore(10);
                addToBox('correctBox', char);
                showToast(`Correct: +10`, 'success');
                canGenerate = true;
            } else {
                updateScore(-5);
                showToast(`Wrong: -5`, 'error');
            }
            
            virtualInput.value = '';
        }

        // 事件监听
        virtualInput.addEventListener('input', handleInput);
        canvas.addEventListener('touchstart', () => virtualInput.focus());

        // 按钮控制
        document.getElementById('startBtn').addEventListener('click', () => {
            if (!isPlaying) {
                isPlaying = true;
                isPaused = false;
                virtualInput.focus();
                letters = [];
                gameLoop();
                document.getElementById('startBtn').disabled = true;
                document.getElementById('pauseBtn').disabled = false;
            }
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            if (!isPlaying) return;
            isPaused = !isPaused;
            document.getElementById('pauseBtn').textContent = isPaused ? 'Resume' : 'Pause';
            virtualInput.focus();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            cancelAnimationFrame(animationId);
            isPlaying = false;
            isPaused = false;
            score = 0;
            letters = [];
            updateScore(0);
            document.getElementById('correctBox').innerHTML = '';
            document.getElementById('errorBox').innerHTML = '';
            document.getElementById('startBtn').disabled = false;
            document.getElementById('pauseBtn').disabled = true;
            document.getElementById('pauseBtn').textContent = 'Pause';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            virtualInput.blur();
        });

        // 初始化最高分
        document.getElementById('bestScore').textContent = bestScore;
    </script>
</body>
</html>
