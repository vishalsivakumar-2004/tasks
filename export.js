function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape');
  doc.text("Sales Report", 14, 10);
  const type = document.querySelector('input[name="dataSet"]:checked').value;
  let sums = { grand:0 };
  const tableBody = filteredData.map(row => {
    let grandRow = 0;
    if (type === 'HSN') grandRow = (Number(row.total) || 0) + (Number(row.cgst) || 0) + (Number(row.sgst) || 0) + (Number(row.igst) || 0);
    else if (type === 'b2b') grandRow = (Number(row["Total INVOICE VALUE"]) || 0) + (Number(row.cgst) || 0) + (Number(row.sgst) || 0) + (Number(row.Igst) || 0);
    else if (type === 'b1b') grandRow = (Number(row["tax exclude invoice total"]) || 0) + (Number(row.sgst) || 0) + (Number(row.cgst) || 0) + (Number(row.igst) || 0);
    sums.grand += grandRow;
    return headers[type].slice(0, -1).map(key => key === "Grand Total" ? grandRow.toFixed(2) : (row[key] ?? ''));
  });
  tableBody.push(Array(headers[type].length - 1).fill('').map((v, i) => i === headers[type].length - 2 ? sums.grand.toFixed(2) : ''));
  doc.autoTable({ head: [headers[type].slice(0, -1)], body: tableBody, startY: 20, headStyles: { fillColor: [255,0,0] } });
  doc.save('report.pdf');
}

function exportExcel() {
  const type = document.querySelector('input[name="dataSet"]:checked').value;
  const ws_data = [headers[type].slice(0, -1)];
  let sums = { grand:0 };
  filteredData.forEach(row => {
    let grandRow = 0;
    if (type === 'HSN') grandRow = (Number(row.total) || 0) + (Number(row.cgst) || 0) + (Number(row.sgst) || 0) + (Number(row.igst) || 0);
    else if (type === 'b2b') grandRow = (Number(row["Total INVOICE VALUE"]) || 0) + (Number(row.cgst) || 0) + (Number(row.sgst) || 0) + (Number(row.Igst) || 0);
    else if (type === 'b1b') grandRow = (Number(row["tax exclude invoice total"]) || 0) + (Number(row.sgst) || 0) + (Number(row.cgst) || 0) + (Number(row.igst) || 0);
    sums.grand += grandRow;
    ws_data.push(headers[type].slice(0, -1).map(key => key === "Grand Total" ? grandRow.toFixed(2) : (row[key] ?? '')));
  });
  ws_data.push(Array(headers[type].length - 1).fill('').map((v, i) => i === headers[type].length - 2 ? sums.grand.toFixed(2) : ''));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, 'report.xlsx');
}



function printRow(i) {
  const type = document.querySelector('input[name="dataSet"]:checked').value;
  const row = currentData[i];
  let table = `<table border="1"><thead><tr>`;
  headers[type].forEach(h => { if (h !== "Actions") table += `<th>${h}</th>`; });
  table += `</tr></thead><tbody><tr>`;
  headers[type].slice(0, -2).forEach(key => { table += `<td>${row[key] ?? ''}</td>`; });
  table += `<td>-</td></tr></tbody></table>`;
  const win = window.open();
  win.document.write(table);
  win.print();
}