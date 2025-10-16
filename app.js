// app.js

const RENDER_PUBLIC_URL = 'https://[ชื่อโปรเจกต์ของคุณ].onrender.com'; // **รอใส่ URL จริง**

const API_URL = RENDER_PUBLIC_URL + '/predict';
const TRAINING_API_URL = RENDER_PUBLIC_URL + '/training-info';

// ฟังก์ชันคำนวณและแสดงผลกำไร
function updateProfit() {
    const revenue = parseFloat(document.getElementById('Revenue').value) || 0;
    const expenses = parseFloat(document.getElementById('Expenses').value) || 0;
    const profit = revenue - expenses;
    document.getElementById('ProfitDisplay').value = profit
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ฟังก์ชันเปรียบเทียบรายได้กับค่าเฉลี่ยอุตสาหกรรม
const BENCHMARK_REVENUE = 1200000;

function checkBenchmark() {
    const revenueInput = parseFloat(document.getElementById('Revenue').value) || 0;
    const feedbackDiv = document.getElementById('revenue-feedback');
    feedbackDiv.className = 'benchmark-feedback';

    if (revenueInput > BENCHMARK_REVENUE * 1.1) {
        feedbackDiv.innerHTML = '📈 รายได้สูงกว่าค่าเฉลี่ยอุตสาหกรรม';
        feedbackDiv.classList.add('high');
    } else if (revenueInput < BENCHMARK_REVENUE * 0.9) {
        feedbackDiv.innerHTML = '📉 รายได้ต่ำกว่าค่าเฉลี่ยอุตสาหกรรม';
        feedbackDiv.classList.add('low');
    } else {
        feedbackDiv.innerHTML = '📊 รายได้ใกล้เคียงค่าเฉลี่ย';
        feedbackDiv.classList.add('neutral');
    }
}

// Event สำหรับ input
document.getElementById('Revenue').addEventListener('input', updateProfit);
document.getElementById('Expenses').addEventListener('input', updateProfit);
document.getElementById('Revenue').addEventListener('input', checkBenchmark);

// เรียกใช้เมื่อโหลดหน้า
updateProfit();
checkBenchmark();

// Event สำหรับ submit form
document.getElementById('taxRiskForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.classList.add('is-loading');
    submitButton.innerHTML = '';

    const form = event.target;

    const inputData = {
        "Revenue": parseFloat(form.Revenue.value),
        "Expenses": parseFloat(form.Expenses.value),
        "Tax_Liability": 50000.0,
        "Tax_Paid": 45000.0,
        "Late_Filings": 0.0,
        "Compliance_Violations": 0.0,
        "Industry": form.Industry.value,
        "Profit": parseFloat(form.Revenue.value) - parseFloat(form.Expenses.value),
        "Tax_Compliance_Ratio": 0.9,
        "Audit_Findings": 1.0,
        "Audit_to_Tax_Ratio": 0.0
    };

    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(inputData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const resultDiv = document.getElementById('result');
        const meterDisplay = document.getElementById('risk-meter-display');

        resultDiv.className = '';
        resultDiv.classList.add('risk-success');

        if (data.status === 'success') {
            const risk = data.tax_risk_label;
            let message = '';
            let riskClass = '';

            if (risk === 'High') {
                riskClass = 'risk-high';
                message = '🚨 ความเสี่ยงสูง: แนะนำปรึกษาผู้เชี่ยวชาญ';
            } else if (risk === 'Medium') {
                riskClass = 'risk-medium';
                message = '⚠️ ความเสี่ยงปานกลาง: ควรปรับปรุงการจัดเก็บเอกสาร';
            } else {
                riskClass = 'risk-low';
                message = '✅ ความเสี่ยงต่ำ: การจัดการภาษีเป็นไปตามเกณฑ์';
            }

            resultDiv.classList.add(riskClass);
            meterDisplay.innerHTML = `<div>ความเสี่ยงระดับ ${risk}</div><p class="risk-message">${message}</p>`;
        } else {
            resultDiv.classList.add('risk-error');
            meterDisplay.innerHTML = `❌ การประเมินล้มเหลว: ${data.error}`;
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);

        const resultDiv = document.getElementById('result');
        resultDiv.className = '';
        resultDiv.classList.add('risk-error');
        resultDiv.innerHTML = `❌ ไม่สามารถเชื่อมต่อกับ Server ได้: ${error.message}`;
    })
    .finally(() => {
        submitButton.classList.remove('is-loading');
        submitButton.innerHTML = 'ประเมินความเสี่ยง';
    });
});

function loadTrainingData() {
    fetch(TRAINING_API_URL)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const tableBody = document.querySelector('#training-table tbody');
                tableBody.innerHTML = '';
                data.training_runs.forEach(run => {
                    const row = tableBody.insertRow();
                    if (run.status === "Selected (Final)") {
                        row.classList.add('selected-model');
                    }
                    row.insertCell().innerHTML = `<strong>${run.model_name}</strong><br><small>${run.features}</small>`;
                    row.insertCell().textContent = run.parameters;
                    row.insertCell().textContent = run.accuracy;
                    row.insertCell().textContent = run.status;
                });
                const final = data.final_model;
                document.getElementById('final-model-name').textContent = final.model_name;
                document.getElementById('final-model-acc').textContent = final.accuracy;
            } else {
                console.error("Failed to load training data:", data.error);
                document.getElementById('training-section').innerHTML = "<p style='color:red;'>ไม่สามารถโหลดรายงานผลการฝึก AI ได้</p>";
            }
        })
        .catch(error => {
            console.error('Error fetching training data:', error);
            document.getElementById('training-section').innerHTML = "<p style='color:red;'>เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อดึงรายงาน AI</p>";
        });
}

document.addEventListener('DOMContentLoaded', loadTrainingData);