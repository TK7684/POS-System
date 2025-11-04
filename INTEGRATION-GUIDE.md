# 🔧 AI Overlay Fix Integration Guide

## 📋 Overview
This guide shows how to integrate the AI overlay fixes into your existing `Index.html` without rewriting the entire file.

## 🎯 Quick Integration Steps

### 1. **Add CSS Fixes**
Add these lines to your `<head>` section (after existing CSS):

```html
<!-- Load AI overlay fixes -->
<link rel="stylesheet" href="css/ai-chat-fix.css" />
```

### 2. **Add JavaScript Fixes**
Add these lines before your closing `</body>` tag:

```html
<!-- Load AI overlay fixes -->
<script src="js/fixes/AIOverlayFix.js"></script>
```

### 3. **Enhance AI Panel Controls**
Replace the AI panel header section with this improved version:

**Find this section:**
```html
<div style="padding:12px 14px; border-bottom:1px solid var(--line); display:flex; align-items:center; gap:8px;">
  <strong style="font-size: var(--fs-md);">ผู้ช่วยร้าน · AI</strong>
  <span class="muted" style="font-size: var(--fs-xs);">พิมพ์คำสั่งหรือคำถาม</span>
  <div style="flex:1"></div>
  <button id="ai-close" class="btn ghost" aria-label="ปิด">✖</button>
</div>
```

**Replace with:**
```html
<div style="padding:12px 14px; border-bottom:1px solid var(--line); display:flex; align-items:center; gap:8px;">
  <strong style="font-size: var(--fs-md);">🤖 ผู้ช่วยร้าน · AI (Fixed)</strong>
  <span class="muted" id="ai-status-text" style="font-size: var(--fs-xs);">พิมพ์คำสั่งหรือคำถาม</span>
  <div style="flex:1"></div>
  <button id="ai-minimize" class="btn ghost" aria-label="ย่อหน้าต่าง" style="padding: 4px 8px; min-height: 32px; font-size: 12px;">−</button>
  <button id="ai-close" class="btn ghost" aria-label="ปิดหน้าต่าง" style="padding: 4px 8px; min-height: 32px; font-size: 12px;">✖</button>
</div>
```

### 4. **Add Emergency Controls**
Add this right after the AI panel:

```html
<!-- Emergency Close Button (Hidden by default) -->
<button id="ai-emergency-close" style="
  position: fixed; top: 10px; right: 10px; z-index: 10005; background: rgba(239, 68, 68, 0.9);
  color: white; padding: 8px 12px; border-radius: 8px; border: none; cursor: pointer;
  font-size: 12px; font-weight: bold; display: none; pointer-events: all;"
  onclick="forceCloseAI()">Emergency Close AI</button>

<!-- AI Status Indicator -->
<div id="ai-status-indicator" class="ai-status-indicator" style="
  position: fixed; top: 10px; left: 10px; background: rgba(15, 118, 110, 0.9);
  color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px;
  font-weight: 600; z-index: 10001; display: none;">AI: พร้อมช่วยเหลือ</div>
```

### 5. **Add Diagnostic Panel**
Add this card to your dashboard grid:

```html
<div class="card">
  <h3 style="margin:0 0 8px">AI Diagnostics</h3>
  <div id="ai-diagnostics" style="font-family: monospace; font-size: 12px; background: #f5f5f5; padding: 8px; border-radius: 4px; max-height: 150px; overflow-y: auto;">
    Loading diagnostics...
  </div>
  <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap">
    <button class="btn ghost" onclick="runDiagnostics()">ตรวจสอบ</button>
    <button class="btn ghost" onclick="resetAI()">รีเซ็ต AI</button>
    <button class="btn ghost" onclick="clearAICache()">ล้างแคช</button>
  </div>
</div>
```

### 6. **Enhanced JavaScript Functions**
Replace your AI agent script section with this enhanced version:

**Find this section in your script:**
```javascript
// ===== AI Agent front-end =====
(function(){
```

**Replace with this enhanced version:**
```javascript
// ===== Enhanced AI Agent with Fixes =====
(function(){
  const $ = (sel)=>document.querySelector(sel);
  const msgs = $('#ai-messages');
  const panel = $('#ai-agent-panel');
  const btn = $('#ai-agent-button');
  const closeBtn = $('#ai-close');
  const minimizeBtn = $('#ai-minimize');
  let isMinimized = false;
  let aiProcessingTimeout = null;

  // Update AI Status
  function updateAIStatus(message, type = 'active') {
    const indicator = document.getElementById('ai-status-indicator');
    const statusText = document.getElementById('ai-status-text');

    if (message) {
      indicator.textContent = `AI: ${message}`;
      indicator.className = `ai-status-indicator ${type}`;
      indicator.classList.add('active');
    }

    if (statusText && message) {
      statusText.textContent = message;
    }

    // Auto-hide status after 3 seconds
    if (type !== 'error') {
      setTimeout(() => {
        indicator.classList.remove('active');
      }, 3000);
    }
  }

  // AI Functions
  function resetAI(){
    if (window.AIOverlayFix) {
      window.AIOverlayFix.resetAIChat();
      updateAIStatus('รีเซ็ตแล้ว', 'success');
    } else {
      alert('AI Overlay Fix not loaded. Please refresh the page.');
    }
  }

  function forceCloseAI(){
    const panel = document.getElementById('ai-agent-panel');
    panel.classList.add('hide');
    if (window.aiOverlayFix) {
      window.aiOverlayFix.forceCloseChat();
    }
    updateAIStatus('ปิดแล้ว', 'success');
  }

  function clearAICache() {
    if (window.AIOverlayFix) {
      window.AIOverlayFix.resetAIChat();
      updateAIStatus('ล้างแคชแล้ว', 'success');
    }
  }

  // Diagnostics
  function runDiagnostics() {
    const diagnosticsDiv = document.getElementById('ai-diagnostics');

    if (window.AIOverlayFix) {
      const diagnostics = window.AIOverlayFix.getDiagnostics();
      diagnosticsDiv.innerHTML = `
        <strong>AI System Status:</strong><br>
        Chat UI: ${diagnostics.aiChatUI ? '✅ OK' : '❌ Error'}<br>
        AI Agent: ${diagnostics.aiAgent ? '✅ OK' : '❌ Error'}<br>
        Chat Window: ${diagnostics.chatWindow ? '✅ OK' : '❌ Error'}<br>
        Close Button: ${diagnostics.closeButton ? '✅ OK' : '❌ Error'}<br>
        Minimize Button: ${diagnostics.minimizeButton ? '✅ OK' : '❌ Error'}<br>
        Processing: ${diagnostics.isProcessing ? '⚠️ Stuck' : '✅ OK'}<br>
        Open: ${diagnostics.isOpen ? '✅ Open' : '❌ Closed'}<br>
        LocalStorage: ${diagnostics.localStorage ? '✅ OK' : '❌ Empty'}<br>
        <br><small>Last checked: ${new Date().toLocaleString('th-TH')}</small>
      `;
    } else {
      diagnosticsDiv.innerHTML = '❌ AI Overlay Fix not loaded';
    }
  }

  // Keep all your existing functions (pushMsg, onConfirmResult, onError, etc.)
  function pushMsg(who, html){
    const wrap = document.createElement('div');
    wrap.className = 'ai-msg';
    wrap.innerHTML = `<div class="who">${who}</div><div class="ai-bubble ${who === 'คุณ' ? 'me':''}">${html}</div>`;
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function onConfirmResult(res){
    if (res && res.status === 'applied') {
      if (res.result && res.result.type === 'html') pushMsg('ผู้ช่วยร้าน', res.result.html);
      else pushMsg('ผู้ช่วยร้าน', 'เสร็จแล้ว ✅');
      if (typeof refreshLowStock === 'function') refreshLowStock();
    } else if (res && res.status === 'noop') {
      pushMsg('ผู้ช่วยร้าน', res.message || 'ไม่มีการเปลี่ยนแปลง');
    } else {
      pushMsg('ผู้ช่วยร้าน', 'เกิดข้อผิดพลาด: ' + (res && res.error ? res.error : 'ไม่ทราบสาเหตุ'));
    }
    updateAIStatus('พร้อมช่วยเหลือ', 'success');
  }

  function onError(err){ 
    pushMsg('ผู้ช่วยร้าน','เกิดข้อผิดพลาด: ' + (err ? err.message || String(err) : 'unknown')); 
    updateAIStatus('เกิดข้อผิดพลาด', 'error');
  }

  function getUserKey(){ 
    try { 
      return localStorage.getItem('userKey') || 'guest'; 
    } catch(e) { 
      return 'guest'; 
    } 
  }

  function pushPlan(summary, token, autoApply){
    const wrap = document.createElement('div');
    wrap.className = 'ai-msg';
    wrap.innerHTML = `
      <div class="who">ผู้ช่วยร้าน</div>
      <div class="ai-bubble">
        <div style="margin-bottom:8px">${summary}</div>
        <div class="ai-actions" style="display:flex; gap:8px;">
          <button class="btn brand" data-token="${token}" id="ai-confirm">ยืนยัน</button>
          <button class="btn" id="ai-cancel">ยกเลิก</button>
        </div>
      </div>`;
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;

    const doConfirm = () => {
      wrap.querySelector('#ai-confirm').disabled = true;
      wrap.querySelector('#ai-cancel').disabled = true;
      updateAIStatus('กำลังประมวลผล...', 'active');
      
      google.script.run.withSuccessHandler(onConfirmResult).withFailureHandler(onError)
        .agentConfirm({ userKey: getUserKey(), token });
    };
    
    wrap.querySelector('#ai-confirm').onclick = doConfirm;
    wrap.querySelector('#ai-cancel').onclick = () => {
      pushMsg('ผู้ช่วยร้าน','ยกเลิกแล้ว ✅');
      updateAIStatus('พร้อมช่วยเหลือ', 'success');
    };
    
    if (autoApply === true) doConfirm(); 
  }

  function sendText(raw){
    const t = (raw != null ? raw : $('#ai-input').value).trim();
    if (!t) return;
    
    pushMsg('คุณ', t);
    $('#ai-input').value = '';
    updateAIStatus('กำลังประมวลผล...', 'active');

    // Set processing timeout
    aiProcessingTimeout = setTimeout(() => {
      pushMsg('ผู้ช่วยร้าน', '⏰ การประมวลผลนานเกินไป กรุณาลองใหม่');
      updateAIStatus('หมดเวลา', 'error');
    }, 25000); // 25 second timeout

    google.script.run.withSuccessHandler(function(res){
      clearTimeout(aiProcessingTimeout);
      
      if (!res || res.status !== 'ok') { 
        pushMsg('ผู้ช่วยร้าน','ไม่สามารถวางแผนได้: ' + (res && res.error ? res.error : 'unknown')); 
        updateAIStatus('เกิดข้อผิดพลาด', 'error');
        return; 
      }
      
      const { plan, parsed, token } = res;
      if (!plan) { 
        pushMsg('ผู้ช่วยร้าน','ไม่เข้าใจคำสั่ง ลองพิมพ์ใหม่ หรือพิมพ์ "ช่วยอะไรได้บ้าง"'); 
        updateAIStatus('ไม่เข้าใจคำสั่ง', 'error');
        return; 
      }
      
      const hint = parsed && parsed.intent ? `<div class="muted" style="font-size: var(--fs-xs)">intent: ${parsed.intent}</div>` : '';
      pushMsg('ผู้ช่วยร้าน', `🔎 <b>สรุป</b>: ${plan.summary}${hint}`);
      
      if (plan.applyFn && plan.applyFn !== 'none') {
        pushPlan(plan.summary, token, plan.autoApply === true);
      } else {
        updateAIStatus('พร้อมช่วยเหลือ', 'success');
      }
    }).withFailureHandler(function(error){
      clearTimeout(aiProcessingTimeout);
      onError(error);
    }).agentPlan({ userKey: getUserKey(), text: t });
  }
  
  window.sendText = sendText;

  // Enhanced UI handlers with fixes
  btn.onclick = ()=> { 
    panel.classList.toggle('hide'); 
    if (!panel.classList.contains('hide')) {
      $('#ai-input').focus();
      updateAIStatus('เปิดแล้ว', 'success');
    }
  };
  
  closeBtn.onclick = ()=> { 
    panel.classList.add('hide');
    if (window.aiOverlayFix) {
      window.aiOverlayFix.forceCloseChat();
    }
    updateAIStatus('ปิดแล้ว', 'success');
  };

  minimizeBtn.onclick = ()=> {
    isMinimized = !isMinimized;
    if (isMinimized) {
      panel.style.height = '60px';
      msgs.style.display = 'none';
      $('#ai-quick').style.display = 'none';
      panel.querySelector('input').parentElement.style.display = 'none';
      minimizeBtn.textContent = '□';
      updateAIStatus('ย่อแล้ว', 'success');
    } else {
      panel.style.height = '';
      msgs.style.display = '';
      $('#ai-quick').style.display = '';
      panel.querySelector('input').parentElement.style.display = '';
      minimizeBtn.textContent = '−';
      updateAIStatus('ขยายแล้ว', 'success');
    }
  };
  
  $('#ai-send').onclick = ()=> sendText();
  $('#ai-input').addEventListener('keydown', (e)=>{ 
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  });

  // Quick replies
  document.querySelectorAll('#ai-quick .btn').forEach(b=> 
    b.addEventListener('click', ()=> sendText(b.getAttribute('data-txt')))
  );

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.classList.contains('hide')) {
      closeBtn.click();
    }
  });

  // Double-click outside to close
  document.addEventListener('dblclick', (e) => {
    if (!panel.contains(e.target) && !btn.contains(e.target) && !panel.classList.contains('hide')) {
      closeBtn.click();
    }
  });

  // Enhanced greeting
  setTimeout(()=>{ 
    pushMsg('ผู้ช่วยร้าน','🤖 **สวัสดีค่ะ! ผู้ช่วย AI พร้อมช่วยเหลือแล้ว (Fixed Version)**<br><br>**ฉันสามารถช่วยคุณ:**<br>📦 บันทึกการซื้อวัตถุดิบ<br>💰 บันทึกค่าใช้จ่าย<br>🍲 คำนวณต้นทุนเมนู<br>📊 ตรวจสอบสต๊อก<br><br>**ตัวอย่างคำสั่ง:**<br>- ซื้อ พริก 2 กิโล 100 บาท<br>- ค่าจ้างพนักงาน 500 บาท<br>- ช่วยคำนวนต้นทุนเมนูกุ้งแช่น้ำปลา<br>- สต๊อกพริกเหลือเท่าไหร่<br><br>**ปุ่มพิเศษ:**<br>- ESC: ปิดหน้าต่าง<br>- ดับเบิลคลิกนอกหน้าต่าง: ปิด<br>- ปุ่มย่อ: ย่อ/ขยายหน้าต่าง'); 
    updateAIStatus('พร้อมช่วยเหลือ', 'success');
  }, 300);
  
  refreshLowStock();
  
  // Run initial diagnostics
  setTimeout(() => {
    runDiagnostics();
  }, 1000);
})();
```

## 🚀 Integration Complete!

After making these changes to your existing `Index.html`:

1. **Save the file**
2. **Load it in your browser**
3. **Test the AI overlay:**
   - ✅ Close button should work
   - ✅ Minimize button should work  
   - ✅ ESC key closes overlay
   - ✅ Double-click outside closes overlay
   - ✅ AI functions should work properly
   - ✅ Diagnostics panel shows system status

## 🛠️ Troubleshooting

If issues occur:
1. Check browser console (F12) for errors
2. Click "ตรวจสอบ" (Diagnostics) to see system status
3. Click "รีเซ็ต AI" to reset everything
4. Click "ล้างแคช" to clear cached data

The integration adds all the fixes while keeping your original UI and functionality intact!