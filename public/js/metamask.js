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
      const txt = await res.text();
      console.error('Auth failed', res.status, txt);
      alert('MetaMask authentication failed');
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
});
