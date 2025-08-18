#底部广告
<div class="ad-container">
    <div class="ad-title">AI编程挑战赛</div>
    <div class="ad-content">
        我正在参与「AI编程·垂直小流量商业化」星球挑战用AI 写「100个AI小工具」
        <br>
        <a href="https://t.zsxq.com/yL7L8" class="ad-highlight">一起加入讨论吧</a>
    </div>
</div>

#关键样式
/* 页脚整体样式 */
footer {
    display: flex;
    flex-direction: column;
    padding: 25px;
    border-radius: 16px;
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.7);
    box-shadow: var(--card-shadow);
    margin-top: 30px;
    gap: 20px;
    position: relative;
    overflow: hidden;
}
footer::before {
    content: '';
    background: linear-gradient(120deg, rgba(91, 143, 185, 0.1), rgba(123, 189, 230, 0.1));
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
}

/* 广告容器 */
.ad-container {
    background: linear-gradient(45deg, rgba(255, 200, 150, 0.2), rgba(255, 175, 125, 0.3));
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    max-width: 600px;
    width: 100%;
    margin: 0 auto;
}
.ad-highlight {
    display: inline-block;
    padding: 8px 20px;
    border-radius: 50px;
    background: linear-gradient(45deg, #ff8c00, #ff5500);
    color: white;
    font-weight: 600;
    text-decoration: none;
    box-shadow: 0 4px 10px rgba(255, 140, 0, 0.3);
    transition: all 0.3s ease;
}
.ad-highlight:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(255, 140, 0, 0.4);
}

/* 分享链接 */
.share-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 15px;
}
.share-link {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(91, 143, 185, 0.1);
    transition: var(--transition);
    color: var(--dark);
    font-size: 22px;
}
.share-link:hover {
    transform: translateY(-5px);
    background: var(--primary);
    color: white;
    box-shadow: 0 5px 15px rgba(91, 143, 185, 0.3);
}
.tooltip::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: -35px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.3s ease;
}
.tooltip:hover::after {
    opacity: 1;
}

/* 作者链接 */
.author-links {
    display: flex;
    gap: 20px;
    justify-content: center;
    width: 100%;
}
.author-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-decoration: none;
    color: var(--dark);
    transition: var(--transition);
}
.author-link:hover {
    color: var(--primary);
    transform: translateY(-3px);
}


#底部代码与样式
<footer>
    <!-- 广告容器（上述广告文案） -->
    <div class="ad-container">...</div>

    <!-- 分享链接 -->
    <div class="share-links">
        <div class="share-title">分享到：</div>
        <a href="#" class="share-link tooltip" data-tooltip="微信" id="wechat-share"><i class="fab fa-weixin"></i></a>
        <a href="#" class="share-link tooltip" data-tooltip="QQ" id="qq-share"><i class="fab fa-qq"></i></a>
        <a href="#" class="share-link tooltip" data-tooltip="微博"><i class="fab fa-weibo"></i></a>
        <a href="#" class="share-link tooltip" data-tooltip="Instagram"><i class="fab fa-instagram"></i></a>
        <a href="#" class="share-link tooltip" data-tooltip="Facebook"><i class="fab fa-facebook-f"></i></a>
        <a href="#" class="share-link tooltip" data-tooltip="WhatsApp"><i class="fab fa-whatsapp"></i></a>
        <a href="#" class="share-link tooltip" data-tooltip="X"><i class="fab fa-twitter"></i></a>
    </div>

    <!-- 作者链接 -->
    <div class="author-links">
        <a href="https://t.zsxq.com/11QO9" target="_blank" title="联系作者">
            <i class="fas fa-headset"></i>
            <span>联系作者</span>
        </a>
        <a href="https://mp.weixin.qq.com/s/aB6rkYbBDi1CDau6hLs1jg" target="_blank" title="微信公众号">
            <i class="fab fa-weixin"></i>
            <span>公众号</span>
        </a>
        <a href="https://i3doit.github.io/AI_Tools_2.6.html" target="_blank" title="主页">
            <i class="fas fa-home"></i>
            <span>主页</span>
        </a>
    </div>

    <!-- 版权信息 -->
    <div class="copyright" id="copyright">
        © <span id="current-year">2025</span> FireNotes - 您的智能便签助手
    </div>
</footer>

#JS
#点击分享 WeChat- share

document.getElementById('wechat-share').addEventListener('click', (e) => {
    e.preventDefault();
    copyToClipboard('857023577'); // 复制微信号
    showToast('已获取艾兜兜儿微信：857023577，去链接吧');
});

#动态版权
function initCopyright() {
    const currentYear = new Date().getFullYear();
    const startYear = 2025;
    document.getElementById('current-year').textContent = 
        currentYear > startYear ? `${startYear} - ${currentYear}` : startYear;
}



