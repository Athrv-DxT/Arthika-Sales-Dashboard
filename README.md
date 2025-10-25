# अRthika - Sales Dashboard

A modern, interactive sales dashboard with real-time analytics, forecasting, and data visualization.

##  Features

- **Real-time Analytics**: Live sales data with interactive charts
- **Advanced Forecasting**: Multiple algorithms including linear regression, moving averages, and seasonal patterns
- **Product Clustering**: K-means clustering for sales pattern analysis
- **Interactive Filters**: Region, product, and date range filtering
- **Export Capabilities**: CSV and PDF export functionality
- **Responsive Design**: Mobile-friendly interface with dark theme
- **Modern UI**: Glass morphism design with beautiful typography

##  Tech Stack

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript
- **Charts**: Chart.js
- **Analytics**: Pandas, NumPy, Scikit-learn
- **Fonts**: Google Fonts (Poppins, Inter)

## 📊 Data Source

The dashboard fetches data from a mock sales API:
```
https://68d424b8214be68f8c6887f1.mockapi.io/api/mozilla/tech/web/task/sales
```
## 📈 Analytics Features

- **KPIs**: Total revenue, quantity, and period-over-period changes
- **Time Series**: Daily sales trends with interactive line charts
- **Regional Analysis**: Sales distribution by region with pie charts
- **Top Products**: Best performing products by quantity and revenue
- **Forecasting**: Multiple forecasting algorithms with configurable periods
- **Clustering**: Product clustering based on sales patterns

## 🔧 API Endpoints

- `GET /` - Main dashboard
- `GET /api/analytics` - Analytics data with filters
- `GET /api/sales` - Raw sales data
- `GET /api/export.csv` - CSV export with filters