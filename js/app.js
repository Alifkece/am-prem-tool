(function() {
  "use strict";

  // DOM refs
  const requestForm = document.getElementById('requestForm');
  const verifyForm = document.getElementById('verifyForm');
  const emailReq = document.getElementById('emailReq');
  const emailVerify = document.getElementById('emailVerify');
  const linkVerify = document.getElementById('linkVerify');
  const sendBtn = document.getElementById('sendBtn');
  const verifyBtn = document.getElementById('verifyBtn');
  const requestStatus = document.getElementById('requestStatus');
  const verifyStatus = document.getElementById('verifyStatus');
  const statusCard = document.getElementById('statusCard');
  const statusContent = document.getElementById('statusContent');

  // helpers
  function setLoading(btn, loading) {
    if (loading) {
      btn.disabled = true;
      btn.innerHTML = `<span class="flex-center"><svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg> Processing...</span>`;
    } else {
      btn.disabled = false;
      if (btn === sendBtn) {
        btn.innerHTML = `<svg class="svg-icon" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> SEND MAGIC LINK`;
      } else {
        btn.innerHTML = `<svg class="svg-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> VERIFY ACCESS`;
      }
    }
  }

  function showStatus(container, type, title, message, email = '') {
    container.className = 'status-card visible ' + type;
    const icon = type === 'success' 
      ? `<svg viewBox="0 0 24 24" stroke="#00e676"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
      : `<svg viewBox="0 0 24 24" stroke="#ff5252"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    container.innerHTML = `
      <div class="status-flex">
        ${icon}
        <div class="status-message">
          <strong>${title}</strong>
          <div>${message}</div>
          ${email ? `<div class="sub">${email}</div>` : ''}
        </div>
      </div>
    `;
  }

  function clearStatus(container) {
    container.className = 'status-card';
    container.innerHTML = '';
  }

  function showPremiumStatus(data) {
    statusCard.style.display = 'block';
    const status = data.accountLinkStatus ? 'Active' : 'Pending';
    const expiry = data.expiryTimeMillis ? new Date(data.expiryTimeMillis).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'Not set';
    
    statusContent.innerHTML = `
      <div class="premium-status">
        <div class="status-label">Premium Status: ${status}</div>
        <div class="status-detail">Email: ${data.email || 'N/A'}</div>
        <div class="status-detail">Expiry: ${expiry}</div>
        <div class="status-detail">Auto Renew: ${data.autoRenewing ? 'Yes' : 'No'}</div>
        <div class="status-detail" style="margin-top:8px;color:#00e676;">${data.message || 'Premium activated successfully!'}</div>
      </div>
    `;
    statusCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ----- REQUEST (send) -----
  requestForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = emailReq.value.trim();
    if (!email || !email.includes('@') || !email.includes('.')) {
      showStatus(requestStatus, 'error', 'Invalid Email', 'Please enter a valid email address.');
      return;
    }
    clearStatus(requestStatus);
    setLoading(sendBtn, true);

    try {
      const resp = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Request failed');
      showStatus(requestStatus, 'success', 'Magic Link Sent!', data.message || 'Check your email for the verification link.', email);
      emailReq.value = '';
    } catch (err) {
      showStatus(requestStatus, 'error', 'Request Failed', err.message || 'Unable to send. Please try again later.');
    } finally {
      setLoading(sendBtn, false);
    }
  });

  // ----- VERIFY -----
  verifyForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = emailVerify.value.trim();
    const link = linkVerify.value.trim();
    if (!email || !email.includes('@') || !email.includes('.')) {
      showStatus(verifyStatus, 'error', 'Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!link || link.length < 10) {
      showStatus(verifyStatus, 'error', 'Invalid Link', 'Please paste the full verification link.');
      return;
    }
    clearStatus(verifyStatus);
    setLoading(verifyBtn, true);

    try {
      const resp = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, link })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Verification failed');
      
      showStatus(verifyStatus, 'success', 'Verification Successful', data.message || 'Access granted.', email);
      
      // Show premium status
      if (data.data) {
        showPremiumStatus({
          email: email,
          accountLinkStatus: data.accountLinkStatus,
          expiryTimeMillis: data.expiryTimeMillis,
          autoRenewing: data.autoRenewing,
          message: data.message
        });
      }
      
      linkVerify.value = '';
      emailVerify.value = '';
    } catch (err) {
      showStatus(verifyStatus, 'error', 'Verification Failed', err.message || 'Invalid or expired link.');
    } finally {
      setLoading(verifyBtn, false);
    }
  });

  // auto clear status on input change
  [emailReq, emailVerify, linkVerify].forEach(el => {
    el.addEventListener('input', function() {
      const container = this.closest('form').querySelector('.status-card');
      if (container) clearStatus(container);
    });
  });

})();
