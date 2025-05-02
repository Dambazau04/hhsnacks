// Credentials & Data
const CREDENTIALS = { user: 'H&H2025', pass: 'h&h@12345', cashierName: 'Aliyu Bashir Lawan' };
const menus = [ { name: 'Burger', price: 1500 }, { name: 'Fries', price: 800 }, { name: 'Soda', price: 300 } ];

// LOGIN
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', e => {
    const u = e.target.username.value;
    const p = e.target.password.value;
    if (u !== CREDENTIALS.user || p !== CREDENTIALS.pass) {
      e.preventDefault(); alert('Invalid credentials');
    }
  });
}

// MENU & INVOICE & HISTORY
if (document.getElementById('menuList')) {
  let orderCount = Number(localStorage.getItem('orderCount') || '0');
  let historyArr = JSON.parse(localStorage.getItem('salesHistory') || '[]');
  const menuList = document.getElementById('menuList');
  const calcBtn = document.getElementById('calculateBtn');
  const printBtn = document.getElementById('printInvoice');
  const totalDisp = document.getElementById('totalDisplay');
  const invDiv = document.getElementById('invoice');
  const histBody = document.getElementById('historyBody');
  const monthFilter = document.getElementById('monthFilter');
  const downloadBtn = document.getElementById('downloadHistory');
  const clearBtn = document.getElementById('clearHistory');

  // Render menu with editable amount
  menus.forEach((item,i) => {
    const d = document.createElement('div'); d.className='menu-item';
    d.innerHTML = `<strong>${item.name}</strong>` +
      `<p>Amount: ₦<input type="number" id="price${i}" value="${item.price}" min="0"></p>` +
      `<label>Qty:<input type="number" id=qty${i} value="0" min="0"></label>`;
    menuList.appendChild(d);
  });

  // Render history table
  function renderHistory(filterMonth) {
    histBody.innerHTML = '';
    historyArr.filter(h => !filterMonth || h.date.startsWith(filterMonth))
      .forEach(h => h.items.forEach(it => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${h.orderNo}</td><td>${it.name}</td><td>${it.qty}</td><td>${h.date}</td><td>${h.time}</td><td>${h.cashier}</td>`;
        histBody.appendChild(tr);
      }));
  }

  renderHistory();

  // Calculate & show invoice
  calcBtn.addEventListener('click', () => {
    let total = 0, details = [];
    menus.forEach((it,i) => {
      const price = Number(document.getElementById(`price${i}`).value);
      const qty = Number(document.getElementById(`qty${i}`).value);
      if (qty > 0) { total += price * qty; details.push({name: it.name, qty, price}); }
    });
    totalDisp.textContent = `Total: ₦${total}`;
    if (total > 0) printBtn.classList.remove('hidden');

    // Build invoice
    orderCount++;
    localStorage.setItem('orderCount', orderCount);
    const now = new Date();
    const date = now.toLocaleDateString('en-CA');
    const time = now.toLocaleTimeString();
    const orderNo = `H&H/2025/${String(orderCount).padStart(4,'0')}`;

    let html = `<div class='watermark'>H&H Snacks and More</div>`;
    html += `<header><img src='images/logo.jpg' alt='Logo'><h2>H&H Snacks and More</h2></header>`;
    html += `<p><strong>Order#:</strong> ${orderNo}</p><p><strong>Date:</strong> ${date}</p><p><strong>Time:</strong> ${time}</p><p><strong>Cashier:</strong> ${CREDENTIALS.cashierName}</p>`;
    html += `<table class='invoice-items'><thead><tr><th>Item</th><th>Qty</th><th>Amt</th></tr></thead><tbody>`;
    details.forEach(d=> html+=`<tr><td>${d.name}</td><td>${d.qty}</td><td>₦${d.price*d.qty}</td></tr>`);
    html += `</tbody></table><p class='invoice-total'><strong>Total:</strong> ₦${total}</p><div id='qrcode'></div><p class='thankyou'>Thank you for your order! <strong>Contact:</strong>+234 810 790 </p>`;
    invDiv.innerHTML = html;
    invDiv.style.display = 'block';

    new QRCode(document.getElementById('qrcode'), { text:`${orderNo}|H&H Snacks and More|${date}`, width:64, height:64 });
    printBtn.onclick = () => window.print();

    historyArr.push({orderNo,date,time,cashier:CREDENTIALS.cashierName,items:details});
    localStorage.setItem('salesHistory', JSON.stringify(historyArr));
    renderHistory(monthFilter.value);
  });

  // Filter history by month
  monthFilter.addEventListener('change', () => renderHistory(monthFilter.value));

  // Require re-login for download/clear
  function requireLogin(callback) {
    const user = prompt('Username:');
    const pass = prompt('Password:');
    if (user===CREDENTIALS.user && pass===CREDENTIALS.pass) callback(); else alert('Invalid credentials.');
  }

  // Download history as CSV
  downloadBtn.addEventListener('click', () => {
    requireLogin(() => {
      const filtered = historyArr.filter(h => !monthFilter.value || h.date.startsWith(monthFilter.value));
      let csv = 'Order#,Item,Qty,Date,Time,Cashier\n';
      filtered.forEach(h=> h.items.forEach(i=> csv+=`${h.orderNo},${i.name},${i.qty},${h.date},${h.time},${h.cashier}\n`));
      const blob = new Blob([csv], { type:'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'sales_history.csv'; a.click();
      URL.revokeObjectURL(url);
    });
  });

  // Clear history
  clearBtn.addEventListener('click', () => {
    requireLogin(() => {
      if (confirm('Clear all history?')) { historyArr = []; localStorage.removeItem('salesHistory'); renderHistory(); }
    });
  });
}
