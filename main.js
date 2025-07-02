let HSN = [];
let b2b = [];
let b1b = [];
let currentData = [];
let filteredData = [];
let currentPage = 1;

const headers = {
  HSN: ["Date","Billno","HSN","Description","qty","rate","Discount","tax","total","cgst","sgst","igst","Grand Total","Actions"],
  b2b: ["Date","GST","NAME","BILL NO","Supply","Total INVOICE VALUE","TAX AMOUNT","TAXRATE","sgst","cgst","Igst","TOTAL TAX","Grand Total","Actions"],
  b1b: ["Date","gstno","name","Bill.no","Supply","total invoice amount","tax exclude invoice total","sgst","cgst","igst","Grand Total","Actions"]
};

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const hsnRes = await fetch('HSN.json');
    HSN = await hsnRes.json();
    const b2bRes = await fetch('b2b.json');
    b2b = await b2bRes.json();
    const b1bRes = await fetch('b1b.json');
    b1b = await b1bRes.json();
    currentData = HSN.slice();
    filteredData = HSN.slice();
    renderTable();
  } catch(err) {
    alert('Error loading JSON files: ' + err);
  }
});

document.querySelectorAll('input[name="dataSet"]').forEach(r => {
  r.addEventListener('change', () => {
    if (r.value === 'HSN') {
      currentData = HSN.slice();
      filteredData = HSN.slice();
    } else if (r.value === 'b2b') {
      currentData = b2b.slice();
      filteredData = b2b.slice();
    } else if (r.value === 'b1b') {
      currentData = b1b.slice();
      filteredData = b1b.slice();
    }
    currentPage = 1;
    renderTable();
  });
});

function renderTable() {
  const type = document.querySelector('input[name="dataSet"]:checked').value;
  const head = document.querySelector('#dataTable thead');
  const body = document.querySelector('#dataTable tbody');
  const foot = document.querySelector('#dataTable tfoot');

  head.innerHTML = `<tr>${headers[type].map(h => `<th>${h}</th>`).join('')}</tr>`;
  body.innerHTML = '';

  const perPage = parseInt(document.getElementById('recordsPerPage').value) || currentData.length;

  const visibleData = currentData.filter(r => !r._deleted);
  const totalPages = Math.ceil(visibleData.length / perPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * perPage;
  const dataToShow = visibleData.slice(start, start + perPage);

  let sums = { total:0, cgst:0, sgst:0, igst:0, grand:0, invoice:0, taxAmount:0, totalTax:0 };

  dataToShow.forEach((row, i) => {
    let grandRow = 0;

    if (type === 'HSN') {
      const rowTotal = Number(row.total) || 0;
      const rowCgst = Number(row.cgst) || 0;
      const rowSgst = Number(row.sgst) || 0;
      const rowIgst = Number(row.igst) || 0;
      grandRow = rowTotal + rowCgst + rowSgst + rowIgst;
      sums.total += rowTotal; sums.cgst += rowCgst; sums.sgst += rowSgst; sums.igst += rowIgst; sums.grand += grandRow;
    } else if (type === 'b2b') {
      const invoice = Number(row["Total INVOICE VALUE"]) || 0;
      const rowCgst = Number(row.cgst) || 0;
      const rowSgst = Number(row.sgst) || 0;
      const rowIgst = Number(row.Igst) || 0;
      grandRow = invoice + rowCgst + rowSgst + rowIgst;
      sums.invoice += invoice; sums.cgst += rowCgst; sums.sgst += rowSgst; sums.igst += rowIgst; sums.taxAmount += Number(row["TAX AMOUNT"]) || 0; sums.totalTax += Number(row["TOTAL TAX"]) || 0; sums.grand += grandRow;
    } else if (type === 'b1b') {
      const base = Number(row["tax exclude invoice total"]) || 0;
      const rowCgst = Number(row.cgst) || 0;
      const rowSgst = Number(row.sgst) || 0;
      const rowIgst = Number(row.igst) || 0;
      grandRow = base + rowCgst + rowSgst + rowIgst;
      sums.total += base; sums.cgst += rowCgst; sums.sgst += rowSgst; sums.igst += rowIgst; sums.grand += grandRow;
    }

    let cells = headers[type].slice(0, -2).map(key => `<td>${row[key] ?? ''}</td>`).join('');
    let gTotalCell = `<td>${grandRow.toFixed(2)}</td>`;

    body.innerHTML += `<tr>${cells}${gTotalCell}<td>
      <span class="action-btn" onclick="editRow(${start + i})"><i class="fas fa-edit"></i></span>
      <span class="action-btn" onclick="deleteRow(${start + i})"><i class="fas fa-trash"></i></span>
      <span class="action-btn" onclick="printRow(${start + i})"><i class="fas fa-print"></i></span>
    </td></tr>`;
  });

  let footRow = '';
  if (type === 'HSN') {
    footRow = `<tr><td colspan="8" style="text-align:right;">TOTAL</td><td>${sums.total.toFixed(2)}</td><td>${sums.cgst.toFixed(2)}</td><td>${sums.sgst.toFixed(2)}</td><td>${sums.igst.toFixed(2)}</td><td>${sums.grand.toFixed(2)}</td><td></td></tr>`;
  } else if (type === 'b2b') {
    footRow = `<tr><td colspan="5">TOTAL</td><td>${sums.invoice.toFixed(2)}</td><td>${sums.taxAmount.toFixed(2)}</td><td></td><td>${sums.sgst.toFixed(2)}</td><td>${sums.cgst.toFixed(2)}</td><td>${sums.igst.toFixed(2)}</td><td>${sums.totalTax.toFixed(2)}</td><td>${sums.grand.toFixed(2)}</td><td></td></tr>`;
  } else if (type === 'b1b') {
    footRow = `<tr><td colspan="5">TOTAL</td><td></td><td>${sums.total.toFixed(2)}</td><td>${sums.sgst.toFixed(2)}</td><td>${sums.cgst.toFixed(2)}</td><td>${sums.igst.toFixed(2)}</td><td>${sums.grand.toFixed(2)}</td><td></td></tr>`;
  }
  foot.innerHTML = footRow;

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  let pagination = `<div class="pagination" style="margin-top:1rem;">`;
  if (currentPage > 1) pagination += `<button onclick="prevPage()">Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    pagination += `<button onclick="goToPage(${i})" ${i === currentPage ? 'style="background:red;color:white;"' : ''}>${i}</button>`;
  }
  if (currentPage < totalPages) pagination += `<button onclick="nextPage()">Next</button>`;
  pagination += `</div>`;
  document.querySelector('.card').querySelector('.pagination')?.remove();
  const div = document.createElement('div');
  div.className = 'pagination';
  div.innerHTML = pagination;
  document.querySelector('.card').appendChild(div);
}

function prevPage() { currentPage--; renderTable(); }
function nextPage() { currentPage++; renderTable(); }
function goToPage(p) { currentPage = p; renderTable(); }

function applyFilters() {
  const from = new Date(document.getElementById('fromDate').value || '2000-01-01');
  const to = new Date(document.getElementById('toDate').value || '2100-01-01');
  const type = document.querySelector('input[name="dataSet"]:checked').value;
  const source = type === 'HSN' ? HSN : type === 'b2b' ? b2b : b1b;

  filteredData = source.filter(r => {
    const dParts = r.Date.includes('/') ? r.Date.split('/') : r.Date.split('-');
    let d = new Date();
    if (dParts.length === 3) {
      if (r.Date.includes('/')) d = new Date(dParts[2], dParts[1] - 1, dParts[0]);
      else d = new Date(r.Date);
    }
    return d >= from && d <= to && (!r.status || r.status.toLowerCase() === 'a');
  });

  currentData = filteredData.slice();
  currentPage = 1;
  renderTable();
}

function editRow(i) {
  const type = document.querySelector('input[name="dataSet"]:checked').value;
  const row = currentData[i];
  const tr = document.querySelectorAll('#dataTable tbody tr')[i % parseInt(document.getElementById('recordsPerPage').value)];
  const editableCells = headers[type].slice(0, -2).map(key => {
    const value = row[key] ?? '';
    return `<td><input value="${value}" data-key="${key}" style="width: 100px;" /></td>`;
  });
  editableCells.push('<td>-</td>');
  editableCells.push(`<td><button onclick="saveRow(${i})">Save</button> <button onclick="cancelEditRow()">Cancel</button></td>`);
  tr.innerHTML = editableCells.join('');
}

function saveRow(i) {
  const type = document.querySelector('input[name="dataSet"]:checked').value;
  const row = currentData[i];
  const tr = document.querySelectorAll('#dataTable tbody tr')[i % parseInt(document.getElementById('recordsPerPage').value)];
  const inputs = tr.querySelectorAll('input');
  inputs.forEach(input => { const key = input.dataset.key; row[key] = input.value; });
  renderTable();
}

function cancelEditRow() { renderTable(); }

function deleteRow(i) {
  currentData[i]._deleted = true;
  renderTable();
}
