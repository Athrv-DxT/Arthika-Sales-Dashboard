// static/app.js
const ANALYTICS_API = '/api/analytics';
const RAW_API = '/api/sales';
let timeseriesChart = null, regionPie = null, forecastChart = null, clusterChart = null;
let pollInterval = null;
let isLoading = false;

// Utility functions
function fmtMoney(v) { 
  return v == null ? '—' : '₹' + Number(v).toLocaleString(); 
}

function showLoading() {
  isLoading = true;
  document.getElementById('loading-indicator').style.display = 'block';
  document.getElementById('error-message').style.display = 'none';
  document.getElementById('dashboard').classList.add('loading');
}

function hideLoading() {
  isLoading = false;
  document.getElementById('loading-indicator').style.display = 'none';
  document.getElementById('dashboard').classList.remove('loading');
}

function showError(message) {
  hideLoading();
  const errorDiv = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');
  errorText.textContent = message;
  errorDiv.style.display = 'block';
  showNotification('Error: ' + message, 'error');
}

function showNotification(message, type = 'info') {
  const container = document.getElementById('notification-container');
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
    </div>
  `;
  container.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}


function togglePolling(enabled) {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  
  if (enabled) {
    pollInterval = setInterval(fetchAndRender, 10000);
    showNotification('Real-time updates enabled', 'success');
  } else {
    showNotification('Real-time updates disabled', 'info');
  }
}

function updateForecastDays() {
  const days = document.getElementById('forecast-days').value;
  // Add forecast days parameter to query and refresh
  const qp = buildQueryParams();
  const url = ANALYTICS_API + qp + (qp ? '&' : '?') + 'forecast_days=' + days;
  
  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (!data.error) {
        renderAnalytics(data);
        showNotification(`Forecast updated for ${days} days`, 'success');
      }
    })
    .catch(error => {
      console.error('Error updating forecast:', error);
      showNotification('Failed to update forecast', 'error');
    });
}

function updateClusterCount() {
  const count = document.getElementById('cluster-count').value;
  const qp = buildQueryParams();
  const url = ANALYTICS_API + qp + (qp ? '&' : '?') + 'k=' + count;
  
  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (!data.error) {
        renderAnalytics(data);
        showNotification(`Clustering updated with ${count} clusters`, 'success');
      }
    })
    .catch(error => {
      console.error('Error updating clusters:', error);
      showNotification('Failed to update clustering', 'error');
    });
}

async function loadMetadataAndInitial() {
  try {
    showLoading();
    const res = await fetch(ANALYTICS_API);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const j = await res.json();
    
    if (j.error) {
      throw new Error(j.error);
    }
    
    populateFilterControls(j.metadata || {});
    renderAnalytics(j);
    showNotification('Dashboard loaded successfully', 'success');
  } catch (error) {
    console.error('Failed to load initial data:', error);
    showError(`Failed to load dashboard data: ${error.message}`);
  } finally {
    hideLoading();
  }
}

function buildQueryParams(){
  const params = new URLSearchParams();
  const region = document.getElementById('region-select').value;
  const product = document.getElementById('product-select').value;
  const from = document.getElementById('from-date').value;
  const to = document.getElementById('to-date').value;
  if(region && region !== 'all') params.set('region', region);
  if(product && product !== 'all') params.set('product', product);
  if(from) params.set('from', from);
  if(to) params.set('to', to);
  return params.toString() ? '?'+params.toString() : '';
}

async function fetchAndRender() {
  if (isLoading) return; // Preventa simultaneous requests
  
  try {
    showLoading();
    const qp = buildQueryParams();
    const res = await fetch(ANALYTICS_API + qp);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const j = await res.json();
    
    if (j.error) {
      throw new Error(j.error);
    }
    
    renderAnalytics(j);
    
    if (!pollInterval) {
      showNotification('Data refreshed successfully', 'success');
    }
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    showError(`Failed to refresh data: ${error.message}`);
  } finally {
    hideLoading();
  }
}

function populateFilterControls(metadata){
  const rsel = document.getElementById('region-select');
  const psel = document.getElementById('product-select');
  rsel.innerHTML = '<option value="all">All</option>' + (metadata.regions || []).map(r=>`<option value="${r}">${r}</option>`).join('');
  psel.innerHTML = '<option value="all">All</option>' + (metadata.products || []).map(p=>`<option value="${p}">${p}</option>`).join('');
}

function renderAnalytics(data) {
  if (data.error) {
    console.error('Analytics error', data);
    showError(data.error);
    return;
  }
  
  // Hide error message if data load successfully
  document.getElementById('error-message').style.display = 'none';
  
  const revenueEl = document.getElementById('total-revenue');
  const quantityEl = document.getElementById('total-quantity');
  const popEl = document.getElementById('pop-change');
  
  revenueEl.textContent = fmtMoney(data.kpis.total_revenue);
  quantityEl.textContent = (data.kpis.total_quantity || 0).toLocaleString();
  
  const popChange = data.period_over_period_pct || 0;
  popEl.textContent = popChange.toFixed(1) + '%';
  
  const popKpi = popEl.closest('.kpi');
  popKpi.classList.remove('positive', 'negative');
  if (popChange > 0) {
    popKpi.classList.add('positive');
  } else if (popChange < 0) {
    popKpi.classList.add('negative');
  }

  try {
    const ts = data.timeseries || [];
    const labels = ts.map(r => r.date);
    const values = ts.map(r => r.revenue);
    const ctx = document.getElementById('timeseries-chart').getContext('2d');
    
    if (timeseriesChart) timeseriesChart.destroy();
    
    timeseriesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue',
          data: values,
          fill: true,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '₹' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error rendering timeseries chart:', error);
  }

  try {
    const rd = data.region_distribution || [];
    const rlabels = rd.map(r => r.region);
    const rvals = rd.map(r => r.revenue);
    const ctx2 = document.getElementById('region-pie').getContext('2d');
    
    if (regionPie) regionPie.destroy();
    
    regionPie = new Chart(ctx2, {
      type: 'pie',
      data: {
        labels: rlabels,
        datasets: [{
          data: rvals,
          backgroundColor: [
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#ef4444',
            '#8b5cf6'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      }
    });
  } catch (error) {
    console.error('Error rendering region pie chart:', error);
  }

  // Top products
  try {
    const topDiv = document.getElementById('top-products');
    const byQty = data.top_products_qty || [];
    const byRev = data.top_products_revenue || [];
    
    if (byQty.length === 0 && byRev.length === 0) {
      topDiv.innerHTML = '<div class="loading-placeholder">No product data available</div>';
    } else {
      topDiv.innerHTML = `
        <div class="product-lists">
          <div class="product-list">
            <h4>By Quantity</h4>
            <ol>${byQty.map(t => `<li>${t.product} — ${t.quantity.toLocaleString()} units</li>`).join('')}</ol>
          </div>
          <div class="product-list">
            <h4>By Revenue</h4>
            <ol>${byRev.map(t => `<li>${t.product} — ${fmtMoney(t.revenue)}</li>`).join('')}</ol>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error rendering top products:', error);
  }

  // Enhanced Forecast chart
  try {
    const forecast = data.forecast || {dates: [], values: [], ma: [], exponential_smooth: [], seasonal: []};
    const fctx = document.getElementById('forecast-chart').getContext('2d');
    
    if (forecastChart) forecastChart.destroy();
    
    if (forecast.dates.length > 0) {
      const datasets = [
        {
          label: 'Actual + Linear Forecast',
          data: forecast.values,
          fill: false,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          pointRadius: 3
        }
      ];
      
      if (forecast.ma && forecast.ma.some(v => v !== null)) {
        datasets.push({
          label: 'Moving Average (3)',
          data: forecast.ma,
          fill: false,
          borderColor: '#10b981',
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 2
        });
      }
      
      if (forecast.exponential_smooth && forecast.exponential_smooth.length > 0) {
        datasets.push({
          label: 'Exponential Smoothing',
          data: forecast.exponential_smooth,
          fill: false,
          borderColor: '#f59e0b',
          borderDash: [3, 3],
          tension: 0.4,
          pointRadius: 2
        });
      }
      
      if (forecast.seasonal && forecast.seasonal.length > 0) {
        datasets.push({
          label: 'Seasonal Pattern',
          data: forecast.seasonal,
          fill: false,
          borderColor: '#8b5cf6',
          borderDash: [1, 1],
          tension: 0.4,
          pointRadius: 1
        });
      }
      
      forecastChart = new Chart(fctx, {
        type: 'line',
        data: {
          labels: forecast.dates,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString();
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '₹' + value.toLocaleString();
                }
              }
            },
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          }
        }
      });
    } else {
      fctx.clearRect(0, 0, fctx.canvas.width, fctx.canvas.height);
    }
  } catch (error) {
    console.error('Error rendering forecast chart:', error);
  }

  try {
    const clusters = data.clusters || [];
    const clusterStats = data.cluster_stats || {};
    const ctx3 = document.getElementById('cluster-chart').getContext('2d');
    
    if (clusterChart) clusterChart.destroy();
    
    if (clusters.length > 0) {
      // Group by cluster
      const grouped = {};
      clusters.forEach(p => {
        const c = 'Cluster ' + (p.cluster + 1);
        grouped[c] = grouped[c] || [];
        grouped[c].push({
          x: p.quantity, 
          y: p.revenue, 
          label: p.product,
          avgUnitPrice: p.avg_unit_price,
          salesFrequency: p.sales_frequency
        });
      });
      
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      const datasets = Object.keys(grouped).map((k, i) => ({
        label: k,
        data: grouped[k],
        showLine: false,
        pointRadius: 8,
        backgroundColor: colors[i % colors.length],
        borderColor: colors[i % colors.length],
        borderWidth: 2
      }));
      
      clusterChart = new Chart(ctx3, {
        type: 'scatter',
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              callbacks: {
                title: function(context) {
                  return context[0].raw.label;
                },
                label: function(context) {
                  const point = context.raw;
                  return [
                    `Quantity: ${point.x.toLocaleString()} units`,
                    `Revenue: ₹${point.y.toLocaleString()}`,
                    `Avg Unit Price: ₹${point.avgUnitPrice.toLocaleString()}`,
                    `Sales Frequency: ${point.salesFrequency} times`
                  ];
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Quantity Sold',
                font: { size: 12 }
              },
              ticks: {
                callback: function(value) {
                  return value.toLocaleString();
                }
              }
            },
            y: {
              title: {
                display: true,
                text: 'Revenue (₹)',
                font: { size: 12 }
              },
              ticks: {
                callback: function(value) {
                  return '₹' + value.toLocaleString();
                }
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'point'
          }
        }
      });
      
      const clusterInfoDiv = document.createElement('div');
      clusterInfoDiv.className = 'cluster-info';
      clusterInfoDiv.innerHTML = '<h4>Cluster Analysis</h4>';
      
      Object.keys(clusterStats).forEach(clusterKey => {
        const stats = clusterStats[clusterKey];
        clusterInfoDiv.innerHTML += `
          <div class="cluster-stat">
            <strong>${clusterKey.replace('_', ' ').toUpperCase()}</strong>
            <ul>
              <li>Products: ${stats.count}</li>
              <li>Avg Quantity: ${stats.avg_quantity.toLocaleString()}</li>
              <li>Avg Revenue: ₹${stats.avg_revenue.toLocaleString()}</li>
              <li>Total Revenue: ₹${stats.total_revenue.toLocaleString()}</li>
            </ul>
          </div>
        `;
      });
      
      const chartContainer = ctx3.canvas.parentElement;
      const existingInfo = chartContainer.parentElement.querySelector('.cluster-info');
      if (existingInfo) {
        existingInfo.remove();
      }
      chartContainer.parentElement.appendChild(clusterInfoDiv);
      
    } else {
      ctx3.clearRect(0, 0, ctx3.canvas.width, ctx3.canvas.height);
    }
  } catch (error) {
    console.error('Error rendering cluster chart:', error);
  }
}

function resetFilters(){
  document.getElementById('region-select').value = 'all';
  document.getElementById('product-select').value = 'all';
  document.getElementById('from-date').value = '';
  document.getElementById('to-date').value = '';
  fetchAndRender();
}

function exportCSV(){
  const qp = buildQueryParams();
  window.location = '/api/export.csv' + qp;
}

function buildQueryParams(){
  const params = new URLSearchParams();
  const region = document.getElementById('region-select').value;
  const product = document.getElementById('product-select').value;
  const from = document.getElementById('from-date').value;
  const to = document.getElementById('to-date').value;
  if(region && region !== 'all') params.set('region', region);
  if(product && product !== 'all') params.set('product', product);
  if(from) params.set('from', from);
  if(to) params.set('to', to);
  return params.toString() ? '?'+params.toString() : '';
}

async function exportPDF(){
  const node = document.getElementById('dashboard');
  const canvas = await html2canvas(node, {scale:2});
  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('landscape','pt','a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save('dashboard.pdf');
}

// Event listeners
document.getElementById('apply-filters').addEventListener('click', fetchAndRender);
document.getElementById('reset-filters').addEventListener('click', resetFilters);
document.getElementById('export-csv').addEventListener('click', exportCSV);
document.getElementById('export-pdf').addEventListener('click', exportPDF);
document.getElementById('retry-loading').addEventListener('click', loadMetadataAndInitial);

document.getElementById('enable-polling').addEventListener('change', function(e) {
  togglePolling(e.target.checked);
});

document.getElementById('apply-forecast').addEventListener('click', updateForecastDays);
document.getElementById('apply-cluster').addEventListener('click', updateClusterCount);

document.addEventListener('keydown', function(e) {
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case 'r':
        e.preventDefault();
        fetchAndRender();
        break;
      case 'e':
        e.preventDefault();
        exportCSV();
        break;
    }
  }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
  if (document.hidden && pollInterval) {
    clearInterval(pollInterval);
  } else if (!document.hidden && document.getElementById('enable-polling').checked) {
    // Resume polling when page becomes visible
    pollInterval = setInterval(fetchAndRender, 10000);
  }
});

// Initial load
document.addEventListener('DOMContentLoaded', function() {
  loadMetadataAndInitial();
});
