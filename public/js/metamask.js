// Minimal MetaMask integration placeholder
// Connects to MetaMask, gets the first account, and POSTs to the server to authenticate.

async function connectMetaMask() {
  if (typeof window.ethereum === 'undefined') {
    alert('MetaMask is not installed');
    return;
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts && accounts[0];
    if (!account) {
      alert('No account found');
      return;
    }

    // NOTE: For production, implement a signed nonce flow to verify ownership.
    // This placeholder simply sends the wallet address to the server, which is
    // insecure if used alone (could be spoofed). Server may accept or require
    // a signature depending on configuration.

    const res = await fetch('/auth/metamask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ address: account })
    });

    if (!res.ok) {
      // Try to parse JSON error body, otherwise fall back to text
      let bodyText = '';
      try {
        const json = await res.json();
        bodyText = json && json.error ? json.error : JSON.stringify(json);
      } catch (e) {
        bodyText = await res.text();
      }
      console.error('Auth failed', res.status, bodyText);
      // If server says wallet not linked, offer to create new account and link wallet
      if (res.status === 404 && bodyText && bodyText.toLowerCase().includes('no account linked')) {
        if (confirm('No account linked to this wallet. Would you like to create a new account using this wallet?')) {
          // Redirect to register with wallet query param
          window.location.href = '/register?wallet=' + encodeURIComponent(account);
          return;
        }
      }

      alert('MetaMask authentication failed: ' + (bodyText || res.statusText));
      return;
    }

    // Successful login — redirect to dashboard
    window.location.href = '/dashboard';
  } catch (err) {
    console.error('MetaMask connect error', err);
    alert('MetaMask connection failed');
  }
}

// Bind connect function to any button with id "connectMetaMaskBtn"
document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('metamask-login-btn');
  if (el) el.addEventListener('click', connectMetaMask);
  const unlinkBtn = document.getElementById('unlink-wallet-btn');
  if (unlinkBtn) unlinkBtn.addEventListener('click', unlinkWallet);
});

async function unlinkWallet() {
  if (!confirm('Are you sure you want to unlink your wallet from this account?')) return;
  try {
    const res = await fetch('/auth/unlink-wallet', { method: 'POST', credentials: 'include' });
    const data = await res.json();
    if (res.ok && data.success) {
      alert('Wallet unlinked');
      location.reload();
    } else {
      alert('Failed to unlink wallet: ' + (data && data.error ? data.error : res.statusText));
    }
  } catch (err) {
    console.error('Unlink failed', err);
    alert('Unlink failed');
  }
}
