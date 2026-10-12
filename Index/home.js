        let db = null;
        const DB_STORAGE_KEY = 'SQLITE_TOOLBOX_BYTES_V7';
        let SQL; let localDirty=false; let enginePromise; let searchTimer; const META_KEY='TOOLBOX_META_V9';
        const DRAFT_STORAGE_KEY = 'TOOLBOX_FORM_DRAFT';
        const REMOTE_SQL_FILE = './tools_init.sql'; // 独立数据文件名

        let isAdminUnlocked = false;
        let isSortMode = false;
        let clickCounter = 0;
        let clickTimer = null;
        let dragSrcIndex = null;
        let currentPinnedData = [];

        function initCopyrightYear() {
            const startYear = 2026;
            const currentYear = new Date().getFullYear();
            const yearEl = document.getElementById('copyrightYear');
            if (yearEl) {
                yearEl.innerText = (currentYear > startYear) ? `${startYear}-${currentYear}` : `${startYear}`;
            }
        }

        function resolveToolIcon(name, url, userIcon) {
            if (userIcon && userIcon.trim() !== '') return userIcon.trim();

            const searchStr = (name + ' ' + url).toLowerCase();
            if (searchStr.includes('pdf')) return "https://cdn-icons-png.flaticon.com/512/337/337946.png";
            if (searchStr.includes('qr') || searchStr.includes('二维码')) return "https://cdn-icons-png.flaticon.com/512/714/714390.png";
            if (searchStr.includes('task') || searchStr.includes('plan') || searchStr.includes('任务') || searchStr.includes('计划')) return "https://cdn-icons-png.flaticon.com/512/2693/2693507.png";
            if (searchStr.includes('mind') || searchStr.includes('脑图') || searchStr.includes('思维导图')) return "https://cdn-icons-png.flaticon.com/512/1149/1149168.png";
            if (searchStr.includes('code') || searchStr.includes('代码') || searchStr.includes('run')) return "https://cdn-icons-png.flaticon.com/512/2920/2920277.png";
            if (searchStr.includes('money') || searchStr.includes('cheque') || searchStr.includes('省钱') || searchStr.includes('支票')) return "https://cdn-icons-png.flaticon.com/512/2533/2533032.png";
            if (searchStr.includes('pic') || searchStr.includes('cover') || searchStr.includes('sketch') || searchStr.includes('图片') || searchStr.includes('封面')) return "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
            if (searchStr.includes('emotion') || searchStr.includes('gif') || searchStr.includes('表情')) return "https://cdn-icons-png.flaticon.com/512/187/187150.png";
            if (searchStr.includes('game') || searchStr.includes('tetris') || searchStr.includes('star') || searchStr.includes('游戏')) return "https://cdn-icons-png.flaticon.com/512/566/566312.png";
            if (searchStr.includes('run') || searchStr.includes('running') || searchStr.includes('跑步')) return "https://cdn-icons-png.flaticon.com/512/2871/2871210.png";
            if (searchStr.includes('english') || searchStr.includes('learn') || searchStr.includes('英语')) return "https://cdn-icons-png.flaticon.com/512/3048/3048122.png";

            try {
                const domain = new URL(url).hostname;
                return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            } catch (e) {
                return "https://cdn-icons-png.flaticon.com/512/1006/1006771.png";
            }
        }

        function handleAdminUnlockClicks() {
            clickCounter++;
            clearTimeout(clickTimer);
            clickTimer = setTimeout(() => { clickCounter = 0; }, 1500);

            if (clickCounter >= 5) {
                clickCounter = 0;
                isAdminUnlocked = !isAdminUnlocked;
                alert(isAdminUnlocked ? "🔓 已成功解锁管理功能（新增、编辑、权限控制、锁定保护、拖拽排序）" : "🔒 已锁定管理功能");
                updateAdminUI();
            }
        }

        function updateAdminUI() {
            const addBtn = document.getElementById('addToolBtn');
            const exportSqlScriptBtn = document.getElementById('exportSqlScriptBtn');
            const adminBadge = document.getElementById('adminBadge');

            if (isAdminUnlocked) {
                addBtn.classList.remove('hidden');
                addBtn.classList.add('flex');
                exportSqlScriptBtn.classList.remove('hidden');
                adminBadge.classList.remove('hidden');
            } else {
                addBtn.classList.add('hidden');
                addBtn.classList.remove('flex');
                exportSqlScriptBtn.classList.add('hidden');
                adminBadge.classList.add('hidden');
                isSortMode = false;
            }
            renderTools();
        }

        async function initSqlDb() {
            initCopyrightYear(); setStatus('正在加载工具…');
            try {
                enginePromise ||= initSqlJs({locateFile: file => './vendor/'+file});
                SQL=await enginePromise;
                let meta={}; try {meta=JSON.parse(localStorage.getItem(META_KEY)||'{}')} catch {}
                let cached=null; try {const bytes=localStorage.getItem(DB_STORAGE_KEY); if(bytes) {cached=new SQL.Database(new Uint8Array(JSON.parse(bytes))); validateDb(cached)}} catch {cached?.close();cached=null}
                let remote=null; let networkError=null;
                try {
                    const response=await fetch(REMOTE_SQL_FILE,{cache:'no-cache',signal:AbortSignal.timeout(12000)});
                    if(!response.ok) throw new Error('SQL 文件加载失败：'+response.status);
                    const text=await response.text(); remote=new SQL.Database();remote.run(text);validateDb(remote);
                } catch(e) {remote?.close();remote=null;networkError=e}
                localDirty=Boolean(meta.dirty || (cached && !meta.hash && cached.exec('SELECT count(*) FROM tools')[0].values[0][0]>0));
                if(cached && localDirty) {db=cached;remote?.close();setStatus('已加载本地数据', '本地修改已保留，可导出 SQL 后更新 GitHub。')}
                else if(remote) {db=remote;cached?.close();localDirty=false;persistSqlDb(false);setStatus('工具已就绪','数据来自 tools_init.sql，收藏保存在当前浏览器。')}
                else if(cached && cached.exec('SELECT count(*) FROM tools')[0].values[0][0]>0) {db=cached;setStatus('正在使用离线缓存','网络暂不可用，已加载上次保存的数据。')}
                else {cached?.close();throw networkError || new Error('没有可用数据')}
                ensureColumnsExist();try {const pins=JSON.parse(localStorage.getItem('TOOLBOX_PINS_V9')||'{}');Object.entries(pins).forEach(([id,pin])=>db.run('UPDATE tools SET is_pinned=? WHERE id=?',[pin,Number(id)]))}catch {}updateCategories();renderTools();
                if(!window.draftsReady) {setupDraftListeners();window.draftsReady=true}
                document.querySelectorAll('[data-db]').forEach(el=>el.disabled=false);
            } catch(e) {setStatus('加载失败', e.message+'。请检查网络或重试。');document.getElementById('emptyState').classList.remove('hidden')}
            lucide.createIcons();
        }
        function validateDb(candidate) {candidate.exec('SELECT id,name,url,type,icon,desc,is_pinned,sort_order FROM tools LIMIT 1')}
        function setStatus(text, detail='') {document.getElementById('dbStatus').textContent=text;document.getElementById('loadMessage').textContent=detail}
        function safeUrl(value) {try {const u=new URL(value,location.href);return ['http:','https:'].includes(u.protocol)?u.href:''} catch {return ''}}
        function notify(text) {const el=document.getElementById('toast');el.textContent=text;el.classList.remove('hidden');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.add('hidden'),3000)}
        function openTool(id) {const t=querySql('SELECT * FROM tools WHERE id=?',[id])[0]; const url=safeUrl(t?.url);if(url)window.open(url,'_blank','noopener,noreferrer');else notify('该工具地址无效')}
        function copyTool(id) {copyToClipboard(querySql('SELECT url FROM tools WHERE id=?',[id])[0].url)}
        function copyCaptcha(id) {copyToClipboard(querySql('SELECT unified_captcha FROM tools WHERE id=?',[id])[0].unified_captcha)}


        function createTables() {
            db.run(`
                CREATE TABLE IF NOT EXISTS tools (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    url TEXT NOT NULL,
                    type TEXT DEFAULT '通用',
                    icon TEXT,
                    desc TEXT,
                    is_pinned INTEGER DEFAULT 0,
                    sort_order INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    access_type TEXT DEFAULT 'public',
                    unified_captcha TEXT DEFAULT '',
                    is_locked INTEGER DEFAULT 0
                );
            `);
            persistSqlDb();
        }

        function ensureColumnsExist() {
            try { db.run(`ALTER TABLE tools ADD COLUMN access_type TEXT DEFAULT 'public';`); } catch (e) {}
            try { db.run(`ALTER TABLE tools ADD COLUMN unified_captcha TEXT DEFAULT '';`); } catch (e) {}
            try { db.run(`ALTER TABLE tools ADD COLUMN is_locked INTEGER DEFAULT 0;`); } catch (e) {}
        }

        async function loadExternalSqlData() {
            try {
                const response = await fetch(REMOTE_SQL_FILE);
                if (response.ok) {
                    const sqlScript = await response.text();
                    db.run(sqlScript);
                    ensureColumnsExist();
                    persistSqlDb();
                } else {
                    console.warn("未找到 tools_init.sql，采用空白数据库");
                }
            } catch (e) {
                console.warn("无法从网络获取初始化 SQL，请确保 tools_init.sql 在同一目录下", e);
            }
        }

        function persistSqlDb(dirty=true) {
            localDirty=dirty;
            try {localStorage.setItem(DB_STORAGE_KEY,JSON.stringify(Array.from(db.export())));localStorage.setItem(META_KEY,JSON.stringify({dirty,hash:true}))}
            catch(e) {notify('浏览器存储不可用，请导出备份；刷新可能丢失修改。')}
        }

        function toggleSortMode() {
            isSortMode = !isSortMode;
            const sortBtnText = document.getElementById('sortBtnText');
            const sortBtn = document.getElementById('toggleSortBtn');

            if (isSortMode) {
                sortBtnText.innerText = "完成排序";
                sortBtn.className = "flex items-center gap-1 text-[11px] text-white bg-indigo-600 border border-indigo-600 px-2.5 py-1 rounded-md active:scale-95 transition shadow-sm";
            } else {
                sortBtnText.innerText = "自定义排序";
                sortBtn.className = "flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md active:scale-95 transition";
            }
            renderTools();
        }

        function renderTools() {
            if (!db) return;

            const searchKw = document.getElementById('searchInput').value.trim();
            const filterType = document.getElementById('typeFilter').value;

            let baseSql = `SELECT * FROM tools WHERE 1=1`;
            let params = [];

            // 非管理员且处于 hidden 状态的工具自动隐藏不渲染
            if (!isAdminUnlocked) {
                baseSql += ` AND (access_type IS NULL OR access_type != 'hidden')`;
            }

            if (searchKw) {
                baseSql += ` AND (name LIKE ? OR desc LIKE ? OR type LIKE ? OR url LIKE ?)`;
                params.push(...Array(4).fill(`%${searchKw}%`));
            }
            if (filterType !== 'ALL') {
                baseSql += ` AND type = ?`;
                params.push(filterType);
            }

            let pinnedSql = baseSql + ` AND is_pinned = 1 ORDER BY sort_order ASC, id DESC`;
            let normalSql = baseSql + ` AND is_pinned = 0 ORDER BY sort_order ASC, id DESC`;

            currentPinnedData = querySql(pinnedSql, params);
            const normalItems = querySql(normalSql, params);

            document.getElementById('toolCountBadge').innerText = currentPinnedData.length + normalItems.length;
            document.getElementById('resultCount').textContent=(currentPinnedData.length+normalItems.length)+' 个工具';
            renderCategoryChips();
            document.getElementById('pinnedCountBadge').innerText = currentPinnedData.length;

            const pinnedSection = document.getElementById('pinnedSection');
            const pinnedGrid = document.getElementById('pinnedGrid');

            if (currentPinnedData.length > 0) {
                pinnedSection.classList.remove('hidden');
                pinnedGrid.innerHTML = currentPinnedData.map((item, index) => createCardHtml(item, true, index, currentPinnedData.length)).join('');
            } else {
                pinnedSection.classList.add('hidden');
                pinnedGrid.innerHTML = '';
            }

            const toolsGrid = document.getElementById('toolsGrid');
            const emptyState = document.getElementById('emptyState');

            if (normalItems.length > 0) {
                toolsGrid.innerHTML = normalItems.map((item, index) => createCardHtml(item, false, index, normalItems.length)).join('');
            } else {
                toolsGrid.innerHTML = '';
            }

            if (currentPinnedData.length === 0 && normalItems.length === 0) {
                emptyState.classList.remove('hidden');
            } else {
                emptyState.classList.add('hidden');
            }

            lucide.createIcons();
        }

        function querySql(sql, params) {
            const stmt = db.prepare(sql);
            stmt.bind(params);
            const list = [];
            while (stmt.step()) {
                list.push(stmt.getAsObject());
            }
            stmt.free();
            return list;
        }

        function getAccessBadgeHtml(accessType) {
            switch(accessType) {
                case 'hidden':
                    return `<span class="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-medium flex items-center gap-0.5"><i data-lucide="eye-off" class="w-3 h-3"></i>隐藏</span>`;
                case 'captcha':
                    return `<span class="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-medium flex items-center gap-0.5"><i data-lucide="key-round" class="w-3 h-3"></i>验证码</span>`;
                case 'code_per_user':
                    return `<span class="px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-medium flex items-center gap-0.5"><i data-lucide="ticket" class="w-3 h-3"></i>一码一发</span>`;
                case 'public':
                default:
                    return `<span class="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-medium flex items-center gap-0.5"><i data-lucide="globe" class="w-3 h-3"></i>公开</span>`;
            }
        }

        function createCardHtml(item,isPinned,index,total) {
            const e=escapeHtml, id=Number(item.id); const url=safeUrl(item.url); const icon=safeUrl(item.icon);
            return `<article class="tool-card" draggable="${isSortMode&&isPinned}" ondragstart="handleDragStart(event,${index})" ondragover="handleDragOver(event)" ondrop="handleDrop(event,${index})">
              <div class="card-top"><span class="tool-icon"><span>${e((item.name||'工').slice(0,1))}</span>${icon?`<img loading="lazy" referrerpolicy="no-referrer" src="${e(icon)}" alt="" onerror="this.remove()">`:''}</span><span class="category-label">${e(item.type||'通用')}</span><button class="pin ${isPinned?'selected':''}" aria-label="${isPinned?'取消收藏':'收藏'} ${e(item.name)}" onclick="togglePin(${id},${item.is_pinned})"><i data-lucide="star"></i></button></div>
              <h3><a href="${e(url||'#')}" target="_blank" rel="noopener noreferrer" ${!url?'aria-disabled="true" onclick="event.preventDefault()"':''}>${e(item.name)}</a></h3><p class="description">${e(item.desc||'打开工具，开始使用')}</p>
              ${item.access_type==='captcha'&&item.unified_captcha?`<button class="captcha" onclick="copyCaptcha(${id})">复制访问验证码</button>`:''}
              <div class="card-bottom"><span>${item.access_type==='hidden'?'隐藏':item.access_type==='captcha'?'验证码':item.access_type==='code_per_user'?'一码一发':'在线工具'}</span><div><button aria-label="复制 ${e(item.name)} 链接" onclick="copyTool(${id})"><i data-lucide="link"></i></button>${isAdminUnlocked?`<button title="编辑" onclick="editTool(${id})"><i data-lucide="pencil"></i></button><button title="访问设置" onclick="openAccessModal(${id})"><i data-lucide="shield"></i></button>${item.is_locked?'':`<button title="删除" onclick="deleteTool(${id})"><i data-lucide="trash-2"></i></button>`}`:''}${isSortMode&&isPinned?`<button ${index===0?'disabled':''} onclick="movePinnedOrder(${index},-1)" aria-label="前移">←</button><button ${index===total-1?'disabled':''} onclick="movePinnedOrder(${index},1)" aria-label="后移">→</button>`:''}<a href="${e(url||'#')}" target="_blank" rel="noopener noreferrer" aria-label="打开 ${e(item.name)}"><i data-lucide="arrow-up-right"></i></a></div></div></article>`;
        }

        async function copyToClipboard(text,successMsg='已复制到剪贴板') {try {await navigator.clipboard.writeText(text);notify(successMsg)} catch {notify('复制失败，请手动复制')}}

        function openAccessModal(id) {
            const stmt = db.prepare(`SELECT * FROM tools WHERE id = ?`);
            stmt.bind([id]);
            if (stmt.step()) {
                const tool = stmt.getAsObject();
                document.getElementById('accessToolId').value = tool.id;
                document.getElementById('accessType').value = tool.access_type || 'public';
                document.getElementById('unifiedCaptcha').value = tool.unified_captcha || '';
                document.getElementById('isLocked').checked = tool.is_locked === 1;

                toggleAccessFields();
                document.getElementById('accessModal').classList.remove('hidden');
            }
            stmt.free();
        }

        function closeAccessModal() {
            document.getElementById('accessModal').classList.add('hidden');
        }

        function toggleAccessFields() {
            const accessType = document.getElementById('accessType').value;
            const captchaGroup = document.getElementById('captchaGroup');
            
            if (accessType === 'captcha') {
                captchaGroup.classList.remove('hidden');
            } else {
                captchaGroup.classList.add('hidden');
            }
        }

        function copyUnifiedCaptchaFromModal() {
            const captcha = document.getElementById('unifiedCaptcha').value.trim();
            if (!captcha) {
                alert("请先输入验证码内容");
                return;
            }
            copyToClipboard(captcha, "统一验证码已成功复制！");
        }

        function handleAccessFormSubmit(e) {
            e.preventDefault();
            const id = document.getElementById('accessToolId').value;
            const accessType = document.getElementById('accessType').value;
            const unifiedCaptcha = document.getElementById('unifiedCaptcha').value.trim();
            const isLocked = document.getElementById('isLocked').checked ? 1 : 0;

            const stmt = db.prepare(`UPDATE tools SET access_type=?, unified_captcha=?, is_locked=? WHERE id=?`);
            stmt.run([accessType, unifiedCaptcha, isLocked, id]);
            stmt.free();

            persistSqlDb();
            renderTools();
            closeAccessModal();
        }

        function handleDragStart(e, index) {
            dragSrcIndex = index;
            e.dataTransfer.effectAllowed = 'move';
        }

        function handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        }

        function handleDrop(e, targetIndex) {
            e.preventDefault();
            if (dragSrcIndex !== null && dragSrcIndex !== targetIndex) {
                const movedItem = currentPinnedData.splice(dragSrcIndex, 1)[0];
                currentPinnedData.splice(targetIndex, 0, movedItem);
                savePinnedOrder();
            }
        }

        function movePinnedOrder(index, direction) {
            const targetIndex = index + direction;
            if (targetIndex >= 0 && targetIndex < currentPinnedData.length) {
                const temp = currentPinnedData[index];
                currentPinnedData[index] = currentPinnedData[targetIndex];
                currentPinnedData[targetIndex] = temp;
                savePinnedOrder();
            }
        }

        function savePinnedOrder() {
            db.run("BEGIN TRANSACTION;");
            const stmt = db.prepare(`UPDATE tools SET sort_order = ? WHERE id = ?`);
            currentPinnedData.forEach((item, idx) => {
                stmt.run([idx + 1, item.id]);
            });
            stmt.free();
            db.run("COMMIT;");

            persistSqlDb();
            renderTools();
        }

        function setupDraftListeners() {
            const fields = ['toolName', 'toolUrl', 'toolType', 'toolIcon', 'toolDesc', 'toolPinned'];
            fields.forEach(fieldId => {
                const el = document.getElementById(fieldId);
                el.addEventListener('input', saveDraft);
                el.addEventListener('change', saveDraft);
            });
        }

        function saveDraft() {
            if (document.getElementById('toolId').value) return;

            const draft = {
                name: document.getElementById('toolName').value,
                url: document.getElementById('toolUrl').value,
                type: document.getElementById('toolType').value,
                icon: document.getElementById('toolIcon').value,
                desc: document.getElementById('toolDesc').value,
                isPinned: document.getElementById('toolPinned').checked
            };
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        }

        function loadDraftIfExist() {
            if (document.getElementById('toolId').value) return;

            const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
            const alertBox = document.getElementById('draftAlert');
            if (saved) {
                try {
                    const draft = JSON.parse(saved);
                    let hasContent = false;
                    if (draft.name) { document.getElementById('toolName').value = draft.name; hasContent = true; }
                    if (draft.url) { document.getElementById('toolUrl').value = draft.url; hasContent = true; }
                    if (draft.type) { document.getElementById('toolType').value = draft.type; hasContent = true; }
                    if (draft.icon) { document.getElementById('toolIcon').value = draft.icon; hasContent = true; }
                    if (draft.desc) { document.getElementById('toolDesc').value = draft.desc; hasContent = true; }
                    if (draft.isPinned !== undefined) document.getElementById('toolPinned').checked = draft.isPinned;

                    if (hasContent) alertBox.classList.remove('hidden');
                    else alertBox.classList.add('hidden');
                } catch (e) {}
            } else {
                alertBox.classList.add('hidden');
            }
        }

        function clearDraft() {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            document.getElementById('draftAlert').classList.add('hidden');
        }

        function handleFormSubmit(e) {
            e.preventDefault();
            const id = document.getElementById('toolId').value;
            const name = document.getElementById('toolName').value.trim();
            const url = document.getElementById('toolUrl').value.trim();
            const type = document.getElementById('toolType').value.trim() || '通用';
            const rawIcon = document.getElementById('toolIcon').value.trim();
            const desc = document.getElementById('toolDesc').value.trim();
            const isPinned = document.getElementById('toolPinned').checked ? 1 : 0;

            if(!safeUrl(url)|| (rawIcon&&!safeUrl(rawIcon))) {notify('请使用有效的 HTTP 或 HTTPS 地址');return}
            const finalIcon = rawIcon;

            if (id) {
                const stmt = db.prepare(`UPDATE tools SET name=?, url=?, type=?, icon=?, desc=?, is_pinned=? WHERE id=?`);
                stmt.run([name, url, type, finalIcon, desc, isPinned, id]);
                stmt.free();
            } else {
                const stmt = db.prepare(`INSERT INTO tools (name, url, type, icon, desc, is_pinned, sort_order, created_at, access_type, unified_captcha, is_locked) VALUES (?, ?, ?, ?, ?, ?, 9999, datetime('now', 'localtime'), 'public', '', 0)`);
                stmt.run([name, url, type, finalIcon, desc, isPinned]);
                stmt.free();
                clearDraft();
            }

            persistSqlDb();
            updateCategories();
            renderTools();
            closeModal();
        }

        // 智能同步功能：导出包含增删改后续最新数据的 tools_init.sql 脚本
        function exportSqlDumpScript() {
            const allTools = querySql(`SELECT * FROM tools ORDER BY id ASC`, []);
            
            let sqlContent = `-- 初始化工具箱表结构\n`;
            sqlContent += `CREATE TABLE IF NOT EXISTS tools (\n`;
            sqlContent += `    id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;
            sqlContent += `    name TEXT NOT NULL,\n`;
            sqlContent += `    url TEXT NOT NULL,\n`;
            sqlContent += `    type TEXT DEFAULT '通用',\n`;
            sqlContent += `    icon TEXT,\n`;
            sqlContent += `    desc TEXT,\n`;
            sqlContent += `    is_pinned INTEGER DEFAULT 0,\n`;
            sqlContent += `    sort_order INTEGER DEFAULT 0,\n`;
            sqlContent += `    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n`;
            sqlContent += `    access_type VARCHAR(20) NOT NULL DEFAULT 'public',\n`;
            sqlContent += `    unified_captcha VARCHAR(50) DEFAULT '',\n`;
            sqlContent += `    is_locked TINYINT(1) NOT NULL DEFAULT 0\n`;
            sqlContent += `);\n\n`;

            sqlContent += `-- 清空旧数据\n`;
            sqlContent += `DELETE FROM tools;\n\n`;
            
            if (allTools.length > 0) {
                sqlContent += `INSERT INTO tools (id, name, url, type, icon, desc, is_pinned, sort_order, created_at, access_type, unified_captcha, is_locked) VALUES\n`;
                const values = allTools.map(t => {
                    const esc = (str) => (str || '').replace(/'/g, "''");
                    return `(${t.id}, '${esc(t.name)}', '${esc(t.url)}', '${esc(t.type)}', '${esc(t.icon)}', '${esc(t.desc)}', ${t.is_pinned}, ${t.sort_order || t.id}, '${esc(t.created_at)}', '${esc(t.access_type || 'public')}', '${esc(t.unified_captcha || '')}', ${t.is_locked || 0})`;
                }).join(',\n');
                sqlContent += values + `;\n`;
            }

            const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `tools_init.sql`;
            link.click();
            alert("已成功导出最新 `tools_init.sql` 脚本！");
        }

        function deleteTool(id) {
            const stmt = db.prepare(`SELECT is_locked FROM tools WHERE id = ?`);
            stmt.bind([id]);
            if (stmt.step()) {
                const tool = stmt.getAsObject();
                if (tool.is_locked === 1) {
                    alert('该工具已设定为“锁定”状态，禁止删除！');
                    stmt.free();
                    return;
                }
            }
            stmt.free();

            if (confirm(`确认删除该工具卡片吗？`)) {
                const delStmt = db.prepare(`DELETE FROM tools WHERE id = ?`);
                delStmt.run([id]);
                delStmt.free();

                persistSqlDb();
                updateCategories();
                renderTools();
            }
        }

        function togglePin(id,currentPin) {
            const prefs=JSON.parse(localStorage.getItem('TOOLBOX_PINS_V9')||'{}');prefs[id]=currentPin?0:1;
            try {localStorage.setItem('TOOLBOX_PINS_V9',JSON.stringify(prefs))}catch {notify('收藏无法保存')}
            db.run('UPDATE tools SET is_pinned=? WHERE id=?',[prefs[id],id]);renderTools();
        }

        function editTool(id) {
            const stmt = db.prepare(`SELECT * FROM tools WHERE id = ?`);
            stmt.bind([id]);
            
            if (stmt.step()) {
                const tool = stmt.getAsObject();
                document.getElementById('modalTitle').innerText = `修改工具信息`;
                document.getElementById('toolId').value = tool.id;
                document.getElementById('toolName').value = tool.name;
                document.getElementById('toolUrl').value = tool.url;
                document.getElementById('toolType').value = tool.type || '';
                document.getElementById('toolIcon').value = tool.icon || '';
                document.getElementById('toolDesc').value = tool.desc || '';
                document.getElementById('toolPinned').checked = tool.is_pinned === 1;

                document.getElementById('draftAlert').classList.add('hidden');
                document.getElementById('toolModal').classList.remove('hidden');
            }
            stmt.free();
        }

        function updateCategories() {
            if (!db) return;
            const select = document.getElementById('typeFilter');
            const datalist = document.getElementById('categoryDatalist');
            const current = select.value;

            const res = db.exec(`SELECT DISTINCT type FROM tools WHERE type IS NOT NULL AND type != ''`);
            let types = [];
            if (res.length > 0 && res[0].values) {
                types = res[0].values.map(v => v[0]);
            }

            select.innerHTML = `<option value="ALL">所有分类</option>` + 
                types.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
            select.value = types.includes(current) ? current : 'ALL';

            datalist.innerHTML = types.map(t => `<option value="${escapeHtml(t)}">`).join('');
        }

        function exportSqlDb() {
            const data = db.export();
            const blob = new Blob([data], { type: 'application/x-sqlite3' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `toolbox_database_${Date.now()}.sqlite`;
            link.click();
        }

        async function importFile(event) {
            const file=event.target.files[0];if(!file||!SQL||!db)return;
            if(file.size>10*1024*1024){notify('请选择小于 10MB 的文件');return}
            let candidate;
            try {
                const ext=file.name.split('.').pop().toLowerCase();
                candidate=new SQL.Database(ext==='sqlite'||ext==='db'?new Uint8Array(await file.arrayBuffer()):db.export());
                if(ext==='sql')candidate.run(await file.text());
                else if(ext==='json') {
                    const rows=JSON.parse(await file.text());if(!Array.isArray(rows))throw new Error('JSON 应为数组');
                    candidate.run('BEGIN');for(const t of rows){if(!t.name||!safeUrl(t.url))throw new Error('工具名称或地址无效');candidate.run('INSERT INTO tools(name,url,type,icon,desc,is_pinned) VALUES(?,?,?,?,?,?)',[t.name,t.url,t.type||'通用',t.icon||'',t.desc||'',t.isPinned||t.is_pinned?1:0])}candidate.run('COMMIT');
                }else if(!['sqlite','db'].includes(ext))throw new Error('不支持的文件类型');
                validateDb(candidate);const previous=db;db=candidate;ensureColumnsExist();previous.close();persistSqlDb();updateCategories();renderTools();notify('导入成功');
            }catch(e){candidate?.close();notify('导入失败：'+e.message)}finally{event.target.value=''}
        }

        function openModal() {
            document.getElementById('modalTitle').innerText = '添加新工具';
            document.getElementById('toolForm').reset();
            document.getElementById('toolId').value = '';
            document.getElementById('toolModal').classList.remove('hidden');
            loadDraftIfExist();
        }

        function closeModal() {
            document.getElementById('toolModal').classList.add('hidden');
        }

        function escapeHtml(str) {
            return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }


        function renderCategoryChips() {
            const rows=querySql("SELECT type,count(*) AS n FROM tools WHERE (?=1 OR coalesce(access_type,'public')!='hidden') GROUP BY type ORDER BY n DESC,type",[isAdminUnlocked?1:0]);
            const selected=document.getElementById('typeFilter').value;
            const wrap=document.getElementById('categoryChips');wrap.replaceChildren();
            [['ALL','全部工具',rows.reduce((n,t)=>n+t.n,0)],...rows.map(t=>[t.type,t.type||'通用',t.n])].forEach(([v,label,n])=>{const b=document.createElement('button');b.className='chip'+(selected===v?' active':'');b.setAttribute('aria-pressed',String(selected===v));b.textContent=label+' '+n;b.onclick=()=>{document.getElementById('typeFilter').value=v;renderTools()};wrap.append(b)});
        }
        function resetSearch(){document.getElementById('searchInput').value='';document.getElementById('typeFilter').value='ALL';renderTools()}
        async function refreshRemote(){if(localDirty&&!confirm('当前有本地修改。请先导出 SQL 备份。确认用 GitHub 数据替换？'))return;try{localStorage.setItem(META_KEY,JSON.stringify({dirty:false,hash:true}))}catch{};localDirty=false;await initSqlDb()}
        document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeAccessModal()}if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();document.getElementById('searchInput').focus()}});
        document.addEventListener('DOMContentLoaded',initSqlDb);
