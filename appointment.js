"use strict";

// =============================================================================
// APPOINTMENT FORM & TELEMETRY SYSTEM
// =============================================================================

var DV_FORM_API_URL = "https://script.google.com/macros/s/AKfycbxj70EImKcnMRkAR0hrFxTOD79IIaGqy2UpNbggYlWnMUcPa7BLMetsBE64aGPkdk0UrA/exec";

// 1. Generate or retrieve persistent Device ID
function dvGetDeviceId() {
  var did = localStorage.getItem("dv_device_id");
  if (!did) {
    did = "dev_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem("dv_device_id", did);
  }
  return did;
}

// 2. Inject the edge-to-edge modal into the DOM

function dvInjectAppointmentModal() {
  var modalHtml = `
    <style>
      :root {
        --dv-bg: #f3f4f6;
        --dv-bg-elevated: #ffffff;
        --dv-text: #111827;
        --dv-text-secondary: #4b5563;
        --dv-border: #d1d5db;
        --dv-accent: #1877F2;
        --dv-safe-top: 0px;
      }
      .dv-appt-modal { position: fixed; inset: 0; background: var(--dv-bg); z-index: 200; display: flex; flex-direction: column; width: 100dvw; height: 100dvh; }
      .dv-appt-header { padding: calc(10px + var(--dv-safe-top)) 16px 10px; background: var(--dv-accent); color: #fff; display: flex; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); flex-shrink: 0; }
      .dv-appt-title { flex: 1; font-weight: 700; font-size: 1.15rem; text-align: center; }
      .dv-appt-body { flex: 1; overflow-y: auto; padding: 24px; background: var(--dv-bg-elevated); border-left: 4px solid #FFD700; display: flex; flex-direction: column; position: relative; }
      .dv-appt-form { display: flex; flex-direction: column; gap: 16px; background: var(--dv-bg); padding: 20px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      .dv-appt-label { font-size: 0.85rem; font-weight: 700; color: var(--dv-text-secondary); margin-bottom: 6px; display: block; }
      .dv-appt-input, .dv-appt-select, .dv-appt-textarea { width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--dv-border); background: var(--dv-bg-elevated); color: var(--dv-text); font-size: 1rem; font-family: inherit; }
      .dv-appt-textarea { resize: vertical; min-height: 120px; }
      .dv-char-count { font-size: 0.75rem; color: var(--dv-text-secondary); text-align: right; margin-top: 4px; }
      .dv-appt-btn { width: 100%; min-height: 52px; border: none; border-radius: 26px; background: #FFD700; color: #DC2626; font-size: 1.05rem; font-weight: 800; cursor: pointer; margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4); }
      .dv-appt-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      
      /* Spinner and Inbox Overlay */
      .dv-appt-overlay { position: absolute; inset: 0; background: var(--dv-bg); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; z-index: 201; }
      .dv-appt-spinner { width: 40px; height: 40px; border: 4px solid rgba(24,119,242,0.2); border-top-color: var(--dv-accent); border-radius: 50%; animation: dv-spin 0.8s linear infinite; }
      
      .dv-inbox-btn { background: #1877F2; color: #fff; padding: 14px 28px; border-radius: 30px; border: none; font-size: 1.1rem; font-weight: 800; display: flex; align-items: center; gap: 10px; box-shadow: 0 0 0 0 rgba(24,119,242,0.7); animation: dv-pulse 2s infinite; cursor: pointer; }
      @keyframes dv-pulse { 0% { box-shadow: 0 0 0 0 rgba(24,119,242,0.7); } 70% { box-shadow: 0 0 0 15px rgba(24,119,242,0); } 100% { box-shadow: 0 0 0 0 rgba(24,119,242,0); } }
      
      .dv-reply-card { background: var(--dv-bg-elevated); padding: 24px; border-radius: 16px; border-left: 4px solid var(--dv-accent); box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; text-align: left; margin-top: 20px; font-size: 1rem; line-height: 1.6; white-space: pre-wrap; color: var(--dv-text); border-top: 1px solid var(--dv-border); border-right: 1px solid var(--dv-border); border-bottom: 1px solid var(--dv-border); }
    </style>
    
    <div id="dvApptModal" class="dv-appt-modal dv-hidden">
      <div class="dv-appt-header">
        <button id="dvBtnCloseAppt" type="button" class="dv-header-btn" style="color:#fff;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        <div class="dv-appt-title">Request Appointment</div>
        <div style="width:44px;"></div> <!-- Spacer -->
      </div>
      <div class="dv-appt-body">
        
        <!-- The Form -->
        <div id="dvApptFormWrapper" class="dv-appt-form">
          <div><label class="dv-appt-label">Full Name</label><input id="dvApptName" class="dv-appt-input" type="text" placeholder="Enter your name" /></div>
          <div><label class="dv-appt-label">Gender</label><select id="dvApptGender" class="dv-appt-select"><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
          <div><label class="dv-appt-label">Appointment Purpose</label>
            <select id="dvApptPurpose" class="dv-appt-select">
              <option value="">Select Purpose</option>
              <option value="Special Prayer">Special Prayer</option>
              <option value="One on One Counseling">One on One Counseling</option>
              <option value="Invitation to Lecture">Invitation to Lecture</option>
              <option value="Invitation to preach in your church">Invitation to preach in your church</option>
              <option value="Personal Mentorship">Personal Mentorship</option>
              <option value="To support the ministry">To support the ministry</option>
              <option value="To Join online community">To Join online community</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label class="dv-appt-label">Message</label>
            <textarea id="dvApptMessage" class="dv-appt-textarea" placeholder="Briefly describe your request..." maxlength="600"></textarea>
            <div id="dvApptCharCount" class="dv-char-count">0 / 600</div>
          </div>
          <button id="dvBtnSubmitAppt" class="dv-appt-btn">Submit Request</button>
        </div>
        
        <!-- Status Overlay (24hr Lockout / Spinner / Inbox) -->
        <div id="dvApptStatusOverlay" class="dv-appt-overlay dv-hidden">
          <div id="dvApptSpinner" class="dv-appt-spinner dv-hidden"></div>
          <div id="dvApptMessageText" style="font-weight: 600; margin-bottom: 24px; line-height: 1.5; color: var(--dv-text);"></div>
          
          <button id="dvBtnCheckInbox" class="dv-inbox-btn dv-hidden">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="24" height="24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            Read Reply
          </button>
          <div id="dvReplyContent" class="dv-reply-card dv-hidden"></div>
        </div>

      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 3. Check 24-hour lock and update UI state
function dvCheckApptLock() {
  var lastSubmit = parseInt(localStorage.getItem("dv_appt_last_submit") || "0", 10);
  var now = Date.now();
  var oneDayMs = 24 * 60 * 60 * 1000;
  
  var overlay = document.getElementById("dvApptStatusOverlay");
  var formWrap = document.getElementById("dvApptFormWrapper");
  var msgText = document.getElementById("dvApptMessageText");
  var inboxBtn = document.getElementById("dvBtnCheckInbox");
  var replyCard = document.getElementById("dvReplyContent");
  var spinner = document.getElementById("dvApptSpinner");

  spinner.classList.add("dv-hidden");
  replyCard.classList.add("dv-hidden");

  if (now - lastSubmit < oneDayMs) {
    // Locked: Show overlay with Inbox button
    formWrap.classList.add("dv-hidden");
    overlay.classList.remove("dv-hidden");
    inboxBtn.classList.remove("dv-hidden");
    
    var hoursLeft = Math.ceil((oneDayMs - (now - lastSubmit)) / (1000 * 60 * 60));
    msgText.textContent = "Your request is processing. The form will unlock in " + hoursLeft + " hour(s). Check your inbox below for replies.";
  } else {
    // Unlocked: Show form
    formWrap.classList.remove("dv-hidden");
    overlay.classList.add("dv-hidden");
    inboxBtn.classList.add("dv-hidden");
  }
}

// 4. Submit Appointment with Telemetry
function dvHandleApptSubmit() {
  var name = document.getElementById("dvApptName").value.trim();
  var message = document.getElementById("dvApptMessage").value.trim();
  
  if (!name || !message) {
    alert("Please provide your name and a brief message.");
    return;
  }
  
  var btn = document.getElementById("dvBtnSubmitAppt");
  var spinner = document.getElementById("dvApptSpinner");
  var overlay = document.getElementById("dvApptStatusOverlay");
  var formWrap = document.getElementById("dvApptFormWrapper");
  var msgText = document.getElementById("dvApptMessageText");
  
  btn.disabled = true;
  formWrap.classList.add("dv-hidden");
  overlay.classList.remove("dv-hidden");
  spinner.classList.remove("dv-hidden");
  msgText.textContent = "Connecting to secure server...";
  
  // Silently fetch IP telemetry
  fetch("https://ipapi.co/json/")
    .then(function(res) { return res.json(); })
    .catch(function() { return {}; }) // Fail gracefully if adblocker blocks it
    .then(function(ipData) {
      var payload = {
        Name: name,
        Gender: document.getElementById("dvApptGender").value,
        Purpose: document.getElementById("dvApptPurpose").value,
        Message: message,
        DeviceID: dvGetDeviceId(),
        UserID: dvGetDeviceId(), // Unauthenticated public form uses DeviceID as UserID
        Country: ipData.country_name || "",
        City: ipData.city || "",
        ISP: ipData.org || "",
        MobileNetwork: ipData.network || "",
        Timezone: ipData.timezone || "",
        UserAgent: navigator.userAgent,
        ScreenSize: window.innerWidth + "x" + window.innerHeight
      };
      
      return fetch(DV_FORM_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
    })
    .then(function(res) { return res.json(); })
    .catch(function() { return { status: "error", message: "Network error. Please check your connection." }; })
    .then(function(result) {
      spinner.classList.add("dv-hidden");
      if (result.status === "success") {
        localStorage.setItem("dv_appt_last_submit", Date.now().toString());
        msgText.textContent = result.message;
        document.getElementById("dvBtnCheckInbox").classList.remove("dv-hidden");
      } else {
        msgText.textContent = result.message || "Something went wrong.";
        setTimeout(function() { dvCheckApptLock(); btn.disabled = false; }, 4000);
      }
    });
}

// 5. Check Inbox (Fetch MOG Reply)
function dvHandleCheckInbox() {
  var btn = document.getElementById("dvBtnCheckInbox");
  var spinner = document.getElementById("dvApptSpinner");
  var replyCard = document.getElementById("dvReplyContent");
  var msgText = document.getElementById("dvApptMessageText");
  
  btn.classList.add("dv-hidden");
  spinner.classList.remove("dv-hidden");
  msgText.textContent = "Checking inbox...";
  replyCard.classList.add("dv-hidden");
  
  fetch(DV_FORM_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "checkInbox", DeviceID: dvGetDeviceId() })
  })
  .then(function(res) { return res.json(); })
  .catch(function() { return { status: "error", message: "Network error." }; })
  .then(function(result) {
    spinner.classList.add("dv-hidden");
    btn.classList.remove("dv-hidden");
    
    if (result.status === "success" && result.data && result.data.reply) {
      msgText.textContent = "You have a new reply:";
      replyCard.textContent = result.data.reply;
      replyCard.classList.remove("dv-hidden");
    } else {
      msgText.textContent = "No reply yet. The man of God will get back to you shortly.";
    }
  });
}

// 6. Bind UI Events
function dvBindApptEvents() {
  var openBtn = document.getElementById("dvBtnOpenAppointment");
  var closeBtn = document.getElementById("dvBtnCloseAppt");
  var modal = document.getElementById("dvApptModal");
  var textarea = document.getElementById("dvApptMessage");
  var charCount = document.getElementById("dvApptCharCount");
  var submitBtn = document.getElementById("dvBtnSubmitAppt");
  var inboxBtn = document.getElementById("dvBtnCheckInbox");

  if (openBtn) openBtn.addEventListener("click", function() { dvCheckApptLock(); modal.classList.remove("dv-hidden"); });
  if (closeBtn) closeBtn.addEventListener("click", function() { modal.classList.add("dv-hidden"); });
  if (textarea) textarea.addEventListener("input", function() { charCount.textContent = this.value.length + " / 600"; });
  
  if (submitBtn) submitBtn.addEventListener("click", dvHandleApptSubmit);
  if (inboxBtn) inboxBtn.addEventListener("click", dvHandleCheckInbox);
}

// 7. Fetch and Render Dynamic Slideshow Ticker
function dvFetchTicker() {
  if (!DV_FORM_API_URL || DV_FORM_API_URL.indexOf("PASTE_YOUR") !== -1) return;

  fetch(DV_FORM_API_URL + "?action=ticker")
    .then(function(res) { return res.json(); })
    .catch(function() { return { status: "error" }; })
    .then(function(result) {
      if (result.status === "success" && result.data && result.data.length > 0) {
        var tickers = result.data;
        var currentIndex = 0;
        
        var tickerWrap = document.createElement("div");
        tickerWrap.style.cssText = "position: fixed; bottom: 0; left: 0; width: 100%; z-index: 9999; overflow: hidden; box-shadow: 0 -2px 10px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; min-height: 50px;";
        
        // Inject Pure Slide Animations (No fades, proper word wrapping)
        if (!document.getElementById("dv-slideshow-style")) {
          var style = document.createElement("style");
          style.id = "dv-slideshow-style";
          style.innerHTML = `
            .dv-slide-content { width: 100%; padding: 16px; text-align: center; white-space: normal; word-wrap: break-word; line-height: 1.5; font-weight: 700; font-size: 1.05rem; box-sizing: border-box; }
            .dv-slide-in { animation: dvSlideIn 0.6s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; }
            .dv-slide-out { animation: dvSlideOut 0.6s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; }
            @keyframes dvSlideIn { 0% { transform: translateX(100%); } 100% { transform: translateX(0); } }
            @keyframes dvSlideOut { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
          `;
          document.head.appendChild(style);
        }
        
        var slideEl = document.createElement("div");
        slideEl.className = "dv-slide-content";
        tickerWrap.appendChild(slideEl);
        document.body.appendChild(tickerWrap);

        function showNextSlide() {
          var ticker = tickers[currentIndex];
          
          // Apply database styles
          tickerWrap.style.backgroundColor = ticker.bgColor || "#1877F2";
          slideEl.style.color = ticker.textColor || "#FFFFFF";
          slideEl.style.cursor = ticker.url ? "pointer" : "default";
          
          // Apply text
          slideEl.textContent = ticker.message;
          
          // Clickable link if provided
          slideEl.onclick = function() {
            if (ticker.url) window.open(ticker.url, "_blank");
          };
          
          // Calculate reading hold time
          var holdTime = 8000; // default 8 seconds
          if (ticker.speed && ticker.speed.toLowerCase() === "fast") holdTime = 4000;
          if (ticker.speed && ticker.speed.toLowerCase() === "slow") holdTime = 12000;

          // Physically slide in from the right
          slideEl.classList.remove("dv-slide-out");
          slideEl.classList.add("dv-slide-in");

          // Hold it so humans can read, then slide out to the left
          setTimeout(function() {
            slideEl.classList.remove("dv-slide-in");
            slideEl.classList.add("dv-slide-out");
            
            // Wait for exit animation, then queue the next slide
            setTimeout(function() {
              currentIndex = (currentIndex + 1) % tickers.length;
              showNextSlide();
            }, 600); // 600ms matches the CSS animation duration
          }, holdTime);
        }

        // Ignite the slideshow
        showNextSlide();
      }
    });
}

// 8. Login Telemetry Hook (Traffic Referrer)
window.dvLogTrafficReferrer = function() {
  // Prevent duplicate logging in the same session
  if (sessionStorage.getItem("dv_traffic_logged")) return;
  
  var ua = navigator.userAgent || "";
  var ref = document.referrer || "";
  
  var payload = {
    action: "logTraffic",
    DeviceID: dvGetDeviceId(),
    UserAgent: ua,
    Facebook: (ua.indexOf("FBAN") > -1 || ua.indexOf("FBAV") > -1 || ref.indexOf("facebook.com") > -1) ? "TRUE" : "FALSE",
    WhatsApp: (ua.indexOf("WhatsApp") > -1) ? "TRUE" : "FALSE",
    Twitter: (ua.indexOf("Twitter") > -1 || ref.indexOf("t.co") > -1) ? "TRUE" : "FALSE",
    LinkedIn: (ua.indexOf("LinkedIn") > -1 || ref.indexOf("linkedin.com") > -1) ? "TRUE" : "FALSE",
    Google: (ref.indexOf("google.com") > -1) ? "TRUE" : "FALSE",
    Brave: (navigator.brave) ? "TRUE" : "FALSE",
    Safari: (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") === -1) ? "TRUE" : "FALSE",
    Chrome: (ua.indexOf("Chrome") > -1 && ua.indexOf("Edg") === -1) ? "TRUE" : "FALSE",
    Country: "", City: "", ISP: "", MobileNetwork: "", Timezone: ""
  };

  if (DV_FORM_API_URL && DV_FORM_API_URL.indexOf("PASTE_YOUR") === -1) {
    // Silently fetch IP telemetry
    fetch("https://ipapi.co/json/")
      .then(function(res) { return res.json(); })
      .catch(function() { return {}; }) // Fail gracefully
      .then(function(ipData) {
        payload.Country = ipData.country_name || "";
        payload.City = ipData.city || "";
        payload.ISP = ipData.org || "";
        payload.MobileNetwork = ipData.network || "";
        payload.Timezone = ipData.timezone || "";
        
        return fetch(DV_FORM_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        });
      })
      .then(function() {
        sessionStorage.setItem("dv_traffic_logged", "true");
      })
      .catch(function(){}); // Fail silently so it never interrupts UX
  }
};

// 9. Initialize on load
document.addEventListener("DOMContentLoaded", function() {
  dvGetDeviceId();
  dvInjectAppointmentModal();
  dvBindApptEvents();
  dvFetchTicker();
});
