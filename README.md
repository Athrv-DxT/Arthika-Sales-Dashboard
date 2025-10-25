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

## 🚀 Deployment

### Render Deployment

1. **Connect to Render**:
   - Push your code to GitHub
   - Connect your GitHub repository to Render
   - Render will automatically detect the Python project

2. **Environment Variables** (if needed):
   - `FLASK_ENV=production`
   - `PORT=10000` (automatically set by Render)

3. **Deploy**:
   - Render will automatically build and deploy your application
   - Your dashboard will be available at the provided Render URL

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd Sales-Dashboard
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

4. **Access the dashboard**:
   - Open your browser and go to `http://localhost:10000`

## 📁 Project Structure

```
Sales-Dashboard/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── render.yaml           # Render deployment config
├── .gitignore            # Git ignore file
├── README.md             # Project documentation
├── RENDER_DEPLOYMENT.md  # Render deployment guide
├── static/
│   ├── app.js            # Frontend JavaScript
│   └── style.css         # Styling and themes
└── templates/
    └── index.html        # Main dashboard template
```

## 🎨 UI Features

- **Dark Theme**: Modern dark interface with glass morphism effects
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Interactive Charts**: Hover effects and detailed tooltips
- **Loading States**: Smooth loading indicators and error handling
- **Accessibility**: ARIA labels and keyboard navigation support

## 📱 Mobile Support

The dashboard is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile phones
- Touch interactions

## 🎯 Performance

- **Optimized Loading**: Efficient data processing and caching
- **Real-time Updates**: Configurable polling for live data
- **Error Handling**: Comprehensive error management
- **Export Functions**: Fast CSV and PDF generation

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support or questions, please open an issue in the GitHub repository.
